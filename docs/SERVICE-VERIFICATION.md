# Personal service verification checkpoint

3 November 2026 IST. Review branch: feature/personal-finance-service. Tested deployment: dpl_GjurX4WWSdn3Lu8F2u7dfSNC7Rq8, source commit 26a7abac279ebcf9b7f0a4fc640fec95b14c843a, Vercel project allowance-ai-m9ry.

## Passed

- 65 automated tests, TypeScript and full production build passed. Production-only dependency audit reported zero known advisories.
- Dedicated Supabase schema applied to tdjakwizemetwaiqrrim. Transactional two-identity RLS read/update/owner-reassignment tests passed; all fixtures rolled back. The initial security advisor returned no lints; the current Auth advisory is recorded below. Existing AuditEase/Eventora projects were not modified.
- Configured SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in allowance-ai-m9ry's Production, Preview and Development environments. Existing GEMINI_API_KEY was preserved. The redeployed preview reports configured=true and user=null when signed out.
- Authenticated CLI tests: GET account session 200; signed-out workspace 401; cross-origin workspace write 403; signed-out Gemini request 401. Deployment provenance confirms the intended branch and source commit.
- Browser access succeeded through the owner's Vercel/GitHub sign-in. Deployment protection remains enabled. No temporary share URL was created: automatic approval review rejected that action because link holders could access the protected preview.

## Browser checks using fictional data

| Flow | Observed result |
| --- | --- |
| Home and workspace navigation | Separate routed pages and shared menu render. Client state persists across workspace pages. |
| Purchase comparison | Reducing purchase from INR 2,000 to INR 500 changes minimum from -950 to 550; delayed-income minimum is 250. |
| CSV and local categorizer | Seven sample rows preview; duplicate excluded; six saved. File download and file-picker reupload both work. |
| Duplicate / clear / undo | Reimport flags seven possible duplicates. Clear and undo restore six transactions. |
| Dated alert | INR 1,250.50 explicitly dated debit imports as the seventh record; November summary updates. |
| Category budget | October Food spending 180 against limit 100 shows overspending 80; months isolate totals. Native keyboard month changes work; browser automation's direct month fill does not dispatch React's change event, so keyboard changes were used. |
| Investing | Default contribution scenario outputs total contribution 180,000, projected regular-contribution value 208,457.36 and lump-sum value 133,822.56. Entered fictional equity holding triggers concentration, equity allocation and missing-cash prompts. |
| Historical markets | Fictional sample backtest produces ending equity 10,538.37, return 5.38%, drawdown 8.50%, buy/hold 11,502.82 and a paper trade ledger. This is synthetic data, not live NSE performance. |
| Tax | Default supported salary scenario estimates old-regime tax 117,000 and new-regime tax zero under the stated FY 2025–26 restrictions. |
| Scam warning checks | Fictional suspicious collect/PIN/reward/link message produces multiple warning signs. |
| Small business | EMI 8,791.59; total repayment 105,499.06. Cash projection closes at 20,000 in month six. Subtotal 10,000 plus entered GST 18% gives 11,800. |
| Preferences and dashboard | Demo display name persists across navigation; dashboard retains seven imported records and November spending 1,250.50. |

## Live account verification

Verified on the stable feature-branch preview alias on 3 November 2026:

- The owner completed account creation and email confirmation manually. The app displayed the signed-in identity and an empty private workspace.
- Saved a fictional plan with opening balance INR 10,000 and daily essentials INR 100. Reload restored the plan and INR 7,000 minimum/closing forecast.
- Imported one explicitly fictional INR 250 Food debit dated 2026-11-03, set a November Food limit of INR 1,000, saved and reloaded. Both transaction and limit persisted; remaining allowance was INR 750.
- Gemini returned an interpretation after explicit consent to send this fictional plan. No actual personal financial data was used.
- Sign-out returned to the sign-in screen. A fresh password sign-in restored the same plan, one transaction and INR 250 November spending.
- Saved and reloaded the approved production Site URL and four exact confirmation/recovery callbacks for production and the stable branch-preview alias. No wildcard callbacks were added.
- SMTP inspection confirmed custom SMTP is disabled. Default templates remain in place and email confirmation remains enabled.

## Additional verification, 3 November 2026

- GitHub Actions run 41622974774 completed successfully for 9095751 (tests and production build).
- Two authenticated tabs loaded the same revision. The first saved a fictional display-name edit; the stale second save was rejected with “A newer version was saved elsewhere.” No newer data was overwritten.
- The stale tab exported valid JSON including its unsaved marker and all workspace sections. The saved display name was restored to its original blank value and verified after reload. The stale tab was closed.
- Guest demo showed its separate synthetic forecast and no saved transactions. Returning to the account restored INR 7,000 forecast, INR 250 spending and one saved transaction.
- Live database inspection confirmed RLS, owner predicates on every operation, UPDATE ownership checks, ordinary authenticated grants only and no anonymous/public grants.
- Browser console review found extension-origin metadata errors; no application-origin errors were observed in the sampled logs.
- Current Supabase security advisor reports Leaked Password Protection Disabled. Official documentation makes this feature Pro-plan-only; the project remains Free and was not upgraded.
- Vercel connector deployment-list read returned 403. The prior CLI path was no longer installed, so no fresh deployment-status claim was made. Browser preview and GitHub CI were accessible.

## Remaining and deliberately deferred

- Password recovery and password change remain unverified at the user's explicit request. Do not block UI/UX work on a forced password change.
- Custom SMTP is disabled. Supabase's default email delivery only permits project-team addresses, so general public email signup is not ready. Documentation: https://supabase.com/docs/guides/auth/auth-smtp
- Leaked-password protection is not enabled on the Free project. Documentation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Shared Gemini request limits were installed on 8 November 2026. Per-user/global minute/day limits, resets and role permissions passed transactional SQL checks; synthetic fixtures rolled back. Request limits do not guarantee a monetary spending cap.
- The new service remains in draft PR #3 and the branch preview. Existing production has not been replaced. UI/UX work can proceed while public email delivery is configured.
- Fictional QA plan, one transaction and monthly limit remain in the owner's preview workspace for inspection. No real financial data was used.

## Readiness and motion update, 8 November 2026

- 66 automated tests, TypeScript checking and the Next.js production build passed locally. Full-repository ESLint remains failing on existing explicit-any, hook and internal-link findings; it is not a passing release check.
- A fresh SMTP configuration read reached Supabase sign-in, so the previous disabled-SMTP finding could not be rechecked in the current browser session.
- Section headings progressively reveal words on scroll. Benefit descriptions now identify actual inputs and outputs rather than general promises. The green palette, light default and dark option remain.
- Empty personal workspaces show setup guidance instead of a misleading zero-balance success state.
- Expired confirmation links have a specific explanation; signup confirmation emails can be requested again with a generic account-safe response. Live resend email delivery has not been exercised.
- Database advisor reports an informational no-policy notice for the private quota table: intentional deny-all direct access, restricted function access only. Leaked-password screening remains disabled on the Free plan.
- Public signup SMTP and production promotion remain launch steps. Password recovery remains deliberately unverified.

## Release candidate, 9 November 2026 IST

- Added maximum-purchase and earliest-feasible-date calculations with a reserve held throughout the whole horizon. Tests compare the date search with exhaustive forecasts and preserve expenses-before-income ordering.
- Added an interactive date timeline, scheduled-event controls, reserve markers, delayed-income comparison and an expandable explanation.
- Added the guided public demo; adjusted fictional sample dates to populate the same budget month. The duplicate remains excluded and imports remain history-only.
- 71 tests, TypeScript, ESLint and production build pass locally. Previous lint findings have been resolved with typed schemas, effect-safe refs, external-store theme subscription and framework links.
- Local browser checks passed the alternative-date action, keyboard timeline control, evidence disclosure, seven-row sample review, duplicate exclusion and six-record apply across routes.
- `PUBLIC_SIGNUP_ENABLED` defaults to false until external-address SMTP delivery is verified. The page and server route both enforce this; existing account login remains available.
- No account record or database schema was changed in this release. Password recovery remains deliberately unverified.
- The Vercel connector cannot see the project; the authorized dashboard session can. Project Node.js setting was aligned with the tested 24.x runtime. Production release and final anonymous checks are recorded separately after deployment.
