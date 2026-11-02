import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecast, comparePurchase } from '../src/forecast.ts';
import { samplePlan } from '../src/sample.ts';
import type { Plan } from '../src/forecast.ts';

function plan(overrides: Partial<Plan> = {}): Plan {
  return { startDate: '2026-11-03', endDate: '2026-11-05', openingBalancePaise: 10000, dailyEssentialsPaise: 1000, entries: [], ...overrides };
}

test('inclusive daily essentials reconcile with the closing balance', () => {
  const result = forecast(plan());
  assert.equal(result.days.length, 3);
  assert.equal(result.closingBalancePaise, 7000);
  assert.equal(result.totalExpensesPaise, 3000);
});

test('sample purchase creates a shortfall before the expected allowance', () => {
  const result = comparePurchase(samplePlan, { date: '2026-11-04', amountPaise: 200000 });
  assert.equal(result.baseline.firstShortfallDate, null);
  assert.equal(result.baseline.minimumBalancePaise, 105000);
  assert.equal(result.proposed.firstShortfallDate, '2026-11-08');
  assert.equal(result.proposed.minimumBalancePaise, -95000);
  assert.equal(result.createsShortfall, true);
  assert.equal(result.baseline.closingBalancePaise - result.proposed.closingBalancePaise, 200000);
});

test('income arriving after the horizon is excluded', () => {
  const delayed = { ...samplePlan, entries: samplePlan.entries.map(entry => entry.kind === 'income' ? { ...entry, date: '2026-11-16' } : entry) };
  assert.equal(forecast(delayed).closingBalancePaise, 75000);
  assert.equal(forecast(delayed).totalIncomePaise, 0);
});

test('same-day income cannot hide an earlier spending shortfall', () => {
  const result = forecast(plan({ openingBalancePaise: 0, entries: [{ id: 'income', label: 'Allowance', date: '2026-11-03', amountPaise: 10000, kind: 'income' }] }));
  assert.equal(result.firstShortfallDate, '2026-11-03');
  assert.equal(result.days[0].closingBalancePaise, 9000);
});

test('an exact zero balance is not a shortfall', () => {
  assert.equal(forecast(plan({ openingBalancePaise: 3000 })).firstShortfallDate, null);
});

test('negative opening balance is reported on the first day', () => {
  assert.equal(forecast(plan({ openingBalancePaise: -1 })).firstShortfallDate, '2026-11-03');
});

test('duplicate entry IDs are rejected instead of double counting', () => {
  const entry = samplePlan.entries[0];
  assert.throws(() => forecast(plan({ entries: [entry, entry] })), /unique/);
});

test('historical and future entries do not change the opening balance', () => {
  assert.equal(forecast(plan({ entries: [{ ...samplePlan.entries[0], date: '2026-11-02' }, { ...samplePlan.entries[1], date: '2026-11-06' }] })).closingBalancePaise, 7000);
});

test('invalid dates and reversed or excessive horizons are rejected', () => {
  for (const startDate of ['2026-02-30', '2026-11-3', 'garbage']) assert.throws(() => forecast(plan({ startDate })));
  assert.throws(() => forecast(plan({ endDate: '2026-11-02' })), /366/);
  assert.throws(() => forecast(plan({ endDate: '2028-11-03' })), /366/);
});

test('leap day is valid and the forecast advances by calendar date', () => {
  assert.deepEqual(forecast(plan({ startDate: '2028-02-28', endDate: '2028-03-01' })).days.map(day => day.date), ['2028-02-28', '2028-02-29', '2028-03-01']);
});

test('fractional, negative expense and unsafe amounts are rejected', () => {
  for (const value of [0.1, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => forecast(plan({ dailyEssentialsPaise: value })));
  assert.throws(() => forecast(plan({ openingBalancePaise: Number.MAX_SAFE_INTEGER, entries: [{ id: 'large', label: 'Income', kind: 'income', date: '2026-11-03', amountPaise: 100000 }] })), /safe integer/);
});

test('purchase simulation does not mutate its input and validates its date', () => {
  const before = JSON.stringify(samplePlan);
  comparePurchase(samplePlan, { date: '2026-11-04', amountPaise: 200000 });
  assert.equal(JSON.stringify(samplePlan), before);
  assert.throws(() => comparePurchase(samplePlan, { date: '2026-11-02', amountPaise: 100 }), /inside/);
});

test('malformed entry fields fail with explicit validation errors', () => {
  assert.throws(() => forecast(plan({ entries: [{ ...samplePlan.entries[0], kind: 'transfer' as 'expense' }] })), /kind/);
  assert.throws(() => forecast(plan({ entries: [{ ...samplePlan.entries[0], label: '' }] })), /label/);
  assert.throws(() => forecast(plan({ entries: [{ ...samplePlan.entries[0], amountPaise: -100 }] })), /Entry amount/);
});
