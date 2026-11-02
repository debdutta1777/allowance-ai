# Theme alignment audit

Allowance chooses the permitted smart-budgeting direction. Investing, tax, trading, fraud detection and GST automation are alternative ideas in the supplied theme, not simultaneous requirements.

| User need | Implemented behavior |
| --- | --- |
| Bring in transactions | CSV upload/paste, simplified dated messages and two additional documented debit/credit alert patterns |
| Clean the data | Review, corrections, duplicate exclusion, transfer/refund separation |
| Use AI meaningfully | Local merchant classifier and server-side Gemini explanation integration |
| Manage a monthly budget | Calendar month selection, category limits, actual spending, remaining/overspent amounts and uncapped spending |
| Make a money decision | Purchase simulation, obligations, essentials and delayed-income forecast |
| Explain results | Calculated evidence and known evidence IDs for Gemini responses |
| Present a usable demo | Fictional sample, public source, Vercel configuration and demonstration notes |

## Verified checks

The corrected feature commit 890bb85d3c54e0344dbb81052712ad231b9bb3c1 passed dependency installation, the full Node test suite and the Next.js production build on Node.js 24 in GitHub Actions:
https://github.com/debdutta1777/allowance-ai/actions/runs/41538873457

Nine Node regression tests were added. Focused pure-JavaScript parsing and monthly-summary checks also passed, along with five mock-DOM wiring checks for empty history, overspending, separate month limits, restoring a selected month's limits and refreshing after history removal.

The local execution environment and browser are unavailable, so fresh visual rendering of the new monthly section was not verified. This limitation is separate from the successful full test/build result.

A real Gemini request still needs to be verified after GEMINI_API_KEY is configured on the deployed server. No secret was requested or included.

## Boundaries

The alert examples are authored examples matching explicitly supported patterns, not a claim of universal bank-SMS compatibility. Missing dates are never inferred. PDF statements, live bank feeds, arbitrary SMS dialects and unrelated finance tracks are not implemented.

Monthly reports cover imported records only. Incoming refunds and own-account transfers remain separate from category spending. Blank limits are unset; zero limits are real zero budgets. Limits are saved separately per calendar month. User-selected limits and imported history cannot automatically change the opening balance, forecast essentials or purchase-category limits.

## Final deployment check

Deploy the latest main branch to Vercel, configure the Gemini environment secret, then check the monthly table at desktop/mobile widths and complete one live explanation using the fictional sample. Trading is not part of this entry; no real-money trading integration exists.
