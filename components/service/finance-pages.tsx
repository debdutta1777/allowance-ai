"use client";
import { useState } from "react";
import { useWorkspace } from "./workspace-context";
import {
  PageTitle,
  ToolForm,
  NumberField,
  Field,
  num,
  money,
  rupees,
  download,
} from "./common";
import {
  investmentProjection,
  portfolioReview,
  parsePrices,
  backtest,
  estimateTax,
  inspectMessage,
  emi,
  invoice,
  cashFlow,
  FICTIONAL_PRICES,
} from "../../src/finance-tools";
import { rupeesToPaise } from "../../src/money";

export function Investing() {
  const w = useWorkspace(),
    review = portfolioReview(w.data.holdings),
    [error, setError] = useState("");
  return (
    <>
      <PageTitle
        title="Investing & portfolio guide"
        description="Understand the choices, model assumptions and review the allocation you enter."
      />
      <section className="paper-section">
        <h2>A short guide</h2>
        <dl className="guide-list">
          <div>
            <dt>SIP</dt>
            <dd>
              A systematic investment plan is a way to contribute regularly to a
              mutual fund. It does not guarantee a return or prevent a loss.
            </dd>
          </div>
          <div>
            <dt>Index fund</dt>
            <dd>
              An index fund aims to track an index, such as the Nifty 50,
              subject to fees and tracking differences. The underlying market
              can fall.
            </dd>
          </div>
          <div>
            <dt>Fixed deposit</dt>
            <dd>
              A deposit has a stated tenure and interest rate. Consider the
              bank’s terms, premature withdrawal rules, tax and applicable
              deposit protection.
            </dd>
          </div>
        </dl>
        <a
          href="https://investor.sebi.gov.in/index_mutual_fund.html"
          target="_blank"
          rel="noreferrer"
        >
          SEBI investor guide to index funds
        </a>
      </section>
      <section className="paper-section">
        <h2>Explore contributions and compounding</h2>
        <p>
          Both projections use the effective annual return you enter.
          Contributions are made at month end. Values are nominal, before tax,
          fees and inflation; this is a scenario, not a forecast or a product
          recommendation.
        </p>
        <ToolForm
          calculate={(f) => {
            const r = investmentProjection(
              num(f, "monthly"),
              num(f, "principal"),
              num(f, "return"),
              num(f, "years"),
            );
            return (
              <dl className="evidence">
                <div>
                  <dt>Total monthly contributions</dt>
                  <dd>{rupees(r.contributed)}</dd>
                </div>
                <div>
                  <dt>Projected regular-contribution value</dt>
                  <dd>{rupees(r.sip)}</dd>
                </div>
                <div>
                  <dt>Projected lump-sum value at the same assumed rate</dt>
                  <dd>{rupees(r.lump)}</dd>
                </div>
              </dl>
            );
          }}
        >
          <div className="form-grid">
            <NumberField
              label="Monthly contribution (INR)"
              name="monthly"
              value="3000"
            />
            <NumberField
              label="Lump-sum principal (INR)"
              name="principal"
              value="100000"
            />
            <NumberField
              label="Assumed effective annual return (%)"
              name="return"
              value="6"
              min="-50"
              max="50"
            />
            <NumberField
              label="Years"
              name="years"
              value="5"
              min="1"
              max="50"
              step="1"
            />
          </div>
        </ToolForm>
      </section>
      <section className="paper-section">
        <h2>Your entered portfolio</h2>
        <p>
          These simple threshold checks describe the holdings you enter. They do
          not assess suitability, underlying fund overlap, credit quality or
          your complete finances.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              if (w.data.holdings.length >= 100)
                throw new Error("Use at most 100 holdings.");
              const f = new FormData(event.currentTarget),
                name = String(f.get("name")).trim(),
                valuePaise = rupeesToPaise(String(f.get("value")));
              if (!name || valuePaise <= 0)
                throw new Error("Enter a holding name and a positive value.");
              const holding = {
                id: crypto.randomUUID(),
                name,
                kind: String(f.get("kind")) as
                  | "Equity"
                  | "Fixed income"
                  | "Cash"
                  | "Other",
                valuePaise,
              };
              w.update((data) => ({
                ...data,
                holdings: [...data.holdings, holding],
              }));
              setError("");
              event.currentTarget.reset();
            } catch (issue) {
              setError((issue as Error).message);
            }
          }}
        >
          <div className="form-grid">
            <Field label="Holding name" name="name" required maxLength={120} />
            <label>
              Asset class
              <select name="kind">
                {["Equity", "Fixed income", "Cash", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <NumberField
              label="Current value (INR)"
              name="value"
              min="0.01"
              value="10000"
            />
          </div>
          <button>Add holding</button>
          {error && <p role="alert">{error}</p>}
        </form>
        <div className="table-scroll">
          <table>
            <caption>Holdings recorded under this workspace</caption>
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {w.data.holdings.map((h) => (
                <tr key={h.id}>
                  <th>{h.name}</th>
                  <td>{h.kind}</td>
                  <td>{money(h.valuePaise)}</td>
                  <td>
                    <button
                      onClick={() =>
                        w.update((data) => ({
                          ...data,
                          holdings: data.holdings.filter(
                            (item) => item.id !== h.id,
                          ),
                        }))
                      }
                    >
                      Remove {h.name}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Total entered: {money(review.totalPaise)}. Equity:{" "}
          {review.equityPercent.toFixed(1)}%. Largest holding:{" "}
          {review.largestPercent.toFixed(1)}%.
        </p>
        <ul>
          {review.flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function Markets() {
  const [csv, setCSV] = useState(""),
    [fileError, setFileError] = useState("");
  return (
    <>
      <PageTitle
        title="Trading & market insights"
        description="Test a simple moving-average strategy against historical closing prices. No real-money trading or broker connection."
      />
      <section className="paper-section">
        <h2>Historical price backtest</h2>
        <p>
          Upload your own historical data with date,close headers, increasing
          ISO dates and positive closes. Up to 2,000 observations, 64 KB. The
          sample is fictional, includes calendar days and is not NSE market
          data.
        </p>
        <label>
          Historical CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (event) => {
              try {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 65536)
                  throw new Error("Choose a historical CSV under 64 KB.");
                setCSV(await file.text());
                setFileError("");
              } catch (issue) {
                setFileError((issue as Error).message);
              }
            }}
          />
        </label>
        <div className="actions">
          <button onClick={() => setCSV(FICTIONAL_PRICES)}>
            Load fictional price sample
          </button>
          <button
            onClick={() =>
              download("fictional-prices.csv", FICTIONAL_PRICES, "text/csv")
            }
          >
            Download fictional sample
          </button>
        </div>
        {fileError && <p role="alert">{fileError}</p>}
        <ToolForm
          button="Run historical backtest"
          calculate={(f) => {
            const rows = parsePrices(csv),
              r = backtest(
                rows,
                num(f, "fast"),
                num(f, "slow"),
                num(f, "cash"),
                num(f, "fee"),
              );
            return (
              <>
                <h3>
                  Historical result / {rows[0].date} to {rows.at(-1)!.date}
                </h3>
                <dl className="evidence">
                  <div>
                    <dt>Ending marked-to-market equity</dt>
                    <dd>{rupees(r.final)}</dd>
                  </div>
                  <div>
                    <dt>Strategy return</dt>
                    <dd>{r.returnPercent.toFixed(2)}%</dd>
                  </div>
                  <div>
                    <dt>Maximum observed drawdown</dt>
                    <dd>{r.maxDrawdownPercent.toFixed(2)}%</dd>
                  </div>
                  <div>
                    <dt>Buy-and-hold comparison</dt>
                    <dd>{rupees(r.buyHold)}</dd>
                  </div>
                </dl>
                <p>
                  {r.openUnits} units remain open. Closing positions would incur
                  further fees. Returns exclude dividends, corporate actions,
                  tax and slippage; results depend on data quality. Historical
                  performance does not predict future results.
                </p>
                <div className="table-scroll">
                  <table>
                    <caption>
                      Paper trade ledger / signals use preceding observations
                      only
                    </caption>
                    <thead>
                      <tr>
                        <th>Execution date</th>
                        <th>Side</th>
                        <th>Units</th>
                        <th>Close price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.trades.map((t, i) => (
                        <tr key={i}>
                          <td>{t.date}</td>
                          <td>{t.side}</td>
                          <td>{t.units}</td>
                          <td>{rupees(t.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!r.trades.length && (
                  <p>No trades met the signal and cash constraints.</p>
                )}
              </>
            );
          }}
        >
          <label>
            Historical prices
            <textarea
              value={csv}
              onChange={(e) => setCSV(e.target.value)}
              rows={7}
              required
              maxLength={65536}
              placeholder="date,close"
            />
          </label>
          <div className="form-grid">
            <NumberField
              label="Fast moving-average observations"
              name="fast"
              value="5"
              min="1"
              max="100"
              step="1"
            />
            <NumberField
              label="Slow moving-average observations"
              name="slow"
              value="15"
              min="2"
              max="250"
              step="1"
            />
            <NumberField
              label="Paper starting cash (INR)"
              name="cash"
              value="10000"
              min="1"
            />
            <NumberField
              label="Fee per trade (basis points)"
              name="fee"
              value="10"
              max="200"
            />
          </div>
        </ToolForm>
        <p>
          Method: a fast average above the slow average triggers a whole-unit
          purchase at the following observation’s close. Otherwise any position
          is sold. There is no leverage or short selling. Buy-and-hold starts at
          the first observation; strategy warm-up remains in cash. Both results
          mark open units to the final close.
        </p>
      </section>
    </>
  );
}

export function Tax() {
  return (
    <>
      <PageTitle
        title="Tax helper"
        description="A bounded old-versus-new regime salary estimate for FY 2025–26 / AY 2026–27."
      />
      <section className="paper-section">
        <h2>Compare supported salary scenarios</h2>
        <p>
          For an Indian resident individual below 60, with ordinary salary
          income only, up to INR 50 lakh. Excludes capital gains, special-rate
          income, agricultural income, business income, surcharge and reliefs
          other than new-regime rebate marginal relief. This is an estimate, not
          an income-tax return.
        </p>
        <ToolForm
          button="Compare tax estimates"
          calculate={(f) => {
            const r = estimateTax(num(f, "salary"), num(f, "deductions"));
            return (
              <>
                <dl className="evidence">
                  <div>
                    <dt>Old regime taxable salary</dt>
                    <dd>{rupees(r.oldTaxable)}</dd>
                  </div>
                  <div>
                    <dt>Old regime estimated tax, including 4% cess</dt>
                    <dd>{rupees(r.oldTax)}</dd>
                  </div>
                  <div>
                    <dt>New regime taxable salary</dt>
                    <dd>{rupees(r.newTaxable)}</dd>
                  </div>
                  <div>
                    <dt>New regime estimated tax, including 4% cess</dt>
                    <dd>{rupees(r.newTax)}</dd>
                  </div>
                </dl>
                <p>
                  {r.oldTax === r.newTax
                    ? "The estimates are equal."
                    : `${r.oldTax < r.newTax ? "Old" : "New"} regime is lower by ${rupees(Math.abs(r.oldTax - r.newTax))} under these inputs.`}{" "}
                  Verify eligibility and deductions with the official estimator
                  before making a filing decision.
                </p>
              </>
            );
          }}
        >
          <NumberField
            label="Annual gross salary (INR)"
            name="salary"
            value="1200000"
            max="5000000"
          />
          <NumberField
            label="Eligible old-regime exemptions and deductions, excluding standard deduction (INR)"
            name="deductions"
            value="150000"
            max="5000000"
          />
        </ToolForm>
        <p>
          The model applies standard deductions of INR 50,000 (old) and INR
          75,000 (new). New-regime ordinary taxable income up to INR 12 lakh
          gets the supported rebate; old-regime taxable income up to INR 5 lakh
          receives the supported rebate. Only enter exemptions and deductions
          you qualify for. Category-specific deduction caps are not checked.
        </p>
        <a
          href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1"
          target="_blank"
          rel="noreferrer"
        >
          Income Tax Department: AY 2026–27 rates and rules
        </a>
        <p>
          Rules checked on 3 November 2026. This calculator deliberately does
          not estimate other tax years.
        </p>
      </section>
    </>
  );
}

export function Safety() {
  const [text, setText] = useState("");
  return (
    <>
      <PageTitle
        title="Scam & fraud checks"
        description="Inspect a message for common payment-fraud warning signs before you act."
      />
      <section className="paper-section">
        <h2>Review a suspicious message</h2>
        <p>
          This rule-based check runs locally. The text is not saved to your
          account, sent to Gemini or opened as a link. Remove private
          identifiers before pasting. It cannot verify a sender or guarantee
          safety.
        </p>
        <button
          onClick={() =>
            setText(
              "Urgent: approve this collect request and enter your UPI PIN to receive a cashback reward. Open https://example.invalid/reward",
            )
          }
        >
          Load fictional suspicious message
        </button>
        <ToolForm
          button="Check warning signs"
          calculate={() => {
            const r = inspectMessage(text);
            return (
              <>
                <h3>{r.level}</h3>
                <ul>
                  {r.flags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
                <p>
                  Stop and verify through your bank’s official app or a known
                  support number. Never share an OTP or UPI PIN. If money has
                  already been lost, contact your bank immediately and use the
                  official reporting channels.
                </p>
              </>
            );
          }}
        >
          <label>
            Message to check
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={5000}
              required
            />
          </label>
        </ToolForm>
        <a
          href="https://www.npci.org.in/fraud-awareness"
          target="_blank"
          rel="noreferrer"
        >
          NPCI fraud-awareness guidance
        </a>
      </section>
    </>
  );
}

export function Business() {
  return (
    <>
      <PageTitle
        title="Small business finance"
        description="Estimate loan payments, plan a simple cash runway and calculate invoice totals."
      />
      <section className="paper-section">
        <h2>Loan and EMI planning</h2>
        <ToolForm
          calculate={(f) => {
            const r = emi(
              num(f, "principal"),
              num(f, "rate"),
              num(f, "months"),
            );
            return (
              <dl className="evidence">
                <div>
                  <dt>Monthly payment</dt>
                  <dd>{rupees(r.payment)}</dd>
                </div>
                <div>
                  <dt>Total repayment</dt>
                  <dd>{rupees(r.total)}</dd>
                </div>
                <div>
                  <dt>Estimated interest</dt>
                  <dd>{rupees(r.interest)}</dd>
                </div>
              </dl>
            );
          }}
        >
          <div className="form-grid">
            <NumberField
              label="Loan principal (INR)"
              name="principal"
              value="100000"
            />
            <NumberField
              label="Annual interest rate (%)"
              name="rate"
              value="10"
              max="60"
            />
            <NumberField
              label="Loan term (months)"
              name="months"
              value="12"
              min="1"
              max="600"
              step="1"
            />
          </div>
        </ToolForm>
        <p>
          Fixed reducing-balance interest, monthly payments. Excludes lender
          fees, insurance, tax and variable rates. Your lender’s schedule may
          differ due to rounding.
        </p>
      </section>
      <section className="paper-section">
        <h2>Monthly cash-flow scenario</h2>
        <ToolForm
          button="Project cash flow"
          calculate={(f) => {
            const rows = cashFlow(
              num(f, "opening"),
              num(f, "income"),
              num(f, "costs"),
              num(f, "months"),
            );
            return (
              <>
                <p>
                  {rows.find((row) => row.balance < 0)
                    ? `Cash becomes negative in month ${rows.find((row) => row.balance < 0)!.month}.`
                    : "No negative month-end balance in this scenario."}{" "}
                  Monthly totals can conceal a shortfall within a month.
                </p>
                <table>
                  <caption>
                    Projected month-end cash, unchanged monthly assumptions
                  </caption>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.month}>
                        <th>{row.month}</th>
                        <td>{rupees(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            );
          }}
        >
          <div className="form-grid">
            <NumberField
              label="Opening cash (INR)"
              name="opening"
              value="50000"
              min="-1000000000"
            />
            <NumberField
              label="Monthly receipts (INR)"
              name="income"
              value="30000"
            />
            <NumberField
              label="Monthly costs (INR)"
              name="costs"
              value="35000"
            />
            <NumberField
              label="Projection months"
              name="months"
              value="6"
              min="1"
              max="24"
              step="1"
            />
          </div>
        </ToolForm>
      </section>
      <section className="paper-section">
        <h2>Invoice total estimate</h2>
        <p>
          Enter the taxable subtotal and applicable GST rate yourself. This
          arithmetic tool does not determine GST classification, registration,
          place of supply, CGST/SGST/IGST treatment or create a compliant tax
          invoice.
        </p>
        <ToolForm
          button="Calculate invoice total"
          calculate={(f) => {
            const r = invoice(num(f, "subtotal"), num(f, "gst"));
            return (
              <>
                <dl className="evidence">
                  <div>
                    <dt>Taxable subtotal</dt>
                    <dd>{rupees(r.subtotal)}</dd>
                  </div>
                  <div>
                    <dt>Entered-rate GST estimate</dt>
                    <dd>{rupees(r.tax)}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{rupees(r.total)}</dd>
                  </div>
                </dl>
                <button
                  onClick={() =>
                    download(
                      "invoice-estimate.txt",
                      `ALLOWANCE / INVOICE ESTIMATE\nSubtotal: ${rupees(r.subtotal)}\nTax: ${rupees(r.tax)}\nTotal: ${rupees(r.total)}\nThis is an arithmetic estimate, not a compliant GST tax invoice.\n`,
                      "text/plain",
                    )
                  }
                >
                  Download estimate
                </button>
              </>
            );
          }}
        >
          <NumberField
            label="Taxable subtotal (INR)"
            name="subtotal"
            value="10000"
          />
          <NumberField
            label="Applicable GST rate (%)"
            name="gst"
            value="18"
            max="100"
          />
        </ToolForm>
      </section>
    </>
  );
}

export function Settings() {
  const w = useWorkspace(),
    [status, setStatus] = useState("");
  return (
    <>
      <PageTitle
        title="Settings"
        description="Manage workspace preferences and understand where your records are stored."
      />
      <section className="paper-section">
        <h2>Personal workspace</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            w.update((data) => ({
              ...data,
              preferences: {
                ...data.preferences,
                displayName: String(f.get("name")).trim(),
              },
            }));
            setStatus(
              "Preference applied. Save your workspace to store it under your account.",
            );
          }}
        >
          <Field
            label="Display name"
            name="name"
            maxLength={80}
            defaultValue={w.data.preferences.displayName}
          />
          <Field label="Currency" value="INR" readOnly />
          <button>Apply preferences</button>
        </form>
        <p role="status">{status}</p>
        <p>
          {w.demo
            ? "This is a fictional guest workspace. It stays in memory, is never saved to an account and resets on reload."
            : `Signed in as ${w.email}. Plans, reviewed transactions, monthly limits, entered holdings and preferences are stored under your account when you select Save workspace.`}
        </p>
        <button
          onClick={() =>
            download(
              "allowance-workspace.json",
              JSON.stringify(w.data, null, 2),
            )
          }
        >
          Export my current workspace
        </button>
        <p>
          The export includes unsaved edits and may contain financial
          information. Keep it on a device you trust.
        </p>
      </section>
      <section className="paper-section">
        <h2>Data and access</h2>
        <p>
          Account data is checked against your authenticated user on the server
          and protected by database ownership policies. It is not shared with
          other app users. Project administrators and infrastructure providers
          may have operational access; this is not end-to-end encryption.
        </p>
        <p>
          Raw import text and suspicious-message checks are not saved
          separately. Imported descriptions and references you explicitly
          include are part of your stored transactions. Gemini receives only an
          applied plan you explicitly approve, with best-effort masking of
          identifiers in labels.
        </p>
        <p>
          Personal workspaces are not copied to browser local storage. Sign out
          before leaving a shared device. Export your work before discarding
          unsaved changes or resolving a save conflict.
        </p>
        {!w.demo && (
          <a href="/forgot-password">Request a password recovery email</a>
        )}
      </section>
    </>
  );
}
