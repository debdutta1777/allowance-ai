import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rupeesToPaise } from '../src/money.ts';

test('rupee text converts to exact paise including fractional values', () => {
  assert.equal(rupeesToPaise('0.29'), 29);
  assert.equal(rupeesToPaise('6400'), 640000);
  assert.equal(rupeesToPaise(' 12.5 '), 1250);
  assert.equal(rupeesToPaise('-12.05', true), -1205);
});
test('invalid, negative expense, scientific notation and excessive inputs fail', () => {
  for (const value of ['', '-1', '0.001', '1e3', 'Infinity', '1,000', '9007199254740992']) {
    assert.throws(() => rupeesToPaise(value));
  }
});
