import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeMonth, validMonth } from '../web/monthly-budget.js';

const transaction = (date:string,direction:string,category:string,amountPaise:number) => ({date,direction,category,amountPaise});
test('month boundaries isolate imported spending and preserve the input',()=>{
  const rows=[transaction('2026-10-31','debit','Food',10000),transaction('2026-11-01','debit','Food',15000),transaction('2026-12-01','debit','Food',20000)];
  const before=JSON.stringify(rows);
  const report=summarizeMonth(rows,'2026-11',{Food:20000});
  assert.equal(report.spendingPaise,15000);assert.equal(report.transactionCount,1);assert.equal(JSON.stringify(rows),before);
});
test('income, incoming refunds and transfers are separate from category spending',()=>{
  const report=summarizeMonth([transaction('2026-11-01','debit','Food',20000),transaction('2026-11-02','credit','Refunds',5000),transaction('2026-11-03','credit','Income',500000),transaction('2026-11-04','transfer','Transfers',100000)],'2026-11',{Food:10000});
  assert.equal(report.spendingPaise,20000);assert.equal(report.refundsPaise,5000);assert.equal(report.incomePaise,500000);assert.equal(report.transfersPaise,100000);
  assert.equal(report.categories[0].remainingPaise,-10000);assert.equal(report.categories[0].status,'over');
});
test('blank, zero, exact and unused budgets have distinct meanings',()=>{
  const rows=[transaction('2026-11-01','debit','Food',100)];
  assert.equal(summarizeMonth(rows,'2026-11').categories[0].status,'not-set');
  assert.equal(summarizeMonth(rows,'2026-11',{Food:0}).categories[0].status,'over');
  assert.equal(summarizeMonth(rows,'2026-11',{Food:100}).categories[0].status,'at-limit');
  assert.equal(summarizeMonth([],'2026-11',{Food:100}).categories[0].remainingPaise,100);
});
test('uncapped categories are reported explicitly',()=>{
  const report=summarizeMonth([transaction('2026-11-01','debit','Food',1000),transaction('2026-11-02','debit','Other',2000)],'2026-11',{Food:5000});
  assert.equal(report.budgetPaise,5000);assert.equal(report.unbudgetedSpendingPaise,2000);
});
test('invalid dates, months, negative values and overflow are rejected',()=>{
  assert.equal(validMonth('2026-13'),false);assert.equal(validMonth('2026-02'),true);
  assert.throws(()=>summarizeMonth([],'2026-00'));
  assert.throws(()=>summarizeMonth([transaction('2026-02-30','debit','Food',1)],'2026-02'));
  assert.throws(()=>summarizeMonth([],'2026-11',{Food:-1}));
  assert.throws(()=>summarizeMonth([transaction('2026-11-01','debit','Food',Number.MAX_SAFE_INTEGER),transaction('2026-11-02','debit','Food',1)],'2026-11'));
});
