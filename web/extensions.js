import { CATEGORIES, SAMPLE_CSV, SAMPLE_MESSAGES, parseImport, validateDraft, transactionKey, summarizeTransactions } from './imports.js';
import { evidenceFor } from './insights.js';
import { predictCategory } from './category-model.js';

const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value/100);
const JOURNAL='allowance:journal:v1';
export function setupExtensions({getPlan,getPurchase,isDirty}){
  let transactions=[],drafts=[],replaceMode=false,undo=null,delayDays=3,revision=0;
  let aiAvailable=false,aiBusy=false,serverAIAvailable=false,sessionKey='';
  try{
    const saved=JSON.parse(localStorage.getItem(JOURNAL)||'[]');
    if(!Array.isArray(saved)||saved.length>1000)throw new Error('Invalid saved history.');
    const ids=new Set();
    transactions=saved.map(item=>{
      if(typeof item.id!=='string'||!item.id||ids.has(item.id)||!Number.isSafeInteger(item.amountPaise))throw new Error('Invalid saved transaction.');
      ids.add(item.id);
      return validateDraft({...item,amount:String(item.amountPaise/100)});
    });
    summarizeTransactions(transactions);
  }catch{$('journal-storage').textContent='Saved history could not be restored. Import or review a new sample.';}
  function showError(message=''){$('import-error').textContent=message;$('import-error').hidden=!message;}
  function saveHistory(){
    try{localStorage.setItem(JOURNAL,JSON.stringify(transactions));$('journal-storage').textContent='History saved on this browser. Your forecast balance is unchanged.';}
    catch{$('journal-storage').textContent='Browser storage is unavailable. History is available for this session.';}
    renderSummary();
  }
  function renderSummary(){
    $('journal-count').textContent=transactions.length?`${transactions.length} saved transactions`:'No imports yet';
    $('review-history').hidden=!transactions.length;$('clear-history').hidden=!transactions.length;$('undo-history').hidden=!undo;
    if(!transactions.length){$('spending-summary').innerHTML='<p class="empty-note">Start with the fictional sample. It includes a duplicate, an own-account transfer and a refund to review.</p>';return;}
    const summary=summarizeTransactions(transactions);
    const dates=transactions.map(item=>item.date).sort();
    const totals=[['Spending (debits)',summary.spendingPaise],['Income',summary.incomePaise],['Refunds received',summary.refundsPaise],['Own-account transfers',summary.transfersPaise]];
    $('spending-summary').innerHTML=`<p class="field-help">${dates[0]} to ${dates.at(-1)}. Imported history only.</p><dl>${totals.map(([label,value])=>`<div><dt>${label}</dt><dd>${escape(money(value))}</dd></div>`).join('')}</dl><h3>Where it went</h3><dl>${Object.entries(summary.categories).sort((a,b)=>b[1]-a[1]).map(([category,value])=>`<div><dt>${escape(category)}</dt><dd>${escape(money(value))}</dd></div>`).join('')}</dl><p class="field-help">Transfers and incoming refunds are kept separate from spending. No imported amount is deducted from your opening balance again.</p>`;
  }
  function readDrafts(){
    return [...$('draft-rows').children].map((row,index)=>{
      const get=field=>row.querySelector(`[data-field="${field}"]`).value;
      return {...drafts[index],date:get('date'),description:get('description'),amount:get('amount'),direction:get('direction'),category:get('category'),reference:get('reference'),included:row.querySelector('[data-field="included"]').checked};
    });
  }
  function renderDrafts(){
    $('review-panel').hidden=false;
    const duplicates=drafts.filter(item=>item.duplicate).length;
    $('review-summary').textContent=`${drafts.length} rows · ${duplicates} possible duplicate${duplicates===1?'':'s'} · ${replaceMode?'editing saved history':'new import'}`;
    $('draft-rows').replaceChildren(...drafts.map((draft,index)=>{
      const row=document.createElement('fieldset');row.className='draft-row';
      const prefix=`draft-${index}`;
      const input=(field,label,type,value,extra='')=>`<div><label for="${prefix}-${field}">${label}</label><input id="${prefix}-${field}" data-field="${field}" type="${type}" value="${escape(value)}" ${extra}></div>`;
      row.innerHTML=`<legend>TRANSACTION ${index+1}${draft.duplicate?' · POSSIBLE DUPLICATE':''}</legend><div class="draft-grid">${input('date','Date','date',draft.date)}${input('description','Description','text',draft.description,'maxlength="120"')}${input('amount','Amount (INR)','number',draft.amount,'min="0.01" step="0.01"')}<div><label for="${prefix}-direction">Direction</label><select id="${prefix}-direction" data-field="direction"><option value="">Choose direction</option><option value="debit">Debit</option><option value="credit">Credit</option><option value="transfer">Own transfer</option></select></div><div><label for="${prefix}-category">Category</label><select id="${prefix}-category" data-field="category">${CATEGORIES.map(value=>`<option>${value}</option>`).join('')}</select></div><div class="draft-reference"><label for="${prefix}-reference">Reference (optional)</label><input id="${prefix}-reference" data-field="reference" value="${escape(draft.reference)}" maxlength="80"></div></div><label class="include-row"><input type="checkbox" data-field="included" ${draft.included?'checked':''}>${draft.duplicate?'Keep possible duplicate':'Include this transaction'}</label><p class="field-help category-note">${escape(draft.note||'Rule-based category suggestion. Review before saving.')}</p>${draft.issue?`<p class="field-help negative">${escape(draft.issue)}</p>`:''}`;
      row.querySelector('[data-field=direction]').value=draft.direction;
      row.querySelector('[data-field=category]').value=draft.category;
      row.querySelector('[data-field=category]').addEventListener('change',()=>{row.querySelector('.category-note').textContent='Your category correction.';});
      return row;
    }));
    $('category-status').textContent='';
  }
  $('load-import-sample').addEventListener('click',()=>{
    $('import-text').value=$('import-format').value==='csv'?SAMPLE_CSV:SAMPLE_MESSAGES;
    showError();$('import-text').focus();
  });
  $('download-import-sample').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([SAMPLE_CSV],{type:'text/csv'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='allowance-sample.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('import-file').addEventListener('change',async()=>{
    const file=$('import-file').files[0];if(!file)return;
    try{if(file.size>65536)throw new Error('Choose a CSV file under 64 KB.');$('import-text').value=await file.text();$('import-format').value='csv';showError();}
    catch(issue){showError(issue.message);}
  });
  $('import-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{drafts=parseImport($('import-text').value,$('import-format').value,transactions);replaceMode=false;renderDrafts();showError();$('review-heading').focus();}
    catch(issue){showError(issue.message);}
  });
  $('cancel-import').addEventListener('click',()=>{$('review-panel').hidden=true;drafts=[];showError();$('import-text').focus();});
  $('apply-import').addEventListener('click',()=>{
    try{
      drafts=readDrafts();
      const base=replaceMode?[]:transactions;
      const selected=drafts.filter(item=>item.included);
      if(!selected.length&&!replaceMode)throw new Error('Select at least one transaction to save.');
      if(base.length+selected.length>1000)throw new Error('This edition supports up to 1,000 saved transactions.');
      const keys=new Set(base.map(transactionKey));let duplicateFound=false;
      const validated=[];
      for(const draft of selected){
        const item=validateDraft(draft);const key=transactionKey(item);
        if(keys.has(key)&&!draft.duplicate){draft.duplicate=true;draft.included=false;draft.issue='Possible duplicate found after editing. Review and explicitly choose whether to keep it.';duplicateFound=true;}
        keys.add(key);validated.push(item);
      }
      if(duplicateFound){renderDrafts();throw new Error('Review the newly detected duplicates before saving.');}
      const ids=new Set(base.map(item=>item.id));let sequence=0;
      const added=validated.map(item=>{let id=replaceMode?item.id:`transaction-${sequence++}`;while(ids.has(id))id+='-';ids.add(id);return {...item,id};});
      const candidate=[...base,...added];summarizeTransactions(candidate);
      undo=structuredClone(transactions);transactions=candidate;
      saveHistory();$('review-panel').hidden=true;$('import-text').value='';$('import-file').value='';showError();
    }catch(issue){showError(issue.message);}
  });
  $('review-history').addEventListener('click',()=>{
    drafts=transactions.map(item=>({...item,amount:String(item.amountPaise/100),included:true,duplicate:false,issue:'',note:'Saved category. Edit only what needs correcting.'}));replaceMode=true;renderDrafts();$('review-heading').focus();
  });
  function clearHistory(){undo=structuredClone(transactions);transactions=[];$('review-panel').hidden=true;saveHistory();}
  $('clear-history').addEventListener('click',clearHistory);
  $('undo-history').addEventListener('click',()=>{if(undo){transactions=undo;undo=null;$('review-panel').hidden=true;saveHistory();}});
  function refresh(){
    revision++;
    const evidence=evidenceFor(getPlan(),getPurchase(),delayDays);
    const delayed=evidence.delayed.proposed;
    $('delay-result').textContent=`With income delayed by ${delayDays} day${delayDays===1?'':'s'}, the lowest balance with this purchase is ${money(delayed.minimumBalancePaise)}. ${delayed.firstShortfallDate?`First shortfall: ${delayed.firstShortfallDate}.`:'No shortfall within this period.'}`;
    $('delay-result').classList.toggle('negative',delayed.minimumBalancePaise<0);
    $('evidence-list').innerHTML=evidence.facts.map(fact=>`<div><dt>${escape(fact.label)}</dt><dd>${escape(fact.type==='money'?money(fact.value):fact.value)}</dd></div>`).join('');
    if($('ai-output').textContent)$('ai-output').textContent='The plan changed. Request a fresh AI interpretation for the updated evidence.';
  }
  $('delay-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{if(isDirty())throw new Error('Apply your plan changes before testing an income delay.');const value=Number($('delay-days').value);evidenceFor(getPlan(),getPurchase(),value);delayDays=value;refresh();}
    catch(issue){$('delay-result').textContent=issue.message;}
  });
  function setBusy(value){aiBusy=value;$('explain-ai').disabled=!aiAvailable||value;}
  async function requestAI(payload){
    if(!$('ai-consent').checked)throw new Error('Choose whether to share the displayed data with Gemini before requesting AI.');
    if(aiBusy)throw new Error('An AI request is already in progress.');
    setBusy(true);
    try{
      const response=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,consent:true,...(sessionKey?{sessionKey}:{})}),signal:AbortSignal.timeout(30000)});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'AI is unavailable.');
      if(result.source!=='live-ai')throw new Error('AI source could not be verified.');return result;
    }finally{setBusy(false);}
  }
  $('explain-ai').addEventListener('click',async()=>{
    try{
      if(isDirty())throw new Error('Apply your edited plan or purchase before requesting an explanation.');
      if(Number($('delay-days').value)!==delayDays)throw new Error('Select Test income delay to apply the edited delay first.');
      const version=revision;$('ai-output').textContent='Preparing an interpretation of the calculated evidence.';
      const result=await requestAI({action:'explain',plan:getPlan(),purchase:getPurchase(),delayDays});
      if(version!==revision){$('ai-output').textContent='The plan changed during the request. Request a fresh interpretation.';return;}
      $('ai-output').innerHTML=`<p class="eyebrow">LIVE AI INTERPRETATION · GEMINI</p><p>${escape(result.overview)}</p><p>${escape(result.suggestion)}</p><h3>Evidence referenced</h3><dl>${result.evidence.map(fact=>`<div><dt>${escape(fact.label)}</dt><dd>${escape(fact.type==='money'?money(fact.value):fact.value)}</dd></div>`).join('')}</dl>`;
    }catch(issue){$('ai-output').textContent=issue.name==='TimeoutError'?'AI timed out. Your plan and calculations are unchanged.':issue.message;}
  });
  $('categorize-ai').addEventListener('click',()=>{
    try{
      drafts=readDrafts();const selected=drafts.filter(item=>item.included);
      if(!selected.length)throw new Error('Select transactions for local AI categorization.');
      for(const draft of selected){
        const item=validateDraft(draft);const prediction=predictCategory(item.description,item.direction);draft.category=prediction.category;
        draft.note=prediction.source==='direction-rule'?'Category determined by transaction direction.':prediction.confidence==='low'?'Local AI is uncertain. Please review this category.':`Local AI suggestion. Evidence words: ${prediction.tokensUsed.join(', ')}. Review before saving.`;
      }
      renderDrafts();$('category-status').textContent='On-device model suggestions are ready. No descriptions left your browser. Nothing is saved until you choose Save selected transactions.';
    }catch(issue){$('category-status').textContent=issue.message;}
  });
  fetch('/api/ai').then(response=>{if(!response.ok)throw new Error();return response.json();}).then(result=>{
    serverAIAvailable=result.available===true;aiAvailable=serverAIAvailable||Boolean(sessionKey);$('session-settings').hidden=result.sessionKeyAllowed!==true;$('ai-availability').textContent=aiAvailable?'Local AI categorization is ready. Gemini interpretations are also available on request.':result.sessionKeyAllowed?'Local AI categorization is ready. Add your Gemini key in the owner-only setup below to test explanations.':'Local AI categorization is ready in the import review. Gemini interpretations are currently unavailable.';setBusy(false);
  }).catch(()=>{$('ai-availability').textContent='Local AI categorization is ready. Optional Gemini interpretations are currently unavailable.';});
  $('session-key-form').addEventListener('submit',event=>{
    event.preventDefault();const value=$('session-key').value.trim();
    if(!/^[A-Za-z0-9_-]{20,200}$/.test(value)){$('session-key-status').textContent='Enter a valid Gemini API key.';return;}
    sessionKey=value;$('session-key').value='';aiAvailable=true;setBusy(false);
    $('session-key-status').textContent='Key held for this tab only. Select Explain this plan above to make the first live request.';
    $('ai-availability').textContent='Gemini session key supplied. It will be verified when you request an explanation.';
  });
  $('clear-session-key').addEventListener('click',()=>{sessionKey='';$('session-key').value='';aiAvailable=serverAIAvailable;setBusy(false);$('session-key-status').textContent='Session key cleared.';$('ai-availability').textContent=serverAIAvailable?'Server-configured Gemini is available.':'Local AI categorization is ready. Gemini needs a session key.';});
  renderSummary();refresh();
  return {refresh,reset(){delayDays=3;$('delay-days').value='3';$('ai-consent').checked=false;$('ai-output').textContent='';if(transactions.length)clearHistory();else{$('review-panel').hidden=true;$('import-text').value='';}refresh();}};
}
