# Allowance

A multipage personal finance application built with Next.js, React, Supabase Auth/Postgres and optional Gemini interpretations.

The public Home page explains the service and opens a working fictional guest demo. A shared application shell separates Dashboard, Planner, Transactions, Monthly Budgets, Investing, Historical Markets, Tax, Scam Checks, Small Business and Settings. Signed-in workspaces store plans, reviewed transactions, limits, holdings and preferences under a user's account.

## Local development

Use Node.js 24, `npm ci`, `npm test`, then `npm run dev`. Run `npm run build` before deployment. Copy `.env.example` to `.env.local` and configure only the dedicated Allowance project's server variables. Never put a Gemini key or service-role key in browser code.

## Database activation is required

Account code is implemented, but live sign-up and storage require a separate configured Supabase project. The owner's existing AuditEase and Eventora projects must not be modified. Until the new project is connected and configured, account forms are disabled and the guest demo remains available. See [service setup](docs/SERVICE-SETUP.md) for schema, ownership tests, email configuration and Vercel environment settings.

## Tool scope

- Smart budgeting: forecast essentials, compare purchases, delay income, import/review dated messages and CSV, categorize locally and set monthly limits.
- Investing: SIP/lump-sum scenarios and entered portfolio allocation checks.
- Markets: historical CSV moving-average backtests, paper trades and drawdown; no real-money trading or live market feed.
- Tax: supported ordinary-salary FY 2025–26 / AY 2026–27 old/new regime estimates, with eligibility limits shown.
- Scam checks: local warning-sign rules, without a safety guarantee.
- Small business: EMI, simple cash-flow projections and invoice tax arithmetic; no GST filing or compliant tax-invoice claim.

Inputs, assumptions and limitations are shown within each tool. The fictional demo uses temporary memory and resets on reload; it is separate from personal account data. The earlier single-page prototype remains in source for reference, while `/planner.html` redirects to the new demo planner.
