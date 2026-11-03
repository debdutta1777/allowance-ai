import test from 'node:test';
import assert from 'node:assert/strict';
import {demoWorkspace,emptyWorkspace,validateWorkspace} from '../lib/workspace-model.ts';
import {sameOrigin,boundedJSON} from '../lib/http-security.ts';

test('new accounts have no fictional personal data; demos are independent copies',()=>{
  const empty=emptyWorkspace('2026-11-03');assert.equal(empty.plan.openingBalancePaise,0);assert.equal(empty.transactions.length,0);assert.equal(empty.plan.entries.length,0);assert.equal(validateWorkspace(empty).schemaVersion,1);
  const first=demoWorkspace();first.plan.entries[0].label='changed';assert.notEqual(demoWorkspace().plan.entries[0].label,'changed');
});
test('workspace validation accepts sparse limits and rejects invalid financial data and foreign fields',()=>{
  const data=demoWorkspace();data.budgets['2026-11']={Food:0};assert.equal(validateWorkspace(data).budgets['2026-11'].Food,0);
  assert.throws(()=>validateWorkspace({...data,user_id:'someone-else'}));
  assert.throws(()=>validateWorkspace({...data,purchase:{...data.purchase,date:'2026-02-30'}}));
  assert.throws(()=>validateWorkspace({...data,transactions:[{id:'a',date:'2026-11-01',description:'test',amountPaise:100,direction:'credit',category:'Food',reference:''}]}));
  assert.throws(()=>validateWorkspace({...data,holdings:[{id:'h',name:'test',kind:'Equity',valuePaise:-100}]}));
});
test('mutation origin checks reject absent and foreign origins; JSON reads enforce streaming byte limit',async()=>{
  assert.equal(sameOrigin(new Request('https://allowance.test/api/workspace')),false);
  assert.equal(sameOrigin(new Request('https://allowance.test/api/workspace',{headers:{Origin:'https://other.test'}})),false);
  assert.equal(sameOrigin(new Request('https://allowance.test/api/workspace',{headers:{Origin:'https://allowance.test'}})),true);
  const request=(body:string)=>new Request('https://allowance.test',{method:'POST',headers:{'Content-Type':'application/json'},body});
  await assert.rejects(()=>boundedJSON(request(JSON.stringify({pad:'x'.repeat(100)})),32),/too large/);
  assert.deepEqual(await boundedJSON(request('{"ok":true}')),{ok:true});
});
