import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDatedAlert } from '../src/alert-parser.js';
import { parseImport,validateDraft } from '../src/imports.ts';

test('amount-first debit alerts preserve date, paise and reference',()=>{
  const line='Rs. 1,250.50 debited from A/c XX1234 on 03-11-2026 to VPA cafe@upi UPI Ref 123456789012';
  const parsed=parseDatedAlert(line);assert.ok(parsed);
  assert.equal(parsed.date,'2026-11-03');assert.equal(parsed.amount,'1250.50');assert.equal(parsed.description,'cafe@upi');assert.equal(parsed.reference,'123456789012');
  const row=validateDraft(parseImport(line,'messages')[0]);assert.equal(row.amountPaise,125050);assert.equal(row.direction,'debit');
});
test('verb-first credit alerts and Indian amount grouping are supported',()=>{
  const parsed=parseDatedAlert('Your A/c XX1234 credited with INR 5,000.00 on 03/11/2026 from FAMILY Reference No ABCD1234');assert.ok(parsed);
  assert.equal(parsed.direction,'credit');assert.equal(parsed.amount,'5000.00');assert.equal(parsed.description,'FAMILY');
  assert.equal(parseDatedAlert('INR 1,23,456.78 debited on 03-11-2026 to COLLEGE Ref DEMO0001')?.amount,'123456.78');
});
test('simplified messages remain backward compatible',()=>{
  const parsed=parseDatedAlert('2026-10-29 INR 180.00 debited to Campus Canteen ref DEMO001');assert.ok(parsed);assert.equal(parsed.description,'Campus Canteen');assert.equal(parsed.reference,'DEMO001');
});
test('ambiguous or unposted alerts never create transactions',()=>{
  for(const line of ['INR 100 debited to Cafe','INR 100 debited on 31-02-2026 to Cafe Ref ABCD','INR 1,2 debited on 03-11-2026 to Cafe Ref ABCD','INR 100 debited on 03-11-2026 to Cafe Ref ABCD failed','UPI collect request for INR 100','INR 100 debited and INR 100 credited on 03-11-2026 to Cafe Ref ABCD']){
    assert.equal(parseDatedAlert(line),null);
    assert.throws(()=>parseImport(line,'messages'),/unsupported/);
  }
});
