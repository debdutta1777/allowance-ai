import { validDate } from "./imports.ts";

function finite(value: number, label: string, min = 0, max = 1e9) {
  if (!Number.isFinite(value) || value < min || value > max)
    throw new Error(`${label} must be between ${min} and ${max}.`);
  return value;
}
function integer(value: number, label: string, min: number, max: number) {
  finite(value, label, min, max);
  if (!Number.isInteger(value))
    throw new Error(`${label} must be a whole number.`);
  return value;
}
function rounded(value: number) {
  if (
    !Number.isFinite(value) ||
    Math.abs(value) > Number.MAX_SAFE_INTEGER / 100
  )
    throw new Error("Calculated amount is too large.");
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function investmentProjection(
  monthly: number,
  principal: number,
  annualPercent: number,
  years: number,
) {
  finite(monthly, "Monthly contribution", 0, 1e7);
  finite(principal, "Principal", 0, 1e9);
  finite(annualPercent, "Assumed annual return", -50, 50);
  integer(years, "Years", 1, 50);
  const months = years * 12,
    monthlyRate = Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
  // Contributions occur at the END of each month. Return is an effective annual assumption.
  let sip = 0;
  for (let i = 0; i < months; i++) sip = sip * (1 + monthlyRate) + monthly;
  const lump = principal * Math.pow(1 + annualPercent / 100, years);
  return {
    contributed: rounded(monthly * months),
    sip: rounded(sip),
    lump: rounded(lump),
  };
}
export function portfolioReview(
  holdings: Array<{ name: string; kind: string; valuePaise: number }>,
) {
  if (!holdings.length)
    return {
      totalPaise: 0,
      equityPercent: 0,
      largestPercent: 0,
      flags: ["Add holdings to review allocation."],
    };
  let total = 0,
    equity = 0;
  for (const holding of holdings) {
    integer(holding.valuePaise, "Holding value", 1, 100_000_000_000);
    total += holding.valuePaise;
    if (holding.kind === "Equity") equity += holding.valuePaise;
  }
  const largest =
    (Math.max(...holdings.map((h) => h.valuePaise)) / total) * 100;
  const flags = [];
  if (largest > 40)
    flags.push(
      "One holding exceeds 40% of the entered portfolio. This is a concentration prompt, not an assessment of the fund’s underlying diversification.",
    );
  if (equity / total > 0.8)
    flags.push(
      "More than 80% is classified as equity. Consider whether you could tolerate a substantial market fall.",
    );
  if (!holdings.some((h) => h.kind === "Cash"))
    flags.push(
      "No cash allocation was entered. Emergency savings may exist outside this list.",
    );
  if (!flags.length)
    flags.push(
      "These simple allocation checks found no threshold flags. They do not establish that the portfolio is suitable or safe.",
    );
  return {
    totalPaise: total,
    equityPercent: (equity / total) * 100,
    largestPercent: largest,
    flags,
  };
}
export type Price = { date: string; close: number };
export function parsePrices(csv: string): Price[] {
  if (new TextEncoder().encode(csv).length > 65536)
    throw new Error("Use a historical CSV under 64 KB.");
  const lines = csv.trim().split(/\r?\n/);
  if (lines.shift()?.trim().toLowerCase() !== "date,close")
    throw new Error("Use date,close headers.");
  if (lines.length < 3 || lines.length > 2000)
    throw new Error("Use 3 to 2,000 historical observations.");
  const rows = lines.map((line) => {
    const fields = line.split(",");
    if (fields.length !== 2 || !/^\d+(\.\d{1,4})?$/.test(fields[1].trim()))
      throw new Error("Prices need positive decimal closing values.");
    const date = fields[0].trim(),
      close = Number(fields[1]);
    if (!validDate(date)) throw new Error("Use valid YYYY-MM-DD price dates.");
    finite(close, "Close", 0.0001, 1e7);
    return { date, close };
  });
  for (let i = 1; i < rows.length; i++)
    if (rows[i].date <= rows[i - 1].date)
      throw new Error("Historical dates must be unique and increasing.");
  return rows;
}
export function backtest(
  prices: Price[],
  fast: number,
  slow: number,
  initial: number,
  feeBps: number,
) {
  integer(fast, "Fast window", 1, 100);
  integer(slow, "Slow window", 2, 250);
  if (fast >= slow || prices.length <= slow)
    throw new Error(
      "Fast window must be smaller than slow; include more observations than the slow window.",
    );
  finite(initial, "Paper starting cash", 1, 1e9);
  finite(feeBps, "Fee basis points", 0, 200);
  const fee = feeBps / 10000;
  let cash = initial,
    units = 0,
    peak = initial,
    maxDrawdown = 0;
  const trades: Array<{
      date: string;
      side: string;
      units: number;
      price: number;
    }> = [],
    equity: Array<{ date: string; value: number }> = [];
  // Signal uses only preceding closes. Execution is the FOLLOWING observation's close.
  for (let i = 0; i < prices.length; i++) {
    if (i >= slow) {
      const preceding = prices.slice(i - slow, i);
      const short =
          preceding.slice(-fast).reduce((s, p) => s + p.close, 0) / fast,
        long = preceding.reduce((s, p) => s + p.close, 0) / slow;
      const price = prices[i].close;
      if (short > long && units === 0) {
        const buy = Math.floor(cash / (price * (1 + fee)));
        if (buy) {
          cash -= buy * price * (1 + fee);
          units = buy;
          trades.push({ date: prices[i].date, side: "Buy", units: buy, price });
        }
      } else if (short <= long && units > 0) {
        cash += units * price * (1 - fee);
        trades.push({ date: prices[i].date, side: "Sell", units, price });
        units = 0;
      }
    }
    const value = cash + units * prices[i].close;
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, (peak - value) / peak);
    equity.push({ date: prices[i].date, value: rounded(value) });
  }
  const final = equity.at(-1)!.value;
  const first = prices[0].close,
    buyUnits = Math.floor(initial / (first * (1 + fee))),
    buyHold =
      initial - buyUnits * first * (1 + fee) + buyUnits * prices.at(-1)!.close;
  return {
    final,
    returnPercent: (final / initial - 1) * 100,
    maxDrawdownPercent: maxDrawdown * 100,
    buyHold: rounded(buyHold),
    trades,
    equity,
    openUnits: units,
  };
}
export function estimateTax(salary: number, oldDeductions: number) {
  finite(salary, "Annual salary", 0, 5_000_000);
  finite(oldDeductions, "Old-regime deductions", 0, salary);
  const slabs = (income: number, bands: Array<[number, number]>) => {
    let tax = 0,
      previous = 0;
    for (const [ceiling, rate] of bands) {
      tax += Math.max(0, Math.min(income, ceiling) - previous) * rate;
      previous = ceiling;
    }
    return tax;
  };
  const oldTaxable = Math.max(0, salary - 50000 - oldDeductions),
    newTaxable = Math.max(0, salary - 75000);
  let oldBase = slabs(oldTaxable, [
    [250000, 0],
    [500000, 0.05],
    [1000000, 0.2],
    [Infinity, 0.3],
  ]);
  if (oldTaxable <= 500000) oldBase = Math.max(0, oldBase - 12500);
  let newBase = slabs(newTaxable, [
    [400000, 0],
    [800000, 0.05],
    [1200000, 0.1],
    [1600000, 0.15],
    [2000000, 0.2],
    [2400000, 0.25],
    [Infinity, 0.3],
  ]);
  if (newTaxable <= 1200000) newBase = 0;
  else newBase = Math.min(newBase, newTaxable - 1200000); // rebate marginal relief, normal slab income only
  return {
    oldTaxable,
    newTaxable,
    oldTax: rounded(oldBase * 1.04),
    newTax: rounded(newBase * 1.04),
  };
}
export function inspectMessage(text: string) {
  if (!text.trim() || text.length > 5000)
    throw new Error("Enter a message of 1 to 5,000 characters.");
  const rules: Array<[RegExp, string]> = [
    [
      /\b(otp|upi\s*pin|password|cvv)\b/i,
      "The message mentions secret authentication information. Never share a PIN, OTP, password or CVV.",
    ],
    [
      /\b(collect request|approve.*request|scan.*qr|qr.*scan)\b/i,
      "A collect request or QR code can authorize a payment. Verify the direction of money in your bank app.",
    ],
    [
      /\b(receive|refund|cashback|reward|prize|lottery)\b/i,
      "An incoming-money claim needs independent verification. Receiving UPI money does not require entering your PIN.",
    ],
    [
      /\b(urgent|immediately|blocked|suspended|expires|kyc)\b/i,
      "Urgency or account-block threats can pressure you into acting without verification.",
    ],
    [
      /anydesk|teamviewer|screen.?share|remote access|\.apk\b/i,
      "Remote-control apps, screen sharing or APK installation can expose banking information.",
    ],
    [
      /guaranteed.*(return|profit)|double.*money|risk.free.*invest/i,
      "Guaranteed-profit language is a common warning sign.",
    ],
    [
      /https?:\/\/|www\.|bit\.ly|tinyurl/i,
      "A link is present. This tool does not open it or verify the destination. Use the official app or a known website instead.",
    ],
  ];
  const flags = rules
    .filter(([pattern]) => pattern.test(text))
    .map(([, reason]) => reason);
  return {
    level:
      flags.length >= 3
        ? "Multiple warning signs"
        : flags.length
          ? "Review carefully"
          : "No listed warning signs found",
    flags: flags.length
      ? flags
      : [
          "A clean rule scan does not verify a sender, link or transaction. Confirm independently before acting.",
        ],
  };
}
export function emi(principal: number, annualRate: number, months: number) {
  finite(principal, "Loan amount", 0, 1e9);
  finite(annualRate, "Annual interest", 0, 60);
  integer(months, "Loan months", 1, 600);
  const rate = annualRate / 1200;
  const payment =
    rate === 0
      ? principal / months
      : (principal * rate) / (1 - Math.pow(1 + rate, -months));
  return {
    payment: rounded(payment),
    total: rounded(payment * months),
    interest: rounded(payment * months - principal),
  };
}
export function invoice(subtotal: number, gstPercent: number) {
  finite(subtotal, "Subtotal", 0, 1e9);
  finite(gstPercent, "GST rate", 0, 100);
  const tax = rounded((subtotal * gstPercent) / 100);
  return { subtotal: rounded(subtotal), tax, total: rounded(subtotal + tax) };
}
export function cashFlow(
  opening: number,
  income: number,
  costs: number,
  months: number,
) {
  finite(opening, "Opening cash", -1e9, 1e9);
  finite(income, "Monthly receipts", 0, 1e9);
  finite(costs, "Monthly costs", 0, 1e9);
  integer(months, "Months", 1, 24);
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    balance: rounded(opening + (income - costs) * (i + 1)),
  }));
}
export const FICTIONAL_PRICES =
  "date,close\n" +
  Array.from(
    { length: 60 },
    (_, i) =>
      new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10) +
      "," +
      (100 + Math.sin(i / 5) * 12 + i * 0.4).toFixed(2),
  ).join("\n");
