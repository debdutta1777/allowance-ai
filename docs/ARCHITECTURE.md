# Original prototype architecture

This document describes the earlier single-page prototype. The current account-based Next.js service, database ownership and shared AI limits are documented in [SERVICE-SETUP.md](SERVICE-SETUP.md).

## Client

The planner is a normal HTML/CSS/module-JavaScript application, served as public/planner.html by Next.js on Vercel. The existing Sites build uses Vinext. web/app.js owns applied plan state and draft edits. web/extensions.js owns import review, local history, delay scenarios and AI requests. Applied plans, imported history and draft edits are kept distinct. A pending edit must be applied before an AI explanation can use it.

## Deterministic engine

src/forecast.ts computes integer-paise balances using inclusive date-only horizons. Daily essentials and scheduled expenses precede same-day income. Purchase simulations never mutate their input. src/insights.ts computes delayed-income scenarios and a fixed ledger of evidence IDs. Imported history cannot cause a second deduction from the opening balance.

## Import and local model

src/imports.ts implements bounded CSV and dated-message parsing, validation, duplicate candidates and separate debit/income/refund/transfer totals. User corrections are validated again on save. src/category-model.ts implements a trained multinomial Naive Bayes merchant classifier with Laplace smoothing. Its training corpus and evaluation data are authored synthetic examples. Direction handling remains a clearly separate rule. No real-bank generalization or calibrated confidence is established.

## Server AI

app/api/ai/route.ts provides status and POST actions. lib/ai-service.ts validates bounded requests, requires consent and rejects cross-origin requests. The server recomputes all evidence rather than accepting client totals. Gemini generateContent uses a structured schema and the x-goog-api-key header. Prose containing numeric characters or currency symbols is rejected, and cited evidence IDs must exist in the computed ledger. These checks protect arithmetic and citation integrity, but do not guarantee that every natural-language suggestion is semantically correct.

On Vercel, a provider key comes exclusively from the server GEMINI_API_KEY environment variable, trimmed at request time by lib/ai-config.ts. It is not embedded in browser assets. An optional session key is supported only by the separate Sites private-review flow. Session keys require ALLOW_SESSION_KEYS=true plus platform-supplied authenticated identity; the deployment is currently owner-private. They are never stored or returned. The private owner enters the key on the website, outside chat. This review-mode route is not a durable credential store for judges. A server runtime secret is needed for shared submission use.

The route limits requests per identity in a per-isolate memory window. This is best-effort rate limiting, not a durable cross-isolate quota. The provider request has a timeout, bounded output and no automatic retries. Errors never include provider response bodies or credentials. No request-body logging is implemented.

## Hosting

The default npm dev/build/start commands target Next.js. vercel.json selects the Next.js framework and preserves its default output layout. Node.js 24.x is required. No static export is used because the Gemini endpoint needs a server. The earlier Sites project identity and private audience are preserved independently. The .openai manifest declares Worker hosting without a static-only entry. No D1 or R2 resource is used. Browser history and preferences are local only; clearing browser data removes them. The GitHub repository and Sites source repository have distinct commit histories; runtime changes are mirrored to GitHub after verification.

## Remaining live verification

Provider behavior and owner-session setup must be checked with the owner's actual Gemini key after entry. All provider responses in the automated suite are mocks and all financial fixtures are synthetic.

On Vercel, client-supplied Sites identity headers are never trusted for session keys or separate request quotas. A shared per-isolate request window is used instead. This remains a best-effort in-memory limit, not a globally durable spending cap.
