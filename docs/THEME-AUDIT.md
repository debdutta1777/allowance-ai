# Theme alignment audit

Allowance chooses the permitted smart-budgeting direction. Investing, tax, live trading, fraud detection and GST automation are alternative ideas in the supplied theme, not simultaneous requirements.

| User need | Existing main branch | Draft addition |
| --- | --- | --- |
| Bring in transactions | CSV upload/paste and a simplified dated message format | Two additional documented debit/credit alert patterns |
| Clean the data | Review, corrections, duplicate exclusion, transfer/refund separation | Existing validation retained |
| Use AI meaningfully | Local merchant classifier; server Gemini explanation integration | Existing AI stays unchanged |
| Manage a monthly budget | Spending totals across all imported dates | Calendar month selection and category limits, remaining/overspent amounts |
| Make a money decision | Purchase simulation, obligations, essentials and delayed-income forecast | Monthly overspending feedback complements the forecast |
| Explain results | Calculated evidence; Gemini prose requires known evidence IDs | Existing safeguards retained |
| Be usable for judges | Fictional demo, source and Vercel configuration | Final live provider test and draft verification still required |

## Verification status

The earlier main-branch version passed 43 tests and a Next.js production build. This audit does not claim those checks cover the new changes.

Eighteen focused checks executed the new JavaScript calculation/parsing source in the orchestration runtime: month boundaries, transfer/refund/income separation, zero/absent budgets, remaining/overspent amounts, invalid dates and explicit dated alert parsing/rejection. Syntax checks were also performed on the new UI modules. Node regression test files are included, but could not run in the unavailable execution environment.

Before merging this draft, run npm test and npm run build on Node.js 24, then inspect the monthly budget section and message-import review on desktop and mobile. Confirm that importing/clearing/undoing history refreshes the monthly report, month limits persist separately, missing limits differ from zero, and forecast balances do not change when budgets or history change.

A real Gemini request must still be tested after GEMINI_API_KEY is configured on the deployed server. No secret was requested or included.

## Boundaries

The alert examples are authored examples matching explicitly supported patterns. Arbitrary bank messages, missing-date inference, PDFs, live bank integration and a complete bank feed are not implemented. Monthly reports cover imported records only. Refunds remain separate rather than automatically replenishing a spending category. User-selected monthly limits do not automatically set cash-flow essentials or enforce purchase category limits.
