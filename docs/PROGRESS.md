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

## Phase 2 checkpoint, 3 November 2026 IST

Implemented the working ledger in web/, reusing src/forecast.ts through a dependency-free static build. The runtime has no external scripts, fonts, UI libraries or network API calls. The presentation uses stone, ink, muted petrol and clay, square controls and typography. Clay text was darkened to #774d3f for contrast.

Delivered:
- Editable starting balance, forecast dates and daily essentials.
- Add, edit and remove scheduled expenses or expected income.
- Purchase amount/date comparison, first shortfall and lowest balance.
- Accessible SVG description plus an expandable numerical daily ledger.
- Out-of-period scheduled item notice.
- Browser-local saving, restoration, reset and storage-failure handling.
- Exact decimal rupee parsing; application arithmetic stays in integer paise.
- Pending edits clearly distinguished from applied calculations.

Verification:
- npm test: 15 passed, zero failures.
- npm run build: passed.
- Browser: sample INR 2,000 purchase creates the expected 8 November shortfall.
- Browser: INR 500 purchase leaves INR 550 minimum; allowance moved to 16 November changes minimum to INR 250.
- Browser: adding INR 100 Books reduces the baseline by INR 100; removal restores it.
- Browser: invalid end date displays an error and preserves the previous forecast.
- Browser: saved plan restores on reload; reset restores the fictional sample.
- Browser: Tab moves from balance to date; labels, focus rules and section navigation present.
- Desktop layout inspected. Narrow layout inspected in an embedded 390-pixel viewport, not a physical mobile device.
- Main text contrast: ink/stone 9.03:1, muted/stone 4.97:1; buttons 9.81:1.
- Fixed an HTTP-preview incompatibility in add-item ID generation.

Preview publication is managed by Sites. Check the deployment result for publication status; do not equate a local build with a successful deployment.

## Next phase

Phase 3: supported CSV and message import, correction and duplicate handling. Phase 4 adds real server-side AI. This is a working budgeting prototype, not yet the completed hackathon entry.

## Open dependency

AI provider selection and secure key configuration are needed in Phase 4. Do not request bank credentials or publish synthetic explanations as live AI.


## Published preview

Private Phase 2 preview successfully deployed at https://allowance-ledger-debdutta.mossymount.chatgpt.site .

Site project: appgprj_6ae8fb6062f48191a045815f9305e6f6
Deployment: appgdep_6ae8fd5e35708191aa64061baa73f74d
Deployment source commit in the Sites source repository: 42388c549d62c11df00f39e78568c4f4de99dab4

Preserve this Site identity in future phases. The user-facing GitHub repository and Sites source repository use separate commit histories. The deployed runtime matches the Phase 2 code; this publication checkpoint was added to GitHub after deployment.
