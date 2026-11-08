"use client";
import { useState } from "react";
import Link from "next/link";
import { comparePurchase, type Plan } from "../../src/forecast";
import { samplePlan } from "../../src/sample";
import { money } from "./common";

export function ForecastChart({
  plan,
  purchase,
  reservePaise,
}: {
  plan: Plan;
  purchase: { date: string; amountPaise: number };
  reservePaise?: number;
}) {
  const { baseline, proposed } = comparePurchase(plan, purchase);
  const series = [baseline, proposed].map((result) => [
    plan.openingBalancePaise,
    ...result.days.map((day) => day.closingBalancePaise),
  ]);
  const top = Math.max(1, reservePaise ?? 0, ...series.flat());
  const bottom = Math.min(
    0,
    ...series.flat(),
    ...proposed.days.map((day) => day.beforeIncomePaise),
  );
  const y = (value: number) => 24 + ((top - value) / (top - bottom)) * 148;
  const points = (values: number[]) =>
    values
      .map(
        (value, index) =>
          48 + (index / (values.length - 1)) * 416 + "," + y(value),
      )
      .join(" ");
  return (
    <figure className="forecast-chart">
      <svg
        viewBox="0 0 488 206"
        role="img"
        aria-label={
          "Daily closing balance forecast. Lowest intraday balance before purchase " +
          money(baseline.minimumBalancePaise) +
          "; with purchase " +
          money(proposed.minimumBalancePaise) +
          "."
        }
      >
        {[top, (top + bottom) / 2, bottom].map((value, index) => (
          <g key={index}>
            <line
              className="chart-rule"
              x1="48"
              x2="464"
              y1={y(value)}
              y2={y(value)}
            />
            <text x="0" y={y(value) + 4} className="chart-label">
              {Math.round(value / 100).toLocaleString("en-IN")}
            </text>
          </g>
        ))}
        {bottom < 0 && (
          <line className="chart-zero" x1="48" x2="464" y1={y(0)} y2={y(0)} />
        )}
        {reservePaise !== undefined && (
          <g>
            <line
              className="chart-reserve"
              x1="48"
              x2="464"
              y1={y(reservePaise)}
              y2={y(reservePaise)}
            />
            <text
              x="464"
              y={y(reservePaise) - 6}
              textAnchor="end"
              className="chart-label"
            >
              Reserve
            </text>
          </g>
        )}
        {reservePaise !== undefined &&
          proposed.days
            .filter((day) => day.beforeIncomePaise < reservePaise)
            .map((day) => (
              <circle
                key={day.date}
                className="chart-breach"
                cx={
                  48 +
                  ((proposed.days.findIndex((d) => d.date === day.date) + 1) /
                    proposed.days.length) *
                    416
                }
                cy={y(day.beforeIncomePaise)}
                r="3"
              >
                <title>
                  {day.date}: before income {money(day.beforeIncomePaise)},
                  below reserve
                </title>
              </circle>
            ))}
        <polyline className="chart-baseline" points={points(series[0])} />
        <polyline
          key={purchase.date + ":" + purchase.amountPaise}
          className="chart-purchase"
          points={points(series[1])}
        />
        <text x="48" y="198" className="chart-label">
          {plan.startDate}
        </text>
        <text x="464" y="198" textAnchor="end" className="chart-label">
          {plan.endDate}
        </text>
      </svg>
      <div className="chart-dates" aria-hidden="true">
        <span>{plan.startDate}</span>
        <span>{plan.endDate}</span>
      </div>
      <figcaption>
        <span className="legend-baseline">Before purchase</span>
        <span className="legend-purchase">With purchase</span>
        {reservePaise !== undefined && (
          <span className="legend-breach">
            Dots: below-reserve balance before income
          </span>
        )}
      </figcaption>
    </figure>
  );
}

export function ForecastPreview() {
  const [amount, setAmount] = useState(200000);
  const purchase = { date: "2026-11-04", amountPaise: amount };
  const result = comparePurchase(samplePlan, purchase);
  return (
    <section
      className="product-preview"
      aria-label="Interactive fictional cash-flow example"
    >
      <div className="preview-top">
        <span className="preview-wordmark">allowance.</span>
        <span>PLANNER / FICTIONAL DEMO</span>
      </div>
      <div className="preview-heading">
        <span>Know what stays available.</span>
        <span>03–15 NOV 2026</span>
      </div>
      <div className="preview-balance">
        <span>Starting balance</span>
        <strong>{money(samplePlan.openingBalancePaise)}</strong>
        <small>Daily essentials {money(samplePlan.dailyEssentialsPaise)}</small>
      </div>
      <ForecastChart plan={samplePlan} purchase={purchase} />
      <div className="purchase-selector">
        <span>Try a purchase on 4 Nov</span>
        <div role="group" aria-label="Example purchase amount">
          {[50000, 200000, 350000].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={amount === value}
              onClick={() => setAmount(value)}
            >
              {money(value).replace(".00", "")}
            </button>
          ))}
        </div>
      </div>
      <div
        className={
          "preview-outcome" +
          (result.proposed.firstShortfallDate ? " is-shortfall" : "")
        }
        aria-live="polite"
      >
        <div>
          <span>Lowest balance with purchase</span>
          <strong>{money(result.proposed.minimumBalancePaise)}</strong>
        </div>
        <p>
          {result.proposed.firstShortfallDate
            ? "This purchase creates a projected shortfall."
            : "No projected shortfall within this period."}
        </p>
      </div>
      <Link className="preview-open" href="/demo/planner">
        Open the full planner
      </Link>
    </section>
  );
}
