# Allowance demonstration

## Start without an account

Open `/demo/dashboard`, then Start the purchase scenario. This is a fictional temporary workspace. The demo never writes to a personal account and requires no bank data or provider key.

## A focused demo under five minutes

1. **Problem and inputs (30 seconds):** A student has INR 6,400, spends INR 150 daily, has rent and travel commitments, and expects INR 5,000 on 13 November. The proposed purchase is INR 2,000.
2. **Decision (60 seconds):** Open Planner. With a reserve of INR 500, the original purchase first breaches the reserve on 8 November. Its maximum amount on 4 November is INR 550. Move the date slider or select Use 2026-11-14. The lowest balance across the resulting period is INR 1,050. Explain why purchasing on the income date is still constrained: costs precede same-day income.
3. **Evidence and uncertainty (30 seconds):** Expand Why this result, then the daily evidence ledger. The delayed-income scenario may fail even when the expected-income scenario succeeds. No forecast guarantees a future balance.
4. **AI and review (60 seconds):** Transactions → Load fictional sample → Preview import. Review seven rows, including one excluded duplicate. Run local category suggestions, correct any row, then Apply reviewed rows. Six records remain. Monthly budgets shows INR 710 spending, INR 5,000 income, INR 100 refunds and INR 1,000 own transfers, separately. Imported history never reduces opening balance again.
5. **Breadth and limits (30 seconds):** Briefly open investing, historical paper backtesting, salary tax comparison, local scam checks and business calculators. Show the scope limitations rather than promising regulated advice or real trading.
6. **Optional owner-only recording (30 seconds):** With the owner's existing verified account, demonstrate a consented Gemini explanation and its server-computed evidence references. Do not show passwords, keys or real financial data. Public demo users cannot call private Gemini endpoints or save to personal accounts. Clearly distinguish local model suggestions from live Gemini output.

## Before recording

Reload to reset the fictional workspace. Use only the fixed sample or other synthetic inputs. Keep the browser free of secrets. New public registration is paused pending SMTP verification; do not describe that flow as publicly operational. Password recovery is deliberately unverified.

## Evidence

71 automated tests cover forecasting, import validation, duplicates, category rules, paper backtests, supported tax estimates, account validation and AI output boundaries. Purchase-date tests compare optimized results against exhaustive forecasts and test prior reserve breaches. TypeScript, ESLint and production build pass locally. The local classifier's 23/23 result is on a small synthetic evaluation set only.
