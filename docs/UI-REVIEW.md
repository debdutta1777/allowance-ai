# Interface update, 8 November 2026

The reference is Oripio Web's Fintech Landing Page Design on Dribbble (shot 27534578). The user approved adapting its typography, composition and green palette, then requested light mode as the default with dark mode optional.

## Implemented

- Warm ivory and muted sage default appearance, with an optional forest-green dark theme across Home, all workspace routes and account forms.
- A shared accessible theme switch; the device stores only the theme preference in `allowance-theme`. Initial theme is applied before rendering to avoid a light-background flash when a saved dark preference exists. Clearing the preference restores light mode.
- New landing-page composition with an interactive fictional purchase forecast, six individual tool links, an import-to-planning workflow and clear data-handling information.
- The landing preview uses the existing paise-based forecast engine. INR 500, 2,000 and 3,500 scenarios update the plotted closing balances and computed intraday minimum. No decorative financial performance figures, customer counts, testimonials or partner claims were introduced.
- A dashboard forecast visualization generated from the currently applied plan and purchase, grouped sidebar navigation, a compact expandable menu, consistent forms/tables/results and redesigned account-page presentation.
- Native SVG charts with text descriptions, differentiated line patterns, external date labels at narrow widths, keyboard-operable controls and visible focus states. No new runtime dependencies or external image/font services.

## Validation

- All 65 existing automated tests passed; production build and TypeScript passed after the theme/component changes. Final visual-caption adjustments are checked by the branch CI.
- Browser: default light appearance, dark switch, persistence after reload, restored light preference, navigation between landing/workspace/account pages, live purchase example, dashboard graph and planner calculation.
- At a 337 CSS-pixel viewport (browser zoom): compact navigation expands and closes after choosing a page; Dashboard, Planner, Tax and Sign in have no document-level horizontal overflow. Planner's INR 500 purchase returns an INR 550 minimum and INR 250 delayed-income minimum. This verifies responsive layout behavior, not physical mobile-device compatibility.
- Account and financial API handlers, database schema, ownership checks and existing environment variables were not changed. Password recovery remains deliberately unverified. Public signup email delivery still requires custom SMTP.

The change is on the existing feature/personal-finance-service review branch. It does not replace the production application until the service release is promoted.
