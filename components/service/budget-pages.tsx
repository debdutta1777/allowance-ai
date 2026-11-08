"use client";
import Link from "next/link";
import { validateWorkspace } from "../../lib/workspace-model";
import { useRef, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { ForecastChart } from "./forecast-preview";
import { PageTitle, Field, NumberField, money, download } from "./common";
import { comparePurchase, type Plan } from "../../src/forecast";
import { rupeesToPaise } from "../../src/money";
import { evidenceFor } from "../../src/insights";
import {
  CATEGORIES,
  SAMPLE_CSV,
  SAMPLE_MESSAGES,
  parseImport,
  validateDraft,
  transactionKey,
  type Draft,
  type Transaction,
} from "../../src/imports";
import { predictCategory } from "../../src/category-model";
import { summarizeMonth } from "../../web/monthly-budget.js";

export function Dashboard() {
  const { data, demo } = useWorkspace(),
    base = demo ? "/demo" : "/app",
    forecast = comparePurchase(data.plan, data.purchase),
    month = data.plan.startDate.slice(0, 7),
    summary = summarizeMonth(
      data.transactions,
      month,
      data.budgets[month] ?? {},
    );
  const needsPlan =
    !demo &&
    data.plan.openingBalancePaise === 0 &&
    data.plan.dailyEssentialsPaise === 0 &&
    data.plan.entries.length === 0;
  return (
    <>
      <PageTitle
        title={
          data.preferences.displayName
            ? `Your overview, ${data.preferences.displayName}`
            : "Your money, in view"
        }
        description="Review your applied forecast, imported spending and the next step in your budget."
      />
      {needsPlan && (
        <section className="empty-workspace">
          <p className="eyebrow">SET UP YOUR FIRST PLAN</p>
          <h2>Start with the money you have.</h2>
          <p>
            Enter your available balance, daily essentials and upcoming bills.
            Apply the plan, then select Save workspace to keep it under your
            account.
          </p>
          <div className="actions">
            <Link className="button-link" href="/app/planner">
              Create your first plan
            </Link>
            <Link href="/app/transactions">Import spending records</Link>
          </div>
        </section>
      )}
      {!needsPlan && (
        <>
          <div className="stat-strip">
            <div>
              <span>Lowest forecast balance</span>
              <strong>{money(forecast.baseline.minimumBalancePaise)}</strong>
            </div>
            <div>
              <span>Imported spending · {month}</span>
              <strong>{money(summary.spendingPaise)}</strong>
            </div>
            <div>
              <span>Saved transactions</span>
              <strong>{data.transactions.length}</strong>
            </div>
          </div>
          <section className="dashboard-outlook">
            <div className="outlook-heading">
              <h2>Your cash-flow outlook</h2>
              <Link href={base + "/planner"}>Adjust your plan</Link>
            </div>
            <ForecastChart plan={data.plan} purchase={data.purchase} />
            <p>
              Daily closing balances from your applied plan. Same-day expenses
              precede income when calculating the lowest balance.
            </p>
          </section>
          <section className="paper-section">
            <h2>What needs your attention</h2>
            <p>
              {forecast.proposed.firstShortfallDate
                ? `Your applied purchase scenario first falls below zero on ${forecast.proposed.firstShortfallDate}.`
                : "The applied forecast has no purchase-scenario shortfall within its date range."}
            </p>
            <p>
              {summary.unbudgetedSpendingPaise
                ? `${money(summary.unbudgetedSpendingPaise)} of imported monthly spending has no category limit.`
                : "Set monthly limits after importing transactions to give the spending totals context."}
            </p>
            <Link href={base + "/planner"}>Review your cash-flow plan</Link>
          </section>
        </>
      )}
      <h2>Six ways to work with Allowance</h2>
      <div className="directory-list">
        {[
          [
            "planner",
            "Smart budgeting",
            "Forecast essentials, test a purchase and budget from imported transactions.",
          ],
          [
            "investing",
            "Investing and portfolio guide",
            "Explore SIPs, index funds and deposits; review entered allocations.",
          ],
          [
            "markets",
            "Trading and market insights",
            "Run a moving-average backtest on uploaded historical prices. Paper analysis only.",
          ],
          [
            "tax",
            "Tax helper",
            "Compare supported old and new regime salary estimates.",
          ],
          [
            "safety",
            "Scam and fraud checks",
            "Review a suspicious message for common warning signs.",
          ],
          [
            "business",
            "Small business finance",
            "Estimate cash flow, EMI payments and invoice tax arithmetic.",
          ],
        ].map(([slug, title, description]) => (
          <Link href={base + "/" + slug} key={slug}>
            <h3>{title}</h3>
            <p>{description}</p>
            <span>Open workspace</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export function Planner() {
  const w = useWorkspace(),
    [entries, setEntries] = useState(w.data.plan.entries),
    [planDirty, setPlanDirty] = useState(false),
    [purchaseDirty, setPurchaseDirty] = useState(false),
    [delay, setDelay] = useState(String(w.data.delayDays)),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [ai, setAI] = useState<any>(null);
  const evidence = evidenceFor(w.data.plan, w.data.purchase, w.data.delayDays),
    signature = JSON.stringify([
      w.data.plan,
      w.data.purchase,
      w.data.delayDays,
      planDirty,
      purchaseDirty,
      delay,
    ]),
    latest = useRef(signature);
  latest.current = signature;
  const applyPlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const fields = new FormData(event.currentTarget);
      const candidate: Plan = {
        startDate: String(fields.get("start")),
        endDate: String(fields.get("end")),
        openingBalancePaise: rupeesToPaise(String(fields.get("balance")), true),
        dailyEssentialsPaise: rupeesToPaise(String(fields.get("essentials"))),
        entries: entries.map((item) => ({
          ...item,
          label: String(fields.get(item.id + "-label")).trim(),
          date: String(fields.get(item.id + "-date")),
          kind: String(fields.get(item.id + "-kind")) as "income" | "expense",
          amountPaise: rupeesToPaise(String(fields.get(item.id + "-amount"))),
        })),
      };
      const purchase = {
        ...w.data.purchase,
        date:
          w.data.purchase.date < candidate.startDate ||
          w.data.purchase.date > candidate.endDate
            ? candidate.startDate
            : w.data.purchase.date,
      };
      comparePurchase(candidate, purchase);
      w.update((data) => ({ ...data, plan: candidate, purchase }));
      setEntries(candidate.entries);
      setPlanDirty(false);
      setError("");
      setAI(null);
    } catch (issue) {
      setError((issue as Error).message);
    }
  };
  async function explain() {
    if (planDirty || purchaseDirty || Number(delay) !== w.data.delayDays) {
      setError("Apply all plan, purchase and delay edits first.");
      return;
    }
    const version = signature;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain",
          consent,
          plan: w.data.plan,
          purchase: w.data.purchase,
          delayDays: w.data.delayDays,
        }),
      });
      const result: any = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (latest.current !== version)
        throw new Error(
          "The plan changed during the request. Request a fresh interpretation.",
        );
      setAI({ ...result, signature: version });
    } catch (issue) {
      setError((issue as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Smart budgeting / Cash-flow planner"
        description="Apply your plan, compare a purchase and test whether expected income arrives late."
      />
      <div className="planner-columns">
        <section className="paper-section">
          <h2>Your starting point</h2>
          <form onSubmit={applyPlan} onChange={() => setPlanDirty(true)}>
            <div className="form-grid">
              <NumberField
                label="Opening balance (INR)"
                name="balance"
                value={String(w.data.plan.openingBalancePaise / 100)}
                min="-1000000000"
              />
              <NumberField
                label="Daily essentials (INR)"
                name="essentials"
                value={String(w.data.plan.dailyEssentialsPaise / 100)}
              />
              <Field
                label="Start date"
                name="start"
                type="date"
                defaultValue={w.data.plan.startDate}
                required
              />
              <Field
                label="End date"
                name="end"
                type="date"
                defaultValue={w.data.plan.endDate}
                required
              />
            </div>
            <p>
              Opening balance precedes start-date spending. Include separate
              bills below only once.
            </p>
            <h3>Scheduled expenses and income</h3>
            {entries.map((item, index) => (
              <fieldset key={item.id}>
                <legend>Item {index + 1}</legend>
                <div className="form-grid">
                  <Field
                    label="Description"
                    name={item.id + "-label"}
                    defaultValue={item.label}
                    required
                    maxLength={120}
                  />
                  <label>
                    Type
                    <select name={item.id + "-kind"} defaultValue={item.kind}>
                      <option value="expense">Expense</option>
                      <option value="income">Expected income</option>
                    </select>
                  </label>
                  <NumberField
                    label="Amount (INR)"
                    name={item.id + "-amount"}
                    value={String(item.amountPaise / 100)}
                  />
                  <Field
                    label="Date"
                    name={item.id + "-date"}
                    type="date"
                    defaultValue={item.date}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEntries(entries.filter((row) => row.id !== item.id));
                    setPlanDirty(true);
                  }}
                >
                  Remove item {index + 1}
                </button>
              </fieldset>
            ))}
            <div className="actions">
              <button
                type="button"
                disabled={entries.length >= 100}
                onClick={() => {
                  setEntries([
                    ...entries,
                    {
                      id: crypto.randomUUID(),
                      label: "",
                      date: w.data.plan.startDate,
                      kind: "expense",
                      amountPaise: 0,
                    },
                  ]);
                  setPlanDirty(true);
                }}
              >
                Add an expense or income
              </button>
              <button>Apply plan</button>
            </div>
            {planDirty && <p>Plan edits have not been applied.</p>}
          </form>
        </section>
        <div>
          <section className="paper-section">
            <h2>Your applied forecast</h2>
            <dl className="evidence">
              <div>
                <dt>Lowest balance before purchase</dt>
                <dd>
                  {money(evidence.comparison.baseline.minimumBalancePaise)}
                </dd>
              </div>
              <div>
                <dt>Closing balance before purchase</dt>
                <dd>
                  {money(evidence.comparison.baseline.closingBalancePaise)}
                </dd>
              </div>
            </dl>
            <h3>Test a purchase</h3>
            <form
              key={w.data.plan.startDate + w.data.purchase.date}
              onChange={() => setPurchaseDirty(true)}
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  const f = new FormData(event.currentTarget),
                    purchase = {
                      date: String(f.get("date")),
                      amountPaise: rupeesToPaise(String(f.get("amount"))),
                    };
                  comparePurchase(w.data.plan, purchase);
                  w.update((data) => ({ ...data, purchase }));
                  setPurchaseDirty(false);
                  setError("");
                  setAI(null);
                } catch (issue) {
                  setError((issue as Error).message);
                }
              }}
            >
              <NumberField
                label="Purchase amount (INR)"
                name="amount"
                value={String(w.data.purchase.amountPaise / 100)}
              />
              <Field
                label="Purchase date"
                name="date"
                type="date"
                defaultValue={w.data.purchase.date}
                required
              />
              <button>Compare purchase</button>
            </form>
            <p role="status">
              Lowest with purchase:{" "}
              <strong>
                {money(evidence.comparison.proposed.minimumBalancePaise)}
              </strong>
              .{" "}
              {evidence.comparison.proposed.firstShortfallDate
                ? `First shortfall: ${evidence.comparison.proposed.firstShortfallDate}.`
                : "No projected shortfall within this period."}
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  evidenceFor(w.data.plan, w.data.purchase, Number(delay));
                  w.update((data) => ({ ...data, delayDays: Number(delay) }));
                  setError("");
                  setAI(null);
                } catch (issue) {
                  setError((issue as Error).message);
                }
              }}
            >
              <Field
                label="Income delay (days)"
                type="number"
                min={0}
                max={30}
                step={1}
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                required
              />
              <button>Test income delay</button>
            </form>
            <p>
              Lowest if income is delayed:{" "}
              {money(evidence.delayed.proposed.minimumBalancePaise)}.
            </p>
            <p>
              Expenses occur before same-day income. Entries outside the period
              are excluded; delayed income may fall beyond the forecast end
              date.
            </p>
          </section>
          <section className="paper-section">
            <h2>Interpret the calculated evidence</h2>
            {w.demo ? (
              <p>
                Gemini explanations require a configured personal account. All
                demo calculations work without AI.
              </p>
            ) : (
              <>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  Send this applied plan and calculated evidence to Gemini.
                  Identifiers in labels are masked where possible.
                </label>
                <button disabled={!consent || busy} onClick={explain}>
                  {busy ? "Requesting interpretation…" : "Explain this plan"}
                </button>
              </>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {ai && ai.signature === signature && (
              <div className="tool-result">
                <h3>Gemini interpretation</h3>
                <p>{ai.overview}</p>
                <p>{ai.suggestion}</p>
                <dl className="evidence">
                  {ai.evidence?.map((fact: any) => (
                    <div key={fact.id}>
                      <dt>{fact.label}</dt>
                      <dd>
                        {fact.type === "money" ? money(fact.value) : fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>
        </div>
      </div>
      <details className="paper-section">
        <summary>Daily evidence ledger</summary>
        <div className="table-scroll">
          <table>
            <caption>
              Applied cash flow, INR; costs precede same-day income
            </caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Income</th>
                <th>Costs</th>
                <th>Before income</th>
                <th>Closing</th>
                <th>Purchase low</th>
              </tr>
            </thead>
            <tbody>
              {evidence.comparison.baseline.days.map((day, index) => (
                <tr key={day.date}>
                  <th>{day.date}</th>
                  <td>{money(day.incomePaise)}</td>
                  <td>{money(day.expensesPaise)}</td>
                  <td>{money(day.beforeIncomePaise)}</td>
                  <td>{money(day.closingBalancePaise)}</td>
                  <td>
                    {money(
                      evidence.comparison.proposed.days[index]
                        .beforeIncomePaise,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export function Transactions() {
  const w = useWorkspace(),
    [format, setFormat] = useState<"csv" | "messages">("csv"),
    [text, setText] = useState(""),
    [drafts, setDrafts] = useState<Draft[]>([]),
    [replace, setReplace] = useState(false),
    [undo, setUndo] = useState<Transaction[] | null>(null),
    [error, setError] = useState("");
  function modify(index: number, field: string, value: any) {
    setDrafts((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }
  function apply() {
    try {
      const selected = drafts.filter((d) => d.included),
        base = replace ? [] : w.data.transactions;
      if (!selected.length && !replace)
        throw new Error("Select a transaction to include.");
      if (base.length + selected.length > 1000)
        throw new Error("Save at most 1,000 transactions.");
      const keys = new Set(base.map(transactionKey));
      let changed = false;
      const checked = drafts.map((d) => {
        if (!d.included) return d;
        const item = validateDraft(d),
          key = transactionKey(item);
        if (keys.has(key) && !d.duplicate) {
          changed = true;
          return {
            ...d,
            duplicate: true,
            included: false,
            issue:
              "Duplicate found after editing. Explicitly include only if intentional.",
          };
        }
        keys.add(key);
        return d;
      });
      if (changed) {
        setDrafts(checked);
        throw new Error("Review duplicates found after editing.");
      }
      const items = selected.map((d) => ({
        ...validateDraft(d),
        id: replace ? d.id : crypto.randomUUID(),
      }));
      const candidate = validateWorkspace({
        ...w.data,
        transactions: [...base, ...items],
      });
      setUndo(w.data.transactions);
      w.update(() => candidate);
      setDrafts([]);
      setText("");
      setError("");
    } catch (issue) {
      setError((issue as Error).message);
    }
  }
  return (
    <>
      <PageTitle
        title="Transactions"
        description="Import supported CSV or explicitly dated bank messages. Review before saving. Imported history never deducts your opening balance again."
      />
      <section className="paper-section">
        <h2>Bring in a record</h2>
        <p>
          Up to 200 rows and 64 KB per import; 1,000 saved transactions. Only
          the normalized rows you include are stored in your account after you
          save the workspace. Raw pasted text is not stored separately.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              setDrafts(parseImport(text, format, w.data.transactions));
              setReplace(false);
              setError("");
            } catch (issue) {
              setError((issue as Error).message);
            }
          }}
        >
          <label>
            Input format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "csv" | "messages")}
            >
              <option value="csv">CSV transactions</option>
              <option value="messages">Dated transaction messages</option>
            </select>
          </label>
          <label>
            Choose a CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (event) => {
                try {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 65536)
                    throw new Error("Choose a file under 64 KB.");
                  setText(await file.text());
                  setFormat("csv");
                  setError("");
                } catch (issue) {
                  setError((issue as Error).message);
                }
              }}
            />
          </label>
          <label>
            Paste transactions
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={65536}
              required
            />
          </label>
          <p>
            CSV headers: date,description,amount,direction,reference.
            Directions: debit, credit, transfer. Dates must be explicit. PDF
            statements and direct bank connections are not supported.
          </p>
          <div className="actions">
            <button>Preview import</button>
            <button
              type="button"
              onClick={() =>
                setText(format === "csv" ? SAMPLE_CSV : SAMPLE_MESSAGES)
              }
            >
              Load fictional sample
            </button>
            <button
              type="button"
              onClick={() =>
                download("allowance-sample.csv", SAMPLE_CSV, "text/csv")
              }
            >
              Download sample CSV
            </button>
          </div>
        </form>
      </section>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {drafts.length > 0 && (
        <section className="paper-section">
          <h2>Review {drafts.length} rows</h2>
          <p>
            {drafts.filter((d) => d.duplicate).length} possible duplicates.
            Duplicates are excluded unless you explicitly include them.
          </p>
          <button
            onClick={() => {
              setDrafts((rows) =>
                rows.map((row) => {
                  if (!row.included) return row;
                  const prediction = predictCategory(
                    row.description,
                    row.direction,
                  );
                  return { ...row, category: prediction.category };
                }),
              );
            }}
          >
            Categorize selected rows with local AI
          </button>
          {drafts.map((row, index) => (
            <fieldset key={row.id + "-" + index}>
              <legend>
                Transaction {index + 1}
                {row.duplicate ? " / Possible duplicate" : ""}
              </legend>
              <div className="form-grid">
                <Field
                  label="Date"
                  type="date"
                  value={row.date}
                  onChange={(e) => modify(index, "date", e.target.value)}
                />
                <Field
                  label="Description"
                  value={row.description}
                  maxLength={120}
                  onChange={(e) => modify(index, "description", e.target.value)}
                />
                <Field
                  label="Amount (INR)"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => modify(index, "amount", e.target.value)}
                />
                <label>
                  Direction
                  <select
                    value={row.direction}
                    onChange={(e) => modify(index, "direction", e.target.value)}
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                    <option value="transfer">Own transfer</option>
                  </select>
                </label>
                <label>
                  Category
                  <select
                    value={row.category}
                    onChange={(e) => modify(index, "category", e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Reference"
                  value={row.reference}
                  maxLength={80}
                  onChange={(e) => modify(index, "reference", e.target.value)}
                />
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={row.included}
                  onChange={(e) => modify(index, "included", e.target.checked)}
                />
                {row.duplicate
                  ? "Keep possible duplicate"
                  : "Include transaction"}
              </label>
              {row.issue && <p>{row.issue}</p>}
            </fieldset>
          ))}
          <div className="actions">
            <button onClick={apply}>Apply reviewed rows</button>
            <button onClick={() => setDrafts([])}>Cancel review</button>
          </div>
        </section>
      )}
      <section className="paper-section">
        <h2>Saved record / {w.data.transactions.length} transactions</h2>
        <div className="actions">
          <button
            disabled={!w.data.transactions.length}
            onClick={() => {
              setDrafts(
                w.data.transactions.map((row) => ({
                  ...row,
                  amount: String(row.amountPaise / 100),
                  included: true,
                  duplicate: false,
                  issue: "",
                })),
              );
              setReplace(true);
            }}
          >
            Review or correct history
          </button>
          <button
            disabled={!w.data.transactions.length}
            onClick={() => {
              setUndo(w.data.transactions);
              w.update((data) => ({ ...data, transactions: [] }));
            }}
          >
            Clear imported history
          </button>
          <button
            disabled={!undo}
            onClick={() => {
              if (undo) w.update((data) => ({ ...data, transactions: undo }));
              setUndo(null);
            }}
          >
            Undo last history change
          </button>
        </div>
        <p>
          Clearing is reversible with Undo until you leave this page. Account
          changes require Save workspace.
        </p>
        <div className="table-scroll">
          <table>
            <caption>Reviewed imported transactions</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Direction</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {w.data.transactions.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <th>{row.description}</th>
                  <td>{row.direction}</td>
                  <td>{row.category}</td>
                  <td>{money(row.amountPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

const expenseCategories = [
  "Food",
  "Transport",
  "Housing",
  "Education",
  "Health",
  "Shopping",
  "Subscriptions",
  "Other",
] as const;
export function Budgets() {
  const w = useWorkspace(),
    [month, setMonth] = useState(w.data.plan.startDate.slice(0, 7)),
    [error, setError] = useState("");
  let summary;
  try {
    summary = summarizeMonth(
      w.data.transactions,
      month,
      w.data.budgets[month] ?? {},
    );
  } catch {
    return (
      <>
        <PageTitle
          title="Monthly budgets"
          description="Choose a valid calendar month."
        />
        <Field
          label="Budget month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </>
    );
  }
  return (
    <>
      <PageTitle
        title="Monthly budgets"
        description="Compare category limits with imported spending. Income, refunds and own transfers remain separate."
      />
      <Field
        label="Budget month"
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        required
      />
      <div className="stat-strip">
        <div>
          <span>Spending</span>
          <strong>{money(summary.spendingPaise)}</strong>
        </div>
        <div>
          <span>Income</span>
          <strong>{money(summary.incomePaise)}</strong>
        </div>
        <div>
          <span>Refunds / own transfers</span>
          <strong>
            {money(summary.refundsPaise)} / {money(summary.transfersPaise)}
          </strong>
        </div>
      </div>
      <section className="paper-section">
        <form
          key={month}
          onSubmit={(event) => {
            event.preventDefault();
            try {
              const f = new FormData(event.currentTarget),
                limits: Record<string, number> = {};
              for (const c of expenseCategories) {
                const value = String(f.get(c)).trim();
                if (value) limits[c] = rupeesToPaise(value);
              }
              w.update((data) => ({
                ...data,
                budgets: { ...data.budgets, [month]: limits },
              }));
              setError("");
            } catch (issue) {
              setError((issue as Error).message);
            }
          }}
        >
          <div className="table-scroll">
            <table>
              <caption>Limits for {month}, INR</caption>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Spent</th>
                  <th>Monthly limit</th>
                  <th>Remaining / overspend</th>
                </tr>
              </thead>
              <tbody>
                {expenseCategories.map((category) => {
                  const row = summary.categories.find(
                      (item: any) => item.category === category,
                    ),
                    limit = w.data.budgets[month]?.[category];
                  return (
                    <tr key={category}>
                      <th>{category}</th>
                      <td>{money(row?.spendingPaise ?? 0)}</td>
                      <td>
                        <Field
                          label={category + " monthly limit (INR)"}
                          name={category}
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={
                            limit === undefined ? "" : String(limit / 100)
                          }
                        />
                      </td>
                      <td>
                        {row?.limitPaise === null || limit === undefined
                          ? "Limit not set"
                          : (row?.remainingPaise ?? 0) < 0
                            ? `Over by ${money(-(row?.remainingPaise ?? 0))}`
                            : `Remaining ${money(row?.remainingPaise ?? 0)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p>
            Blank means no limit; zero means no spending allowance. Refunds do
            not automatically replenish limits.{" "}
            {money(summary.unbudgetedSpendingPaise)} of spending has no category
            limit.
          </p>
          <button>Apply monthly limits</button>
          {error && <p role="alert">{error}</p>}
        </form>
      </section>
    </>
  );
}
