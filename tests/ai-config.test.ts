import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAIConfig } from '../lib/ai-config.ts';
import { handleAI } from '../lib/ai-service.ts';
import { samplePlan } from '../src/sample.ts';

test('server environment config trims whitespace and treats empty keys as absent',()=>{
  const request=new Request('https://allowance.test/api/ai');
  assert.equal(resolveAIConfig(request,{GEMINI_API_KEY:'  demo-environment-key  '}).key,'demo-environment-key');
  assert.equal(resolveAIConfig(request,{GEMINI_API_KEY:' \n '}).key,undefined);
  assert.equal(resolveAIConfig(request,{GEMINI_MODEL:' gemini-3.5-flash-lite '}).model,'gemini-3.5-flash-lite');
});

test('Vercel cannot trust a spoofed Sites identity for session key access',()=>{
  const request=new Request('https://allowance.test/api/ai',{headers:{'oai-authenticated-user-id':'spoofed'}});
  assert.equal(resolveAIConfig(request,{VERCEL:'1',ALLOW_SESSION_KEYS:'true'}).allowSessionKey,false);
  assert.equal(resolveAIConfig(request,{ALLOW_SESSION_KEYS:'false'}).allowSessionKey,false);
  assert.equal(resolveAIConfig(new Request(request.url),{ALLOW_SESSION_KEYS:'true'}).allowSessionKey,false);
  assert.equal(resolveAIConfig(request,{ALLOW_SESSION_KEYS:'true'}).allowSessionKey,true);
});

test('configured environment key powers a server request without a browser key',async()=>{
  const url='https://allowance.test/api/ai';
  const environment={VERCEL:'1',GEMINI_API_KEY:'  demo-environment-key  ',GEMINI_MODEL:'gemini-3.5-flash-lite'};
  const config=resolveAIConfig(new Request(url),environment);
  const status=await (await handleAI(new Request(url),config)).json() as {available:boolean;sessionKeyAllowed:boolean};
  assert.equal(status.available,true);assert.equal(status.sessionKeyAllowed,false);
  let called=false;
  const fetcher:typeof fetch=async(target,init)=>{
    called=true;assert.match(String(target),/models\/gemini-3\.5-flash-lite:generateContent$/);
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'),'demo-environment-key');
    assert.ok(!String(init?.body).includes('demo-environment-key'));
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({overview:'Essentials need a buffer.',suggestion:'Consider postponing the purchase.',evidenceIds:['purchase-min']})}]}}]});
  };
  const request=new Request(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://allowance.test'},body:JSON.stringify({consent:true,action:'explain',plan:samplePlan,purchase:{date:'2026-11-04',amountPaise:200000}})});
  const response=await handleAI(request,{...config,fetcher});
  assert.equal(response.status,200);assert.equal(called,true);assert.ok(!(await response.text()).includes('demo-environment-key'));
});
