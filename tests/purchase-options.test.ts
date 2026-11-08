import test from "node:test";
import assert from "node:assert/strict";
import { purchaseOptions } from "../src/purchase-options.ts";
import { comparePurchase, type Plan } from "../src/forecast.ts";
import { samplePlan } from "../src/sample.ts";

test("purchase alternatives find a feasible later day without counting same-day income early", () => {
  const result = purchaseOptions(
    samplePlan,
    { date: "2026-11-04", amountPaise: 200000 },
    50000,
  );
  assert.equal(result.maximumPaise, 55000);
  assert.equal(result.earliestDate, "2026-11-14");
  assert.equal(result.meetsReserve, false);
  assert.equal(result.bindingDate, "2026-11-13");
  assert.equal(
    comparePurchase(samplePlan, {
      date: result.earliestDate!,
      amountPaise: 200000,
    }).proposed.minimumBalancePaise >= 50000,
    true,
  );
});

test("a prior reserve breach cannot be repaired by postponing a purchase", () => {
  const plan: Plan = {
    startDate: "2026-11-01",
    endDate: "2026-11-03",
    openingBalancePaise: 0,
    dailyEssentialsPaise: 100,
    entries: [
      {
        id: "pay",
        date: "2026-11-02",
        label: "Income",
        kind: "income",
        amountPaise: 10000,
      },
    ],
  };
  const r = purchaseOptions(plan, { date: "2026-11-03", amountPaise: 100 }, 0);
  assert.equal(r.baselineBelowReserve, true);
  assert.equal(r.maximumPaise, null);
  assert.equal(r.earliestDate, null);
});

test("date-search answers and maximum amounts match exhaustive forecast checks", () => {
  for (let seed = 0; seed < 15; seed++) {
    const plan: Plan = {
      startDate: "2026-11-01",
      endDate: "2026-11-07",
      openingBalancePaise: seed * 1000,
      dailyEssentialsPaise: 125,
      entries: [
        {
          id: "pay",
          date: "2026-11-04",
          label: "Pay",
          kind: "income",
          amountPaise: 3500,
        },
        {
          id: "bill",
          date: "2026-11-06",
          label: "Bill",
          kind: "expense",
          amountPaise: 1800,
        },
      ],
    };
    const original = JSON.stringify(plan),
      purchase = { date: "2026-11-02", amountPaise: seed * 350 },
      reserve = 500;
    const r = purchaseOptions(plan, purchase, reserve);
    const dates = Array.from({ length: 6 }, (_, i) => `2026-11-0${i + 2}`);
    assert.equal(
      r.earliestDate,
      dates.find(
        (date) =>
          comparePurchase(plan, { ...purchase, date }).proposed
            .minimumBalancePaise >= reserve,
      ) ?? null,
    );
    if (r.maximumPaise !== null) {
      assert.ok(
        comparePurchase(plan, {
          date: purchase.date,
          amountPaise: r.maximumPaise,
        }).proposed.minimumBalancePaise >= reserve,
      );
      assert.ok(
        comparePurchase(plan, {
          date: purchase.date,
          amountPaise: r.maximumPaise + 1,
        }).proposed.minimumBalancePaise < reserve,
      );
    }
    assert.equal(JSON.stringify(plan), original);
  }
});

test("reserve and forecast bounds are enforced, including one-day zero-capacity forecasts", () => {
  assert.throws(() =>
    purchaseOptions(samplePlan, { date: "2026-11-04", amountPaise: 100 }, -1),
  );
  assert.throws(() =>
    purchaseOptions(samplePlan, { date: "2026-11-30", amountPaise: 100 }),
  );
  const p: Plan = {
    startDate: "2026-11-01",
    endDate: "2026-11-01",
    openingBalancePaise: 100,
    dailyEssentialsPaise: 100,
    entries: [],
  };
  assert.equal(
    purchaseOptions(p, { date: p.startDate, amountPaise: 0 }).maximumPaise,
    0,
  );
  assert.equal(
    purchaseOptions(p, { date: p.startDate, amountPaise: 1 }).earliestDate,
    null,
  );
});

// The sample journey must show spending in the planner's month without duplicating cash flow.
test("demo import populates the same month as the demo forecast", async () => {
  const { SAMPLE_CSV, parseImport, validateDraft } =
    await import("../src/imports.ts");
  const { summarizeMonth } = await import("../web/monthly-budget.js");
  const rows = parseImport(SAMPLE_CSV, "csv")
    .filter((row) => row.included)
    .map(validateDraft);
  assert.equal(
    summarizeMonth(rows, samplePlan.startDate.slice(0, 7), {}).spendingPaise,
    71000,
  );
});
