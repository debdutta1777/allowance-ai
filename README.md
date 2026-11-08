# Allowance

A multipage personal finance application built with Next.js, React, Supabase Auth/Postgres and optional Gemini interpretations.

The public Home page explains the service and opens a working fictional guest demo. A shared application shell separates Dashboard, Planner, Transactions, Monthly Budgets, Investing, Historical Markets, Tax, Scam Checks, Small Business and Settings. Signed-in workspaces store plans, reviewed transactions, limits, holdings and preferences under a user's account.

## Local development

Use Node.js 24, `npm ci`, `npm test`, then `npm run dev`. Run `npm run build` before deployment. Copy `.env.example` to `.env.local` and configure only the dedicated Allowance project's server variables. Never put a Gemini key or service-role key in browser code.

## Try the demo

Open `/demo/dashboard` for the guided fictional scenario. No sign-in, bank details or API key is required to use the six calculator areas. Demo edits stay in memory and reset on reload. Live Gemini interpretations and private account saves require an existing verified account and server configuration.

The planner finds the maximum purchase amount on a selected day and the earliest feasible date that preserves a chosen reserve. Its interactive timeline shows bills, income and before-income reserve breaches. Calculations are deterministic integer-paise forecasts, conditional on the entered amounts and dates. Same-day income cannot conceal an earlier shortfall.

## Accounts and deployment

The dedicated Allowance Supabase project has workspace ownership policies and shared AI admission limits. See [service setup](docs/SERVICE-SETUP.md). Deploy server environment variables to Vercel; never embed provider or service-role keys in client code. New registration defaults to paused until `PUBLIC_SIGNUP_ENABLED=true` is explicitly set after custom SMTP and external-address confirmation are verified. Existing accounts can sign in. Password recovery remains deliberately unverified.

## Validation and demo guide

`npm test` (71 tests), `npm run typecheck`, `npm run lint` and `npm run build` pass for this release. `npm run evaluate:model` scored 23/23 on the small authored synthetic category evaluation set. This is not evidence of real-bank accuracy or calibrated confidence.

See [the judge walkthrough](docs/JUDGE-DEMO.md) for the demonstration sequence and boundaries.

## Tool scope

- Smart budgeting: forecast essentials, compare purchases, delay income, import/review dated messages and CSV, categorize locally and set monthly limits.
- Investing: SIP/lump-sum scenarios and entered portfolio allocation checks.
- Markets: historical CSV moving-average backtests, paper trades and drawdown; no real-money trading or live market feed.
- Tax: supported ordinary-salary FY 2025–26 / AY 2026–27 old/new regime estimates, with eligibility limits shown.
- Scam checks: local warning-sign rules, without a safety guarantee.
- Small business: EMI, simple cash-flow projections and invoice tax arithmetic; no GST filing or compliant tax-invoice claim.

Inputs, assumptions and limitations are shown within each tool. The fictional demo uses temporary memory and resets on reload; it is separate from personal account data. The earlier single-page prototype remains in source for reference, while `/planner.html` redirects to the new demo planner.

## Technology and attribution

Application: Next.js and React; authentication and storage: Supabase Auth/Postgres; optional consented explanations: Google Gemini. Local merchant classification uses the repository's multinomial Naive Bayes model and synthetic training examples. Forecast and purchase-date calculations are application code, not model-generated arithmetic. Dependencies and licenses are listed in `package.json` / `package-lock.json`. No real bank credentials or real trading integration is used.
