# Progress checkpoint

## Phase 1 complete, 3 November 2026 IST

- GitHub write access verified through successful file creation.
- User design exclusions recorded in README.md.
- Dependency-free TypeScript forecast and purchase comparison implemented.
- Fictional student fixture included; historical transactions do not get deducted again.
- npm test: 13 passed, zero failures on Node.js 24.22.1.
- No UI, import pipeline, live AI service or deployment delivered yet.

## Calculation contract

Amounts are integer paise. Forecast endpoints are inclusive, with a maximum 366 days. Opening balance is measured before spending on the first day. Daily essentials occur once per included day. Scheduled expenses are additional to daily essentials; the UI must explain this to avoid overlap. Expenses precede income on the same day, a conservative assumption exposed by the before-income balance. Entries outside the horizon are excluded. Duplicate IDs are rejected; semantic import deduplication remains Phase 3 work. Transfers between a user's accounts must be reconciled during import, not treated as expenses. Refunds may be represented as income when they become available, without counting them twice in opening balance.

The sample starts with INR 6,400, INR 150 daily essentials, INR 2,500 rent and INR 1,200 travel. Baseline minimum is INR 1,050 before expected income. A proposed INR 2,000 purchase on 4 November creates the first shortfall on 8 November and a minimum of INR -950 before expected income.

## Next phase

Build the working ledger interface around this tested engine. Provide editable balance, daily essentials, obligations and allowance timing, then purchase comparison and a daily timeline. Show assumptions and distinguish expected income. Verify contrast, responsive layout and keyboard interaction. Follow every visual exclusion in README.md.

## Open dependency

AI provider selection and secure key configuration are needed in Phase 4. Do not request bank credentials or publish synthetic explanations as live AI.
