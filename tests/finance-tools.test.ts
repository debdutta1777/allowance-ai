import test from 'node:test';
import assert from 'node:assert/strict';
import {investmentProjection,portfolioReview,parsePrices,backtest,estimateTax,inspectMessage,emi,invoice,cashFlow,FICTIONAL_PRICES} from '../src/finance-tools.ts';

test('zero return preserves contributions and lump-sum principal; end-month compounding is explicit',()=>{
  assert.deepEqual(investmentProjection(1000,10000,0,2),{contributed:24000,sip:24000,lump:10000});
  const r=investmentProjection(0,10000,10,2);assert.equal(r.lump,12100);assert.equal(r.sip,0);
  assert.ok(investmentProjection(1000,10000,-10,2).sip<24000);
  assert.throws(()=>investmentProjection(1000,0,-100,2));assert.throws(()=>investmentProjection(1,1,1,1.5));
});
test('portfolio flags distinguish entered concentration and incomplete cash information',()=>{
  const r=portfolioReview([{name:'Fund',kind:'Equity',valuePaise:90000},{name:'Deposit',kind:'Fixed income',valuePaise:10000}]);
  assert.equal(r.totalPaise,100000);assert.equal(r.equityPercent,90);assert.equal(r.flags.length,3);
  assert.equal(portfolioReview([]).totalPaise,0);
});
test('historical prices reject malformed, duplicate, unsorted and nonpositive observations',()=>{
  assert.equal(parsePrices(FICTIONAL_PRICES).length,60);
  for(const body of ['date,close\n2026-01-01,100\n2026-01-01,101\n2026-01-03,102','date,close\n2026-01-01,100\n2026-01-02,0\n2026-01-03,100','date,close\n2026-02-30,100\n2026-03-01,101\n2026-03-02,102'])assert.throws(()=>parsePrices(body));
});
test('backtest uses preceding closes, trades only whole units and preserves prefix causality',()=>{
  const rows=parsePrices(FICTIONAL_PRICES),full=backtest(rows,3,8,10000,10),prefix=backtest(rows.slice(0,30),3,8,10000,10);
  assert.deepEqual(full.equity.slice(0,30),prefix.equity);
  assert.deepEqual(full.trades.filter(t=>t.date<=rows[29].date),prefix.trades);
  assert.ok(full.trades.every(t=>Number.isInteger(t.units)&&t.units>0&&t.date>=rows[8].date));
  assert.equal(full.equity.length,60);assert.throws(()=>backtest(rows,8,3,1000,0));
});
test('tax rebates, standard deductions, marginal relief and bounded eligibility are applied',()=>{
  assert.equal(estimateTax(1275000,0).newTax,0);
  assert.equal(estimateTax(550000,0).oldTax,0);
  assert.equal(estimateTax(1280000,0).newTax,5200);
  assert.equal(estimateTax(2000000,0).newTax,192400);
  assert.throws(()=>estimateTax(5000001,0));assert.throws(()=>estimateTax(100000,200000));
});
test('message scanner highlights PIN and collect-request risk but never labels a message safe',()=>{
  const flagged=inspectMessage('Urgent: approve this collect request and enter your UPI PIN to receive cashback at https://example.invalid');
  assert.equal(flagged.level,'Multiple warning signs');assert.ok(flagged.flags.length>=4);
  assert.match(inspectMessage('Hello there').flags[0],/does not verify/);assert.throws(()=>inspectMessage(''));
});
test('business calculators handle zero interest, tax arithmetic and negative runway without silent clamping',()=>{
  assert.deepEqual(emi(12000,0,12),{payment:1000,total:12000,interest:0});
  assert.deepEqual(invoice(10000,18),{subtotal:10000,tax:1800,total:11800});
  assert.deepEqual(cashFlow(100,50,100,3).map(row=>row.balance),[50,0,-50]);
  assert.throws(()=>emi(1,10,0));assert.throws(()=>invoice(-1,18));
});
