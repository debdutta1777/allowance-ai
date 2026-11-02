/** Parse decimal rupees as text, avoiding floating-point multiplication. */
export function rupeesToPaise(value: string, allowNegative = false): number {
  const text = value.trim();
  const pattern = allowNegative ? /^-?\d+(?:\.\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/;
  if (!pattern.test(text)) throw new Error('Enter a rupee amount with up to two decimal places.');
  const negative = text.startsWith('-');
  const [whole, decimal = ''] = text.replace('-', '').split('.');
  const amount = BigInt(whole) * 100n + BigInt(decimal.padEnd(2, '0'));
  const signed = Number(negative ? -amount : amount);
  if (!Number.isSafeInteger(signed)) throw new Error('Amount is too large.');
  return signed;
}
