import { comparePurchase, type Plan } from "./forecast.ts";

/** Exhaustive date search over a bounded forecast, using suffix minima in integer paise.
 * The reserve must hold throughout the whole period, including before the purchase.
 * Purchases precede same-day income, matching the forecast engine's ordering.
 */
export function purchaseOptions(
  plan: Plan,
  purchase: { date: string; amountPaise: number },
  reservePaise = 0,
) {
  if (!Number.isSafeInteger(reservePaise) || reservePaise < 0)
    throw new Error("Reserve must be a non-negative safe integer in paise.");
  const comparison = comparePurchase(plan, purchase);
  const days = comparison.baseline.days;
  const baselineBelowReserve =
    comparison.baseline.minimumBalancePaise < reservePaise;
  const suffix: { balance: number; date: string }[] = new Array(days.length);
  for (let i = days.length - 1; i >= 0; i--) {
    const next = suffix[i + 1];
    suffix[i] =
      !next || days[i].beforeIncomePaise <= next.balance
        ? { balance: days[i].beforeIncomePaise, date: days[i].date }
        : next;
  }
  const selected = days.findIndex((day) => day.date === purchase.date);
  const maximumPaise = baselineBelowReserve
    ? null
    : suffix[selected].balance - reservePaise;
  const earliest = baselineBelowReserve
    ? undefined
    : days.find(
        (day, i) =>
          i >= selected &&
          suffix[i].balance - reservePaise >= purchase.amountPaise,
      );
  return {
    baselineBelowReserve,
    maximumPaise,
    earliestDate: earliest?.date ?? null,
    bindingDate: suffix[selected].date,
    minimumAfterPurchasePaise: comparison.proposed.minimumBalancePaise,
    meetsReserve: comparison.proposed.minimumBalancePaise >= reservePaise,
    firstReserveBreach:
      comparison.proposed.days.find(
        (day) =>
          Math.min(day.openingBalancePaise, day.beforeIncomePaise) <
          reservePaise,
      )?.date ?? null,
  };
}
