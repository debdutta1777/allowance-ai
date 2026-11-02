function isoDate(value) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : value.slice(6,10) + '-' + value.slice(3,5) + '-' + value.slice(0,2);
  const timestamp = Date.parse(normalized + 'T00:00:00Z');
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0,10) === normalized ? normalized : null;
}
function normalizeAmount(value) {
  const plain = /^\d+(?:\.\d{1,2})?$/;
  const western = /^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/;
  const indian = /^\d{1,2}(?:,\d{2})*,\d{3}(?:\.\d{1,2})?$/;
  return plain.test(value) || western.test(value) || indian.test(value) ? value.replaceAll(',', '') : null;
}
export function parseDatedAlert(value) {
  if (typeof value !== 'string' || value.length > 2000) return null;
  const line = value.trim();
  if (/\b(?:collect request|payment request|OTP|failed|declined|pending)\b/i.test(line)) return null;
  const simple = line.match(/^(\d{4}-\d{2}-\d{2})\s+(?:INR|Rs\.?|₹)\s*(\d+(?:\.\d{1,2})?)\s+(debited to|credited from|transferred to)\s+(.+?)(?:\s+ref\s+(\S+))?$/i);
  if (simple) {
    if (!isoDate(simple[1])) return null;
    return { date:simple[1], amount:simple[2], direction:/^debited/i.test(simple[3])?'debit':/^credited/i.test(simple[3])?'credit':'transfer', description:simple[4], reference:simple[5]??'' };
  }
  const verbs = new Set((line.match(/\b(?:debited|credited)\b/gi) ?? []).map(word => word.toLowerCase()));
  if (verbs.size !== 1) return null;
  const amountFirst = line.match(/(?:INR|Rs\.?|₹)\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s+(debited|credited)\b/i);
  const verbFirst = line.match(/\b(debited|credited)\s+(?:by|with)\s+(?:INR|Rs\.?|₹)\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)/i);
  if (!amountFirst && !verbFirst) return null;
  const amount = normalizeAmount(amountFirst ? amountFirst[1] : verbFirst[2]);
  const verb = amountFirst ? amountFirst[2] : verbFirst[1];
  const dated = /\bon\s+(\d{4}-\d{2}-\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b/i.exec(line);
  if (!amount || !dated) return null;
  const date = isoDate(dated[1]);
  if (!date) return null;
  const remainder = line.slice(dated.index + dated[0].length);
  const counterparty = /\b(?:to|from)\s+(?:VPA\s+)?(.+)/i.exec(remainder);
  if (!counterparty) return null;
  const refPattern = /\b(?:UPI\s+)?(?:Ref(?:erence)?(?:\s*(?:No\.?|number))?|RRN|UTR)\s*[:#-]?\s*([A-Za-z0-9_-]{4,80})\b/i;
  const ref = refPattern.exec(counterparty[1]);
  let description = (ref ? counterparty[1].slice(0, ref.index) : counterparty[1]).split(/\s+(?:Avl|Avail(?:able)?)\.?\s+Bal(?:ance)?/i)[0].replace(/[.\s;,-]+$/, '').trim();
  if (!description || description.length > 120) return null;
  return { date, amount, direction:verb.toLowerCase()==='debited'?'debit':'credit', description, reference:ref?.[1]??'' };
}
