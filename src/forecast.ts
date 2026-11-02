export type Entry = {
  id: string;
  date: string;
  label: string;
  kind: 'income' | 'expense';
  amountPaise: number;
};

export type Plan = {
  startDate: string;
  endDate: string;
  openingBalancePaise: number;
  dailyEssentialsPaise: number;
  entries: Entry[];
};

const DAY = 86_400_000;
function dateValue(value: string): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Use a calendar date in YYYY-MM-DD format.');
  }
  const valueMs = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(valueMs) || new Date(valueMs).toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return valueMs;
}

function money(value: number, label: string, allowNegative = false): void {
  if (!Number.isSafeInteger(value) || (!allowNegative && value < 0)) {
    throw new Error(`${label} must be a ${allowNegative ? '' : 'non-negative '}safe integer in paise.`);
  }
}

function add(a: number, b: number): number {
  const total = a + b;
  money(total, 'Calculated amount', true);
  return total;
}

/** Opening balance precedes all spending on startDate. Both endpoint dates are included.
 * Expenses precede income on the same day; minimums expose that conservative timing.
 * Historical transaction import must reconcile into opening balance outside this module.
 */
export function forecast(plan: Plan) {
  const start = dateValue(plan.startDate);
  const end = dateValue(plan.endDate);
  const dayCount = (end - start) / DAY + 1;
  if (dayCount < 1 || dayCount > 366) throw new Error('Forecast must span between 1 and 366 days.');
  money(plan.openingBalancePaise, 'Opening balance', true);
  money(plan.dailyEssentialsPaise, 'Daily essentials');
  if (!Array.isArray(plan.entries)) throw new Error('Entries must be an array.');
  const ids = new Set<string>();
  for (const entry of plan.entries) {
    if (typeof entry.id !== 'string' || !entry.id.trim() || ids.has(entry.id)) {
      throw new Error('Each entry must have a unique non-empty ID.');
    }
    ids.add(entry.id);
    dateValue(entry.date);
    money(entry.amountPaise, 'Entry amount');
    if (typeof entry.label !== 'string' || !entry.label.trim()) throw new Error('Entry label is required.');
    if (entry.kind !== 'income' && entry.kind !== 'expense') throw new Error('Entry kind must be income or expense.');
  }

  let balance = plan.openingBalancePaise;
  let minimumBalancePaise = balance;
  let firstShortfallDate: string | null = balance < 0 ? plan.startDate : null;
  let totalIncomePaise = 0;
  let totalExpensesPaise = 0;
  const days = [];
  for (let timestamp = start; timestamp <= end; timestamp += DAY) {
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const entries = plan.entries.filter(entry => entry.date === date);
    const incomePaise = entries.filter(entry => entry.kind === 'income').reduce((sum, entry) => add(sum, entry.amountPaise), 0);
    const expensesPaise = entries.filter(entry => entry.kind === 'expense').reduce((sum, entry) => add(sum, entry.amountPaise), plan.dailyEssentialsPaise);
    const openingBalancePaise = balance;
    const beforeIncomePaise = add(balance, -expensesPaise);
    minimumBalancePaise = Math.min(minimumBalancePaise, beforeIncomePaise);
    if (beforeIncomePaise < 0 && firstShortfallDate === null) firstShortfallDate = date;
    balance = add(beforeIncomePaise, incomePaise);
    totalIncomePaise = add(totalIncomePaise, incomePaise);
    totalExpensesPaise = add(totalExpensesPaise, expensesPaise);
    days.push({ date, openingBalancePaise, incomePaise, expensesPaise, beforeIncomePaise, closingBalancePaise: balance, entryIds: entries.map(entry => entry.id) });
  }
  return { days, closingBalancePaise: balance, minimumBalancePaise, firstShortfallDate, totalIncomePaise, totalExpensesPaise };
}

export function comparePurchase(plan: Plan, purchase: { date: string; amountPaise: number }) {
  const date = dateValue(purchase.date);
  if (date < dateValue(plan.startDate) || date > dateValue(plan.endDate)) throw new Error('Purchase must fall inside the forecast.');
  money(purchase.amountPaise, 'Purchase amount');
  const baseline = forecast(plan);
  let id = 'scenario-purchase';
  while (plan.entries.some(entry => entry.id === id)) id += '-';
  const proposed = forecast({ ...plan, entries: [...plan.entries, { id, date: purchase.date, amountPaise: purchase.amountPaise, label: 'Proposed purchase', kind: 'expense' }] });
  return { baseline, proposed, createsShortfall: baseline.firstShortfallDate === null && proposed.firstShortfallDate !== null };
}
