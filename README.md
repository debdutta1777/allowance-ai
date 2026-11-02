# Allowance

A student cash-flow planner answering: can I make this purchase and still cover essentials until my next allowance?

## Progress
Phase 1: foundation. Product scope and design constraints recorded. A deterministic forecast module and automated tests are being added. The interface, import flow, AI service and deployment are not complete.

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

## AI boundaries
AI may propose categories and explain verified results. Application code owns arithmetic. Credentials remain server-side. Never label fixture explanations as live AI responses. No AI provider or API key has been configured.

## Development
Requires Node.js 24 or newer. Run `npm test` to execute the engine tests without third-party dependencies.
