# Allowance personal service

## Routes

- `/`: public landing page with a working fictional example and links to all six tool areas.
- `/demo/dashboard`, `/demo/planner`, `/demo/transactions`, `/demo/budgets`, `/demo/investing`, `/demo/markets`, `/demo/tax`, `/demo/safety`, `/demo/business`, `/demo/settings`: guest workspace, held only in memory. Reload resets demo changes.
- `/app/…`: the same organized workspace for signed-in users. User data is loaded only from authenticated, uncached APIs. The layout itself contains no private server-rendered data.
- `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`, `/auth/confirm`: account flows.
- Legacy `/planner.html` redirects to `/demo/planner`. Old browser-local data is not automatically uploaded or assigned to a user.

## Connect a separate Supabase project

Do not use or modify AuditEase, AuditEaseD or Eventora. The new Supabase connection now identifies a separate empty project, `tdjakwizemetwaiqrrim`, in organization `aocbksjdbchmtyspuidc`. The Allowance schema was applied there on 3 November 2026. AuditEase/Eventora projects were not modified.

1. Connect the intended Supabase account in ChatGPT Apps. Choose the dedicated Allowance organization/project. Check and agree any project cost before creating it.
2. Apply `supabase/schema.sql` only to that project. It creates one workspace per `auth.users.id`, enables RLS, revokes anonymous/public access and limits authenticated roles to ordinary data operations. It does not grant TRUNCATE. Each SELECT/UPDATE/DELETE policy checks ownership; INSERT/UPDATE also check the resulting owner.
3. Run `supabase/verify-isolation.sql` to test two simulated authenticated identities. It rolls back its synthetic fixtures. Run Supabase security advisors and resolve any relevant findings.
4. Set these **server-only** Vercel variables in the project's required environments:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY` (modern publishable key; no service-role key)
   - existing `GEMINI_API_KEY`, optional `GEMINI_MODEL`
5. In Supabase Auth, configure the production Site URL and allow the exact production `/auth/confirm` URL and `/auth/confirm?next=/reset-password` recovery destination. Add only trusted preview URLs when testing. Keep email confirmation enabled. Configure an appropriate email provider for public use and set a minimum password length of 12. No authentication setting is disabled by this code.
6. Redeploy Vercel after changing environment variables. Until configured, account forms explain the setup status and cannot submit. There is no fake login or fallback account data store.
7. Verify signup, confirmation, password login, account save/reload, a second account's isolation, recovery and logout on the deployed environment. Test two-tab save conflicts. Do not claim these live checks passed before completing them.

## Ownership and storage

Every request creates its own Supabase client. Session cookies are HttpOnly, Secure in production, SameSite=Lax. Authentication uses `auth.getUser()`; no client-submitted user ID determines storage ownership. API mutations enforce same-origin requests, bounded JSON and schema validation. Saves compare the previous revision to prevent overwriting concurrent edits. An account ID check prevents an old tab saving a previous user's data into a newly signed-in account. Focus checks clear the loaded workspace when the account changes or the session ends. Authentication and financial API responses are private and not cached.

Saved: applied plan, purchase scenario, income delay, reviewed transaction rows, monthly limits, holdings and display preference. Account saves are explicit. Raw import text, historical-price CSV, tax/scam/business inputs and temporary tool results are not saved. Personal workspace data is not copied to localStorage. Database owners and infrastructure operators may have operational access; no end-to-end encryption claim is made.

Gemini is restricted to verified signed-in users, receives approved plan inputs with best-effort identifier masking and returns only validated interpretations of server-calculated facts. The eight-per-minute allowance is per authenticated user per server instance, not a global quota guarantee. Hosting/provider limits remain appropriate for broad public exposure.

## Six feature areas and boundaries

1. Smart budgeting: existing tested paise-based forecast, purchase/delay comparison, daily ledger, CSV and supported dated-alert imports, local categorizer, correction, duplicate review, undo and month/category limits.
2. Investing: end-month contribution and lump-sum scenarios, SIP/index/deposit explanations, entered portfolio allocation and simple concentration flags. No product recommendations, live quotes or suitability assessment.
3. Trading/markets: user-supplied historical closing-price CSV, lagged moving-average signal, whole-unit paper ledger, entry/exit fees, return and drawdown plus buy/hold comparison. The sample is synthetic. No real orders, leverage, live NSE feed, news analysis, dividends/corporate-action processing or performance promise.
4. Tax: ordinary salary-only FY 2025–26 / AY 2026–27 comparison for resident individuals below 60, up to INR 50 lakh. Standard deductions, slab tax, supported rebates/marginal relief and cess. No special-rate income, business income, surcharge or filing. References: Income Tax Department salaried individuals AY 2026–27 page and its deduction/rate guidance, checked 3 November 2026.
5. Scam/fraud checks: local rule-based warning signs for payment/PIN/OTP/QR/urgency/remote-access/links. No sender verification or guarantee of safety. Reference: NPCI fraud-awareness guidance.
6. Small business: fixed-rate reducing-balance EMI, constant monthly cash-flow scenarios and user-entered GST arithmetic with an exportable estimate. No GST classification, compliant tax invoice, e-invoicing or return filing.

The work in this phase concerns application structure, functional tools and account integration. A separate visual design pass remains planned.

## Verification checkpoint, 3 November 2026 IST

- GitHub Actions run 41560130776 passed npm ci, all 65 tests and the full production build for commit 22cdce5.
- Production-only exact-lockfile audit: zero known advisories.
- Applied `allowance_private_workspaces` to the new dedicated Supabase project after confirming no public tables and no users existed.
- Executed the transactional two-identity isolation test: each identity could read only its own row, foreign updates affected zero rows and owner reassignment was rejected. Fixtures were rolled back; auth user and workspace row counts returned to zero.
- Supabase security advisor: no lints. Authenticated table grants are SELECT/INSERT/UPDATE/DELETE only; anonymous/public grants are absent.
- Vercel review builds are Ready, but preview URLs are protected by Vercel Authentication. The local managed preview served HTML but interactive scripts did not load, so browser flow checks are not yet passed.
- The installed Vercel plugin supplies skills, but no account-management tools were exposed. Vercel CLI 65.4.0 reports loggedIn=false. Authorization is needed to set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, inspect Auth callback/email configuration and perform deployed signup/save/reload/logout checks.
- PR #3 remains a draft; the public production application was not replaced with an unconfigured account service.
