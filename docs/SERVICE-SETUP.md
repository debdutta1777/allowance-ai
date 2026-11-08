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
3. Apply `supabase/ai-quota.sql` to install shared Gemini admission limits. Then run `supabase/verify-ai-quota.sql` and `supabase/verify-isolation.sql` to test two simulated authenticated identities. It rolls back its synthetic fixtures. Run Supabase security advisors and resolve any relevant findings.
4. Set these **server-only** Vercel variables in the project's required environments:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY` (modern publishable key; no service-role key)
   - existing `GEMINI_API_KEY`, optional `GEMINI_MODEL`
5. In Supabase Auth, configure the production Site URL and allow the exact production `/auth/confirm` URL and `/auth/confirm?next=/reset-password` recovery destination. Add only trusted preview URLs when testing. Keep email confirmation enabled. Configure an appropriate email provider for public use and set a minimum password length of 12. No authentication setting is disabled by this code.
6. Set `PUBLIC_SIGNUP_ENABLED=true` only after custom SMTP delivers confirmation mail to a non-team test address. It defaults to false: new registration is clearly paused, existing account login remains available and the public fictional demo requires no account.
7. Redeploy Vercel after changing environment variables. Until configured, account forms explain the setup status and cannot submit. There is no fake login or fallback account data store.
8. Verify signup, confirmation, password login, account save/reload, a second account's isolation, recovery and logout on the deployed environment. Test two-tab save conflicts. Do not claim these live checks passed before completing them.

## Ownership and storage

Every request creates its own Supabase client. Session cookies are HttpOnly, Secure in production, SameSite=Lax. Authentication uses `auth.getUser()`; no client-submitted user ID determines storage ownership. API mutations enforce same-origin requests, bounded JSON and schema validation. Saves compare the previous revision to prevent overwriting concurrent edits. An account ID check prevents an old tab saving a previous user's data into a newly signed-in account. Focus checks clear the loaded workspace when the account changes or the session ends. Authentication and financial API responses are private and not cached.

Saved: applied plan, purchase scenario, income delay, reviewed transaction rows, monthly limits, holdings and display preference. Account saves are explicit. Raw import text, historical-price CSV, tax/scam/business inputs and temporary tool results are not saved. Personal workspace data is not copied to localStorage. Database owners and infrastructure operators may have operational access; no end-to-end encryption claim is made.

Gemini is restricted to verified signed-in users, receives approved plan inputs with best-effort identifier masking and returns only validated interpretations of server-calculated facts. Database admission limits are shared across server instances: eight requests per minute and forty per UTC day per user, plus thirty per minute and two hundred per UTC day across the application. Missing quota infrastructure fails closed before Gemini is called. These are request limits, not a monetary spending guarantee; provider billing controls remain appropriate.

## Six feature areas and boundaries

1. Smart budgeting: existing tested paise-based forecast, purchase/delay comparison, daily ledger, CSV and supported dated-alert imports, local categorizer, correction, duplicate review, undo and month/category limits.
2. Investing: end-month contribution and lump-sum scenarios, SIP/index/deposit explanations, entered portfolio allocation and simple concentration flags. No product recommendations, live quotes or suitability assessment.
3. Trading/markets: user-supplied historical closing-price CSV, lagged moving-average signal, whole-unit paper ledger, entry/exit fees, return and drawdown plus buy/hold comparison. The sample is synthetic. No real orders, leverage, live NSE feed, news analysis, dividends/corporate-action processing or performance promise.
4. Tax: ordinary salary-only FY 2025–26 / AY 2026–27 comparison for resident individuals below 60, up to INR 50 lakh. Standard deductions, slab tax, supported rebates/marginal relief and cess. No special-rate income, business income, surcharge or filing. References: Income Tax Department salaried individuals AY 2026–27 page and its deduction/rate guidance, checked 3 November 2026.
5. Scam/fraud checks: local rule-based warning signs for payment/PIN/OTP/QR/urgency/remote-access/links. No sender verification or guarantee of safety. Reference: NPCI fraud-awareness guidance.
6. Small business: fixed-rate reducing-balance EMI, constant monthly cash-flow scenarios and user-entered GST arithmetic with an exportable estimate. No GST classification, compliant tax invoice, e-invoicing or return filing.

The service includes a light-first green visual design, optional dark mode, a scroll-driven feature reel and word-by-word section headings. Reduced-motion preferences receive readable static content.

## Verification checkpoint, 3 November 2026 IST

See [SERVICE-VERIFICATION.md](SERVICE-VERIFICATION.md) for the current deployed evidence.

- Latest verified GitHub Actions run 41622974774 passed tests and production build for 9095751; runtime code is unchanged from the previously tested service implementation.
- Supabase server variables are configured in the intended Vercel project; browser verification succeeded on the protected branch preview.
- Real owner signup/confirmation, login/logout, save/reload, persistence across login sessions, and consented Gemini interpretation passed.
- Two-tab version conflict rejected the stale save. Export preserved the stale tab's unsaved marker in valid JSON. Test display-name changes were restored and reloaded.
- Guest demo and private account data remain separate. Live database ownership policies and restricted grants were inspected.
- Current security advisor reports one warning: leaked-password screening is disabled. Supabase documents this as a Pro-plan feature; no upgrade was made.
- Public account onboarding still requires custom SMTP. The default service is restricted to project-team addresses.
- Password recovery remains deliberately unverified at the user's request. Do not request a password change as a prerequisite for UI/UX work.
- PR #3 remains a draft. Production still serves the earlier application; the new service is on the branch preview.
