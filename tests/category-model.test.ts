import { test } from 'node:test';
import assert from 'node:assert/strict';
import { predictCategory } from '../src/category-model.ts';

test('local learned merchant classifier handles unseen combinations',()=>{
  assert.equal(predictCategory('Evening campus meal','debit').category,'Food');
  assert.equal(predictCategory('City metro pass','debit').category,'Transport');
  assert.equal(predictCategory('Semester textbook purchase','debit').category,'Education');
  assert.equal(predictCategory('Pharmacy consultation','debit').category,'Health');
});
test('unknown and ambiguous descriptions require review',()=>{
  assert.deepEqual(predictCategory('XYZ abc payment','debit'),{category:'Other',confidence:'low',source:'local-ml',tokensUsed:[]});
  assert.equal(predictCategory('food taxi','debit').confidence,'low');
});
test('direction rules are disclosed and prevent transfers being treated as spending',()=>{
  assert.equal(predictCategory('Campus cafe','transfer').category,'Transfers');
  assert.equal(predictCategory('Refund pharmacy','credit').category,'Refunds');
  assert.equal(predictCategory('Student allowance','credit').source,'direction-rule');
});
