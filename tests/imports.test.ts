import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvRows,parseImport,validateDraft,summarizeTransactions,SAMPLE_CSV,SAMPLE_MESSAGES,transactionKey } from '../src/imports.ts';
import { forecast } from '../src/forecast.ts';
import { samplePlan } from '../src/sample.ts';
import { delayIncome,evidenceFor } from '../src/insights.ts';

test('sample excludes the duplicate and separates spending, income, refunds and transfers',()=>{
  const drafts=parseImport(SAMPLE_CSV,'csv');assert.equal(drafts.length,7);assert.equal(drafts[6].included,false);assert.equal(drafts[6].duplicate,true);
  const summary=summarizeTransactions(drafts.filter(d=>d.included).map(validateDraft));
  assert.equal(summary.spendingPaise,71000);assert.equal(summary.incomePaise,500000);assert.equal(summary.refundsPaise,10000);assert.equal(summary.transfersPaise,100000);
});
test('quoted CSV commas, escaped quotes, BOM and CRLF preserve descriptions',()=>{
  assert.deepEqual(csvRows('\uFEFFdate,description\r\n2026-11-01,"Cafe, \"\"Campus\"\""\r\n'),[['date','description'],['2026-11-01','Cafe, "Campus"']]);
});
test('malformed quotes and column counts are rejected instead of shifting amounts',()=>{
  for(const input of ['a,"unclosed','a,"closed"garbage'])assert.throws(()=>csvRows(input));
  assert.throws(()=>parseImport('date,description,amount,direction\n2026-11-01,Cafe,50','csv'),/columns/);
});
test('missing or repeated headers and unsupported amounts fail clearly',()=>{
  assert.throws(()=>parseImport('description,amount\nCafe,50','csv'),/headers/);
  assert.throws(()=>parseImport('date,date,description,amount,direction','csv'),/headers/);
  const [draft]=parseImport('date,description,amount,direction\n2026-02-30,Cafe,1e3,debit','csv');assert.match(draft.issue,/date/);assert.throws(()=>validateDraft(draft));
});
test('dated messages preserve direction, date and reference without guessing',()=>{
  const rows=parseImport(SAMPLE_MESSAGES,'messages').map(validateDraft);
  assert.equal(rows[0].reference,'DEMO001');assert.equal(rows[0].description,'Campus Canteen');assert.equal(rows[2].direction,'credit');
  assert.throws(()=>parseImport('INR 100 debited to Cafe','messages'),/unsupported/);
});
test('repeat import detects existing references and normalized reference-free duplicates',()=>{
  const previous=parseImport(SAMPLE_CSV,'csv').filter(d=>d.included).map(validateDraft);
  assert.ok(parseImport(SAMPLE_CSV,'csv',previous).every(d=>d.duplicate&&!d.included));
  const csv='date,description,amount,direction\n2026-11-01,Campus Cafe,50,debit\n2026-11-01,campus  cafe,50.00,debit';
  assert.equal(parseImport(csv,'csv')[1].duplicate,true);
});
test('different amount or date without references remains distinct',()=>{
  const a=validateDraft(parseImport('date,description,amount,direction\n2026-11-01,Cafe,50,debit','csv')[0]);
  assert.notEqual(transactionKey(a),transactionKey({...a,amountPaise:5100}));assert.notEqual(transactionKey(a),transactionKey({...a,date:'2026-11-02'}));
});
test('corrections validate categories, amounts and dates; transfers cannot count as spending',()=>{
  const draft=parseImport(SAMPLE_CSV,'csv')[0];
  assert.equal(validateDraft({...draft,amount:'200.29',category:'Education'}).amountPaise,20029);
  assert.equal(validateDraft({...draft,direction:'transfer',category:'Food'}).category,'Transfers');
  assert.throws(()=>validateDraft({...draft,amount:'-1'}));assert.throws(()=>validateDraft({...draft,category:'Imaginary' as 'Food'}));
});
test('size and row limits reject unexpectedly large imports',()=>{
  assert.throws(()=>parseImport('x'.repeat(65537),'csv'),/64 KB/);
  assert.throws(()=>parseImport('date,description,amount,direction\n'+'2026-11-01,Cafe,50,debit\n'.repeat(201),'csv'),/200/);
});
test('import is history only and never mutates the forecast balance',()=>{
  const before=forecast(samplePlan);parseImport(SAMPLE_CSV,'csv').map(d=>{if(d.included)validateDraft(d);});
  assert.deepEqual(forecast(samplePlan),before);
});
test('delayed income changes computed evidence without mutating the original plan',()=>{
  const before=JSON.stringify(samplePlan);const delayed=delayIncome(samplePlan,3);
  assert.equal(delayed.entries[2].date,'2026-11-16');assert.equal(JSON.stringify(samplePlan),before);
  const evidence=evidenceFor(samplePlan,{date:'2026-11-04',amountPaise:200000},3);
  assert.equal(evidence.delayed.proposed.minimumBalancePaise,-125000);assert.equal(evidence.facts.find(f=>f.id==='delayed-min')?.value,-125000);
  assert.throws(()=>delayIncome(samplePlan,-1));assert.throws(()=>delayIncome(samplePlan,1.5));
});
