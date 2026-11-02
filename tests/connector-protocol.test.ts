import test from 'node:test';
import assert from 'node:assert/strict';
import { invocationSchema, driverMessageSchema } from '../scripts/connector-preview/protocol.mjs';

test('connector preview accepts record arguments after the Zod security upgrade',()=>{
  const invocation={connectorId:'demo',actionName:'read',arguments:{message:'example',count:2}};
  assert.deepEqual(invocationSchema.parse(invocation),invocation);
  assert.equal(invocationSchema.safeParse({...invocation,unexpected:true}).success,false);
  assert.equal(driverMessageSchema.safeParse({jsonrpc:'2.0',id:'fadd497c-a923-4364-a1d1-5c026b1086d9',result:{ok:true}}).success,true);
});
