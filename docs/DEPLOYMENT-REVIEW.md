# Deployed functional and security review

Review date: 2 November 2026 UTC. Target: https://allowance-ai-m9ry.vercel.app/planner.html . Initial deployment: main commit 248d5b7. All interactive checks used fictional test data in an isolated browser. No real banking or money movement occurred.

## Functional results on the deployed site

| Area | Observed result |
| --- | --- |
| Forecast and evidence | Sample minimum INR 1,050; closing INR 5,750. Daily ledger reconciles with chart and cards. |
| Purchase comparison | INR 2,000 produces minimum -950 and first shortfall 8 November; INR 500 produces minimum 550. |
| Scheduled entries | Adding a fictional INR 50 expense reduces minimum and closing by 50; removing it restores both. |
| Delayed income | Zero-day and three-day cases recalculate; three-day sample minimum is -1,250 with purchase. |
| Validation and reset | Invalid date range rejected without replacing valid forecast; sample reset restores plan. |
| CSV | Paste, sample download, file-picker upload and preview work. Malformed headers rejected. |
| Local categorizer and corrections | Sample categorized locally; edited amount and category saved. |
| Duplicate handling | Sample initially detects one duplicate; reimport detects all seven rows as possible duplicates. |
| History | Review, clear and undo work; saved history survives reload. Imported spending does not deduct opening balance again. |
| Dated messages | Explicitly dated INR 1,250.50 debit parsed and saved. Missing date rejected rather than guessed. |
| Monthly budgets | Education limit 500 against spending 650 shows 150 over; zero Food limit against 1,250.50 shows full overspend; limits isolated by month and restored after reload. |
| Gemini | Two real explanations succeeded with reviewed fictional sample inputs and explicit consent. Evidence values came from server calculations. API availability true; session-key input disabled on Vercel. |

## Security findings and changes

- The initial dependency scan reported 42 advisory entries, including a critical Next.js entry. Advisory counts include development tools and overlapping dependency chains, and do not establish exploitability of this application. Upgraded Next.js to 16.4.4, React/React DOM to 19.3.1 and affected dependencies; removed unused Drizzle packages that caused the esbuild-kit deprecation warnings. The full updated lockfile scan reports no high/critical entries and 20 moderate entries in development tooling: minimatch through ESLint and fflate through the retained Sites preview engine. Forced fixes propose breaking downgrades, so these were not applied. These tools are not used by the Vercel request handler; do not feed untrusted archives or glob patterns into developer tooling. The production-only exact-lockfile audit (`npm audit --omit=dev --package-lock-only`) reports zero advisories. This is a point-in-time registry result, not a guarantee against unknown vulnerabilities.
- Initial planner responses lacked CSP, frame protection, content-type protection, referrer policy and permissions policy. Add global baseline headers and a strict CSP scoped to the standalone planner. Scripts, styles and API connections are same-origin; no inline script/eval exception is needed.
- Discard an in-flight Gemini response if plan/purchase edits or an unapplied delay change occur before it returns.
- Admit requests to the best-effort provider limiter only after input validation, consent, key availability and model validation. Invalid requests should not exhaust the legitimate provider request allowance.

## Existing protections checked

Cross-origin browser AI request rejected (403); unsupported content type rejected (415); missing consent rejected (400). `/.env`, `/.env.local` and `/.git/config` return 404. API errors do not echo provider secrets in unit tests. The server sends the key in the Gemini request header, never a public URL or browser bundle. Imported markup test `<img src=x onerror=alert(1)>` produced no image element and no alert. Provider output is validated and HTML escaped. Request body is bounded to 64 KB; row counts, strings, monetary arithmetic and dates are validated. AI responses are not cached.

## Warnings

The copied `cache-dir` npm warning is a configuration compatibility warning, not a failed build or evidence of compromise. No repository .npmrc defines it. The two copied esbuild-kit warnings were from the unused Drizzle build tooling. No conclusion can be made about the fourth warning without its text.

## Limits and remaining operational risk

This was a bounded source review and functional check, not a penetration-test certification or a guarantee of perfect security. The public Gemini route has no account authentication. Its eight-per-minute in-memory limiter is per server instance, not global or durable: scale-out and cold starts can reset limits, and one visitor may affect others. Use a Vercel Firewall rate-limit rule and provider quota/billing limits before broad public promotion. No flood/load or destructive exploit testing was performed.

Data remains in the current browser's local storage, readable by users of that browser profile and lost when storage is cleared. No cross-device sync, bank connection, arbitrary bank PDF parsing, universal SMS support, investing, tax, trading or scam detection is claimed. These are outside the selected smart-budgeting scope. Mobile/assistive-technology coverage is limited; the visual redesign remains a separate next step.
