# Personal service verification checkpoint

3 November 2026 IST. Review branch: feature/personal-finance-service. Tested deployment: dpl_GjurX4WWSdn3Lu8F2u7dfSNC7Rq8, source commit 26a7abac279ebcf9b7f0a4fc640fec95b14c843a, Vercel project allowance-ai-m9ry.

## Passed

- 65 automated tests, TypeScript and full production build passed. Production-only dependency audit reported zero known advisories.
- Dedicated Supabase schema applied to tdjakwizemetwaiqrrim. Transactional two-identity RLS read/update/owner-reassignment tests passed; all fixtures rolled back. Security advisor returned no lints. Existing AuditEase/Eventora projects were not modified.
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

## Still pending; do not call these complete

The Supabase dashboard email/password sign-in reached hCaptcha and did not finish. Its confirmation/recovery URL allowlist and email delivery configuration still need inspection and setup. No authentication protection was disabled. A real account's signup, email confirmation, password login, save/reload across sessions, recovery and logout have not yet been tested. New work remains in draft PR #3, separate from the existing production site until those account flows pass. UI/UX redesign remains deferred.
