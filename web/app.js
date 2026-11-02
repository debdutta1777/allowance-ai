import { forecast, comparePurchase } from './forecast.js';
import { samplePlan } from './sample.js';
import { rupeesToPaise } from './money.js';

const $ = id => document.getElementById(id);
const STORAGE = 'allowance:plan:v1';
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const money = value => currency.format(value / 100);
const dateLabel = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let plan = structuredClone(samplePlan);
let purchase = { amountPaise: 200000, date: '2026-11-04' };
let custom = false;
let planDirty = false;
let storageMessage = '';
try {
  const raw = localStorage.getItem(STORAGE);
  if (raw) {
    const saved = JSON.parse(raw);
    forecast(saved.plan);
    comparePurchase(saved.plan, saved.purchase);
    plan = saved.plan;
    purchase = saved.purchase;
    custom = true;
    storageMessage = 'Restored your last saved plan from this browser.';
  }
} catch {
  storageMessage = 'Could not restore browser data. The fictional sample is loaded.';
}

function error(id, message = '') {
  $(id).textContent = message;
  $(id).hidden = !message;
}

function persist() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({ plan, purchase }));
    $('save-status').textContent = 'Saved on this browser. No bank account is connected.';
  } catch {
    $('save-status').textContent = 'Browser storage is unavailable. Your plan works for this session.';
  }
}

function entryRow(entry, index) {
  const row = document.createElement('div');
  row.className = 'entry';
  row.dataset.id = entry.id;
  row.innerHTML = `<div class="entry-top"><span class="entry-number">ITEM ${String(index + 1).padStart(2, '0')}</span><button type="button" class="remove-entry" aria-label="Remove item ${index + 1}">Remove</button></div><div class="entry-fields"><div class="entry-name"><label for="entry-name-${index}">Description</label><input id="entry-name-${index}" data-field="label" value="${escape(entry.label)}" maxlength="120" required></div><div><label for="entry-kind-${index}">Type</label><select id="entry-kind-${index}" data-field="kind"><option value="expense">Expense</option><option value="income">Expected income</option></select></div><div><label for="entry-amount-${index}">Amount (INR)</label><input id="entry-amount-${index}" data-field="amount" type="number" min="0" step="0.01" value="${entry.amountPaise / 100}" required></div><div class="entry-name"><label for="entry-date-${index}">Date</label><input id="entry-date-${index}" data-field="date" type="date" value="${escape(entry.date)}" required></div></div>`;
  row.querySelector('[data-field=kind]').value = entry.kind;
  row.querySelector('.remove-entry').addEventListener('click', () => {
    row.remove();
    planDirty = true;
    $('save-status').textContent = 'Unapplied changes. Select Update forecast to recalculate.';
    $('add-entry').focus();
  });
  return row;
}

let nextRowIndex = 0;
function fillForms() {
  $('balance').value = plan.openingBalancePaise / 100;
  $('start').value = plan.startDate;
  $('end').value = plan.endDate;
  $('essentials').value = plan.dailyEssentialsPaise / 100;
  $('entries').replaceChildren(...plan.entries.map((entry, index) => entryRow(entry, index)));
  nextRowIndex = plan.entries.length;
  fillPurchase();
}

function fillPurchase() {
  $('purchase-amount').value = purchase.amountPaise / 100;
  $('purchase-date').value = purchase.date;
  $('purchase-date').min = plan.startDate;
  $('purchase-date').max = plan.endDate;
}

function readPlan() {
  return {
    startDate: $('start').value,
    endDate: $('end').value,
    openingBalancePaise: rupeesToPaise($('balance').value, true),
    dailyEssentialsPaise: rupeesToPaise($('essentials').value),
    entries: [...$('entries').children].map(row => ({
      id: row.dataset.id,
      label: row.querySelector('[data-field=label]').value.trim(),
      kind: row.querySelector('[data-field=kind]').value,
      date: row.querySelector('[data-field=date]').value,
      amountPaise: rupeesToPaise(row.querySelector('[data-field=amount]').value)
    }))
  };
}

function renderChart(baseline, proposed) {
  const width = 780, height = 285;
  const left = 66, right = 13, top = 24, bottom = 35;
  const allValues = [0, plan.openingBalancePaise, ...baseline.days.flatMap(d => [d.beforeIncomePaise, d.closingBalancePaise]), ...proposed.days.flatMap(d => [d.beforeIncomePaise, d.closingBalancePaise])];
  let min = Math.min(...allValues), max = Math.max(...allValues);
  const margin = Math.max((max - min) * 0.1, 10000);
  min -= margin; max += margin;
  const y = value => top + (max - value) / (max - min) * (height - top - bottom);
  const x = position => left + position / (baseline.days.length * 2) * (width - left - right);
  const path = days => {
    let d = `M${x(0)},${y(plan.openingBalancePaise)}`;
    days.forEach((day, i) => { d += ` L${x(i * 2 + 1)},${y(day.beforeIncomePaise)} L${x(i * 2 + 2)},${y(day.closingBalancePaise)}`; });
    return d;
  };
  const ticks = [min + (max - min) * .2, min + (max - min) * .5, min + (max - min) * .8].filter(value => Math.abs(y(value) - y(0)) > 18);
  const compact = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1, notation: 'compact' }).format(value / 100);
  const indices = [...new Set([0, Math.floor((baseline.days.length - 1) / 2), baseline.days.length - 1])];
  $('chart').innerHTML = `<title id="chart-title">Projected cash-flow comparison</title><desc id="chart-description">${escape(`Baseline lowest balance ${money(baseline.minimumBalancePaise)}. With purchase ${money(proposed.minimumBalancePaise)}. ${proposed.firstShortfallDate ? `First purchase-scenario shortfall ${dateLabel(proposed.firstShortfallDate)}.` : 'No projected purchase-scenario shortfall.'} Daily numerical values are available in the ledger below.`)}</desc>${ticks.map(value => `<line x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}" stroke="#b3b6ab" stroke-width=".7"/><text x="${left-10}" y="${y(value)+4}" text-anchor="end">${escape(compact(value))}</text>`).join('')}<line x1="${left}" x2="${width-right}" y1="${y(0)}" y2="${y(0)}" stroke="#526160" stroke-width="1"/><text x="${left-10}" y="${y(0)+4}" text-anchor="end">₹0</text><path d="${path(baseline.days)}" fill="none" stroke="#355c62" stroke-width="2.5"/><path d="${path(proposed.days)}" fill="none" stroke="#845646" stroke-width="2.5" stroke-dasharray="7 5"/>${indices.map(i => `<text x="${x(i*2+2)}" y="${height-8}" text-anchor="${i===baseline.days.length-1?'end':'middle'}">${dateLabel(baseline.days[i].date)}</text>`).join('')}`;
}

function render() {
  const { baseline, proposed } = comparePurchase(plan, purchase);
  $('mode-label').textContent = custom ? 'YOUR SAVED SCENARIO · BROWSER LOCAL' : 'FICTIONAL STUDENT SCENARIO';
  $('date-range').textContent = `${dateLabel(plan.startDate)} to ${dateLabel(plan.endDate)} · ${plan.endDate.slice(0,4)}`;
  $('baseline-min').textContent = money(baseline.minimumBalancePaise);
  $('baseline-min').classList.toggle('negative', baseline.minimumBalancePaise < 0);
  $('baseline-close').textContent = money(baseline.closingBalancePaise);
  const excluded = plan.entries.filter(entry => entry.date < plan.startDate || entry.date > plan.endDate).length;
  $('excluded-note').hidden = excluded === 0;
  $('excluded-note').textContent = `${excluded} scheduled item${excluded === 1 ? ' is' : 's are'} outside this period and excluded from the calculation.`;
  $('baseline-caption').textContent = baseline.firstShortfallDate ? `First shortfall: ${dateLabel(baseline.firstShortfallDate)}` : 'Essentials covered under these assumptions';
  renderChart(baseline, proposed);
  let heading, detail;
  if (proposed.firstShortfallDate) {
    heading = baseline.firstShortfallDate ? 'Your plan already has a gap.' : 'This purchase creates a gap.';
    detail = `With this purchase, the first projected shortfall is ${dateLabel(proposed.firstShortfallDate)}. The lowest balance is ${money(proposed.minimumBalancePaise)}. `;
    detail += baseline.firstShortfallDate ? `Without the purchase, a shortfall starts ${dateLabel(baseline.firstShortfallDate)}.` : 'Try a smaller amount, postpone the purchase or revise your plan.';
  } else {
    heading = 'There is room in this forecast.';
    detail = `After the ${money(purchase.amountPaise)} purchase, your lowest balance is ${money(proposed.minimumBalancePaise)}. This assumes expected income arrives on the dates entered.`;
  }
  $('purchase-result').innerHTML = `<div><h3>${escape(heading)}</h3><p>${escape(detail)}</p></div><div class="result-number ${proposed.minimumBalancePaise < 0 ? 'negative' : ''}"><strong>${escape(money(proposed.minimumBalancePaise))}</strong><span>LOWEST WITH PURCHASE</span></div>`;
  $('ledger-count').textContent = `${baseline.days.length} days`;
  $('ledger-body').innerHTML = baseline.days.map((day, i) => {
    const compared = proposed.days[i];
    const cell = amount => `<td class="${amount < 0 ? 'negative' : ''}">${escape(money(amount))}</td>`;
    return `<tr class="${compared.beforeIncomePaise < 0 ? 'shortfall' : ''}"><th scope="row">${dateLabel(day.date)}</th>${[day.incomePaise, day.expensesPaise, day.beforeIncomePaise, day.closingBalancePaise, compared.beforeIncomePaise, compared.closingBalancePaise].map(cell).join('')}</tr>`;
  }).join('');
}

$('plan-form').addEventListener('input', () => {
  planDirty = true;
  $('save-status').textContent = 'Unapplied changes. Select Update forecast to recalculate.';
});
$('plan-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const candidate = readPlan();
    forecast(candidate);
    const candidatePurchase = { ...purchase, date: purchase.date < candidate.startDate || purchase.date > candidate.endDate ? candidate.startDate : purchase.date };
    comparePurchase(candidate, candidatePurchase);
    plan = candidate;
    planDirty = false;
    purchase = candidatePurchase;
    custom = true;
    fillPurchase();
    error('plan-error'); error('purchase-error');
    render(); persist();
    $('forecast-heading').focus();
  } catch (issue) { error('plan-error', `${issue.message} The forecast still uses your last applied plan.`); }
});
$('add-entry').addEventListener('click', () => {
  if ($('entries').children.length >= 100) { error('plan-error', 'This edition supports up to 100 scheduled items.'); return; }
  const existingIds = new Set([...$('entries').children].map(row => row.dataset.id));
  let id = `item-${nextRowIndex}`;
  while (existingIds.has(id)) id += '-';
  const row = entryRow({ id, label: '', kind: 'expense', date: $('start').value || plan.startDate, amountPaise: 0 }, nextRowIndex++);
  $('entries').append(row);
  planDirty = true;
  row.querySelector('input').focus();
  $('save-status').textContent = 'Unapplied changes. Complete the item and update the forecast.';
});
$('purchase-form').addEventListener('input', () => {
  error('purchase-error', 'Purchase changed. Select Compare purchase to update the result.');
});
$('purchase-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    if (planDirty) throw new Error('Apply plan changes with Update forecast before comparing a purchase.');
    const candidate = { date: $('purchase-date').value, amountPaise: rupeesToPaise($('purchase-amount').value) };
    comparePurchase(plan, candidate);
    purchase = candidate;
    error('purchase-error');
    render(); persist();
  } catch (issue) { error('purchase-error', `${issue.message} The comparison still uses your last applied purchase.`); }
});
$('reset').addEventListener('click', () => {
  plan = structuredClone(samplePlan);
  purchase = { date: '2026-11-04', amountPaise: 200000 };
  custom = false;
  planDirty = false;
  try { localStorage.removeItem(STORAGE); } catch { /* Session still works. */ }
  fillForms(); render();
  error('plan-error'); error('purchase-error');
  $('save-status').textContent = 'Fictional sample restored. Changes save when you update.';
});
fillForms();
render();
if (storageMessage) $('save-status').textContent = storageMessage;
