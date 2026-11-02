# Allowance

A student cash-flow planner answering: can I make this purchase and still cover essentials until my next allowance?

## Review status

The complete review interface now includes transaction import, correction, duplicate review, on-device ML categorization, cash-flow forecasts, purchase comparisons, income-delay stress testing and a Gemini explanation endpoint. Forty automated tests pass. Real Gemini responses still require the owner's API key and live verification; mocked provider tests are not a claim of live operation.

Private preview: https://allowance-ledger-debdutta.mossymount.chatgpt.site

## Phases
1. Foundation: calculation contract, design requirements, synthetic fixture and tests.
2. Interface: editable sample scenario, daily forecast and purchase comparison.
3. Import: documented CSV and message formats, correction and duplicate handling.
4. AI: server-side categorization and explanations grounded in computed results.
5. Verification: mobile, keyboard, failure handling, deployment and submission demo.

Each phase ends with a recorded checkpoint and actual verification results. Ordinary reversible work can proceed without another approval.

## Product scope
Start with synthetic data, local storage and no required account. Opening balance is authoritative at the start of the selected date. Historical transactions must not be deducted from that balance again. All calculations use integer paise and date-only values. Expected income is an assumption. Same-day expenses are applied before income to expose timing risk. Forecasts are estimates.

## Design contract
A financial ledger with warm stone (#E6E1D6), ink (#293B3B), muted petrol (#355C62) and restrained clay (#845646). Validate contrast in the interface phase. Square edges, thin rules, typographic hierarchy and tabular numbers. The product itself is the main screen, including an actual working forecast and purchase comparison.

Preserve the user's exclusions: no harsh gradients, Lucide-style icon sets, pure white backgrounds, rainbow coloring, shadows, three feature cards in a row, emojis, liquid glass, em dashes, colored left stripes, fake testimonials, bento grids, terminal-window decoration, soft corner radii, purple-and-black themes, skeleton loaders, radial orbs, dot grids, sparkle icons, animated arrows, hover animations, neon colors, generic primary-color styling, three pricing tiers, checkmark bullet decoration, generic "it is not X" marketing copy, POS functionality or privacy-policy page. Ambiguous dictated terms are interpreted conservatively; do not invent features around them.

Use real field labels, visible keyboard focus, plain loading text, accessible error messages and responsive layouts.

## AI and calculation boundaries

A small multinomial Naive Bayes model categorizes debit merchant descriptions locally using 56 authored synthetic training examples. Credit/refund and transfer handling are disclosed direction rules. Unknown descriptions become Other; uncertain suggestions are flagged and all categories remain editable. The synthetic holdout result is recorded in docs/model-evaluation.json. It does not establish real-bank accuracy or calibrated confidence.

Gemini receives validated plan inputs and server-computed evidence only after consent. It returns structured prose and evidence IDs. Numeric prose, invalid categories, incomplete responses and unknown evidence IDs are rejected. Balances are always computed by application code. Gemini calls use a server-side x-goog-api-key header, never a URL parameter. No real customer financial data or testimonials are included.

For the private review, an authenticated owner can enter an existing Gemini key in the session setup form. The key stays in tab memory, is sent only with AI requests, and is never written to localStorage, returned in API responses or committed. The server allows session keys only when ALLOW_SESSION_KEYS=true and Sites supplies authenticated identity. The current Sites audience restricts the deployment to the owner. Disable session mode or review its policy before changing the audience.

For a submission deployment, configure GEMINI_API_KEY as a server runtime secret and GEMINI_MODEL as needed. The default model is gemini-3.5-flash-lite. There is no paid-model fallback or automatic retry. Google documents a free tier, but the actual project billing tier and quota must be checked by its owner. Free-tier prompts may be used to improve Google products; use synthetic data for the demo.

## Development

Requires Node.js 24. Run npm ci, npm test, npx tsc --noEmit, and npm run build. npm run dev starts the supported development server. npm run evaluate:model reproduces the small synthetic classifier report.

The server uses the Sites Vinext starter. The public planner is authored in web/; scripts/prepare-client.mjs copies it to public/planner.html and strips TypeScript from the same tested modules in src/. Route / redirects to that planner. Server API: /api/ai. Worker builds are packaged through the Sites workflow. Generated output and local environment files are ignored.

## Import format

CSV columns: date,description,amount,direction,reference. reference is optional. Dates use YYYY-MM-DD; amounts are positive decimal rupees with up to two places; direction is debit, credit or transfer. Strict CSV quoting supports commas and escaped quotes. Files and pasted text are limited to 64 KB and 200 rows per import, with up to 1,000 saved transactions.

Messages use an explicit dated format such as: 2026-10-29 INR 180.00 debited to Campus Canteen ref DEMO001. Also supports credited from and transferred to. Unsupported formats fail clearly rather than guessing dates. PDF statements and arbitrary bank SMS dialects are not supported in this version.

History is stored only in the current browser. It never changes the forecast opening balance automatically. Transfers, incoming refunds and income have separate totals. Possible duplicate references, or matching date/description/amount/direction without references, are excluded by default; users can explicitly keep distinct transactions. Review saved history to correct categories or remove rows. Clear has a session-local undo.

## Verification and demonstration

See docs/PROGRESS.md for current verification evidence, docs/ARCHITECTURE.md for boundaries and docs/DEMO.md for a short demonstration flow. No winning probability or unsupported real-world model accuracy is claimed.

Official Gemini references: https://aistudio.google.com/docs/pricing and https://ai.google.dev/gemini-api/docs/migrate-to-interactions .
