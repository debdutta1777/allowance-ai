import { summarizeMonth, validMonth } from './monthly-budget.js';
import { rupeesToPaise } from './money.js';
const expenseCategories = ['Food','Transport','Housing','Education','Health','Shopping','Subscriptions','Other'];
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:2}).format(value/100);
const inputAmount = value => String(BigInt(value)/100n) + '.' + String(BigInt(value)%100n).padStart(2,'0');
const STORAGE = 'allowance:monthly-budgets:v1';
export function setupMonthlyBudget({getTransactions,getStartDate}) {
  const $ = id => document.getElementById(id);
  let months = Object.create(null), month = getStartDate().slice(0,7), selected = false;
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw && raw.length > 65536) throw new Error('Saved budgets are too large.');
    const saved = raw ? JSON.parse(raw) : {};
    if (!saved || typeof saved !== 'object' || Array.isArray(saved) || Object.keys(saved).length > 120) throw new Error('Invalid saved budgets.');
    for (const [key, limits] of Object.entries(saved)) {
      summarizeMonth([],key,limits);
      months[key] = Object.fromEntries(Object.entries(limits).filter(([category]) => expenseCategories.includes(category)));
    }
  } catch { $('budget-status').textContent = 'Saved limits could not be restored. Enter monthly limits again.'; }
  function refresh() {
    try {
      const transactions = getTransactions();
      if (!selected) {
        const latest = transactions.filter(item=>item.direction==='debit').map(item=>item.date).sort().at(-1);
        if (latest) month = latest.slice(0,7);
      }
      $('budget-month').value = month;
      const report = summarizeMonth(transactions,month,months[month]??{});
      $('budget-summary').textContent = report.transactionCount + ' saved transactions in ' + month + '. Spending: ' + money(report.spendingPaise) + '. Income: ' + money(report.incomePaise) + '. Refunds: ' + money(report.refundsPaise) + '. Own transfers: ' + money(report.transfersPaise) + '. Total category limits: ' + money(report.budgetPaise) + '.';
      const categories = [...new Set([...expenseCategories,...report.categories.map(row=>row.category)])];
      $('budget-rows').innerHTML = categories.map((category,index) => {
        const row = report.categories.find(item=>item.category===category);
        const limit = row?.limitPaise ?? null, spent = row?.spendingPaise ?? 0;
        const editable = expenseCategories.includes(category);
        const status = limit === null ? 'Limit not set' : row?.status === 'over' ? 'Over by ' + money(spent-limit) : row?.status === 'at-limit' ? 'At limit' : money(limit-spent) + ' remaining';
        return '<tr><th scope="row">' + escape(category) + '</th><td>' + escape(money(spent)) + '</td><td>' + (editable ? '<label class="sr-only" for="budget-limit-' + index + '">' + escape(category) + ' monthly limit in rupees</label><input id="budget-limit-' + index + '" data-category="' + escape(category) + '" type="number" min="0" step="0.01" value="' + (limit===null?'':inputAmount(limit)) + '">' : 'Not budgeted') + '</td><td class="' + (row?.status==='over'?'negative':'') + '">' + escape(status) + '</td></tr>';
      }).join('');
      $('budget-warning').textContent = report.unbudgetedSpendingPaise > 0 ? money(report.unbudgetedSpendingPaise) + ' of spending has no category limit. Refunds are shown separately and do not automatically replenish a category limit.' : 'Refunds are shown separately and do not automatically replenish a category limit.';
    } catch (issue) {
      $('budget-rows').replaceChildren();
      $('budget-summary').textContent = 'Monthly report unavailable.';
      $('budget-status').textContent = issue.message;
    }
  }
  $('budget-month').addEventListener('change',()=>{
    if (!validMonth($('budget-month').value)) { $('budget-status').textContent='Choose a valid month.';return; }
    selected=true;month=$('budget-month').value;refresh();$('budget-status').textContent='Showing saved limits for '+month+'.';
  });
  $('budget-form').addEventListener('input',event=>{
    if (event.target.dataset.category) $('budget-status').textContent='Unsaved limits. Select Save monthly limits to apply them.';
  });
  $('budget-form').addEventListener('submit',event=>{
    event.preventDefault();
    try {
      if (!validMonth(month)) throw new Error('Choose a valid month.');
      const limits=Object.create(null);
      for (const input of $('budget-rows').querySelectorAll('input[data-category]')) {
        if (input.value.trim()) limits[input.dataset.category]=rupeesToPaise(input.value);
      }
      summarizeMonth(getTransactions(),month,limits);
      months[month]=limits;
      let message='Monthly limits saved on this browser.';
      try { localStorage.setItem(STORAGE,JSON.stringify(months)); }
      catch { message='Limits applied for this session. Browser storage is unavailable.'; }
      refresh();$('budget-status').textContent=message;
    } catch(issue) { $('budget-status').textContent=issue.message; }
  });
  refresh();
  return {refresh};
}
