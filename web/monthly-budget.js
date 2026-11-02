function checkedAmount(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Amounts must be non-negative integer paise.');
  return value;
}
function addAmount(left, right) {
  const total = left + right;
  if (!Number.isSafeInteger(total)) throw new Error('Monthly total is too large.');
  return total;
}
export function validMonth(value) {
  return typeof value === 'string' && /^[1-9]\d{3}-(?:0[1-9]|1[0-2])$/.test(value);
}
export function summarizeMonth(transactions, month, limits = {}) {
  if (!validMonth(month)) throw new Error('Choose a month in YYYY-MM format.');
  if (!Array.isArray(transactions) || transactions.length > 1000) throw new Error('Use at most 1,000 saved transactions.');
  if (!limits || typeof limits !== 'object' || Array.isArray(limits)) throw new Error('Invalid monthly limits.');
  const budgets = Object.create(null);
  for (const [category, amount] of Object.entries(limits)) {
    if (!category.trim() || category.length > 40) throw new Error('Invalid budget category.');
    budgets[category] = checkedAmount(amount);
  }
  const spent = Object.create(null);
  let spendingPaise = 0, incomePaise = 0, refundsPaise = 0, transfersPaise = 0, transactionCount = 0;
  for (const transaction of transactions) {
    const date = transaction?.date;
    const timestamp = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(date + 'T00:00:00Z') : NaN;
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0,10) !== date) throw new Error('Invalid transaction date.');
    checkedAmount(transaction.amountPaise);
    if (!['debit','credit','transfer'].includes(transaction.direction)) throw new Error('Invalid transaction direction.');
    if (typeof transaction.category !== 'string' || !transaction.category.trim() || transaction.category.length > 40) throw new Error('Invalid transaction category.');
    if (!date.startsWith(month + '-')) continue;
    transactionCount++;
    if (transaction.direction === 'transfer') transfersPaise = addAmount(transfersPaise, transaction.amountPaise);
    else if (transaction.direction === 'debit') {
      spendingPaise = addAmount(spendingPaise, transaction.amountPaise);
      spent[transaction.category] = addAmount(spent[transaction.category] ?? 0, transaction.amountPaise);
    } else if (transaction.category === 'Refunds') refundsPaise = addAmount(refundsPaise, transaction.amountPaise);
    else incomePaise = addAmount(incomePaise, transaction.amountPaise);
  }
  let budgetPaise = 0, unbudgetedSpendingPaise = 0;
  const categories = [...new Set([...Object.keys(budgets), ...Object.keys(spent)])].sort().map(category => {
    const limitPaise = Object.hasOwn(budgets, category) ? budgets[category] : null;
    const spending = spent[category] ?? 0;
    if (limitPaise !== null) budgetPaise = addAmount(budgetPaise, limitPaise);
    else unbudgetedSpendingPaise = addAmount(unbudgetedSpendingPaise, spending);
    return { category, spendingPaise: spending, limitPaise, remainingPaise: limitPaise === null ? null : limitPaise - spending,
      status: limitPaise === null ? 'not-set' : spending > limitPaise ? 'over' : spending === limitPaise ? 'at-limit' : 'within' };
  });
  return { month, transactionCount, spendingPaise, incomePaise, refundsPaise, transfersPaise, budgetPaise, unbudgetedSpendingPaise, categories };
}
