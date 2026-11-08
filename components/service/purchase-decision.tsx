"use client";
import { useState } from "react";
import { useWorkspace } from "./workspace-context";
import { ForecastChart } from "./forecast-preview";
import { money } from "./common";
import { purchaseOptions } from "../../src/purchase-options";
import { rupeesToPaise } from "../../src/money";
import { delayIncome } from "../../src/insights";

const DAY = 86400000;
export function PurchaseDecision({ disabled }: { disabled: boolean }) {
  const w = useWorkspace();
  const [reserve, setReserve] = useState("500");
  const plan = w.data.plan,
    purchase = w.data.purchase;
  let reservePaise = 0,
    invalid = "";
  try {
    reservePaise = rupeesToPaise(reserve);
  } catch {
    invalid = "Enter a non-negative reserve with at most two decimal places.";
  }
  const options = purchaseOptions(plan, purchase, reservePaise);
  const delayed = purchaseOptions(
    delayIncome(plan, w.data.delayDays),
    purchase,
    reservePaise,
  );
  const start = Date.parse(plan.startDate + "T00:00:00Z"),
    end = Date.parse(plan.endDate + "T00:00:00Z");
  const selected = (Date.parse(purchase.date + "T00:00:00Z") - start) / DAY;
  function setDate(date: string) {
    w.update((data) => ({ ...data, purchase: { ...data.purchase, date } }));
  }
  return (
    <section className="purchase-decision" aria-labelledby="decision-title">
      <div className="decision-heading">
        <div>
          <p className="eyebrow">THE NEXT PURCHASE</p>
          <h2 id="decision-title">
            Find a date that leaves room for essentials.
          </h2>
        </div>
        <p>Calculated from your applied plan. Nothing is purchased or moved.</p>
      </div>
      {disabled && (
        <p className="notice" role="status">
          Apply your plan and purchase edits below to update this comparison.
        </p>
      )}
      <div className="decision-columns">
        <div>
          <ForecastChart
            plan={plan}
            purchase={purchase}
            reservePaise={invalid ? undefined : reservePaise}
          />
          <label className="timeline-control">
            Move the proposed purchase date <strong>{purchase.date}</strong>
            <input
              aria-label="Purchase date timeline"
              aria-valuetext={purchase.date}
              type="range"
              min={0}
              max={(end - start) / DAY}
              step={1}
              value={selected}
              disabled={disabled}
              onChange={(e) =>
                setDate(
                  new Date(start + Number(e.target.value) * DAY)
                    .toISOString()
                    .slice(0, 10),
                )
              }
            />
          </label>
          <div className="timeline-events" aria-label="Scheduled events">
            {plan.entries
              .filter((e) => e.date >= plan.startDate && e.date <= plan.endDate)
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => (
                <button
                  type="button"
                  key={e.id}
                  disabled={disabled}
                  onClick={() => setDate(e.date)}
                >
                  <span>{e.date}</span>
                  <strong>{e.label}</strong>
                  <span>
                    {e.kind === "income" ? "+" : "−"}
                    {money(e.amountPaise)}
                  </span>
                </button>
              ))}
          </div>
        </div>
        <div className="decision-answer">
          <label>
            Minimum reserve throughout the forecast (INR)
            <input
              type="number"
              min="0"
              max="1000000000"
              step="0.01"
              value={reserve}
              onChange={(e) => setReserve(e.target.value)}
            />
          </label>
          <p className="field-note">
            Temporary scenario setting. Your regular account save keeps the plan
            and purchase, not this reserve.
          </p>
          {invalid ? (
            <p role="alert" className="error">
              {invalid}
            </p>
          ) : (
            <>
              <div className="decision-verdict" aria-live="polite">
                <p className="eyebrow">
                  {options.meetsReserve
                    ? "WITHIN YOUR RESERVE"
                    : "REVIEW THIS PURCHASE"}
                </p>
                <strong>
                  {money(purchase.amountPaise)} on {purchase.date}
                </strong>
                <p>
                  {options.baselineBelowReserve
                    ? "Your plan falls below the reserve even without this purchase. Change the plan before relying on a later purchase date."
                    : options.meetsReserve
                      ? "This scenario keeps your chosen reserve throughout the applied period."
                      : `This scenario first falls below the reserve on ${options.firstReserveBreach}.`}
                </p>
              </div>
              <dl className="decision-facts">
                <div>
                  <dt>Maximum purchase on this date</dt>
                  <dd>
                    {options.maximumPaise === null
                      ? "Plan already below reserve"
                      : money(options.maximumPaise)}
                  </dd>
                </div>
                <div>
                  <dt>Earliest feasible date, from this date onward</dt>
                  <dd>{options.earliestDate ?? "None in this forecast"}</dd>
                </div>
                <div>
                  <dt>Lowest balance after purchase</dt>
                  <dd>{money(options.minimumAfterPurchasePaise)}</dd>
                </div>
              </dl>
              {options.earliestDate &&
                options.earliestDate !== purchase.date && (
                  <button
                    disabled={disabled}
                    onClick={() => setDate(options.earliestDate!)}
                  >
                    Use {options.earliestDate}
                  </button>
                )}
              <details>
                <summary>Why this result?</summary>
                <p>
                  Daily essentials, scheduled bills and the purchase are
                  deducted before same-day income.{" "}
                  {options.maximumPaise !== null
                    ? `The available room on this purchase date is constrained by the balance before income on ${options.bindingDate}.`
                    : "The baseline already breaches your reserve, so postponing this purchase cannot fix the entire period."}{" "}
                  Only entries within {plan.startDate} to {plan.endDate} are
                  included.
                </p>
                <p>
                  With expected income delayed by {w.data.delayDays} days, the
                  lowest balance after this purchase is{" "}
                  {money(delayed.minimumAfterPurchasePaise)}.{" "}
                  {delayed.meetsReserve
                    ? "That scenario also preserves this reserve."
                    : "That scenario falls below this reserve."}
                </p>
                <p>
                  These are conditional forecasts from your inputs, not
                  guaranteed future balances.
                </p>
              </details>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
