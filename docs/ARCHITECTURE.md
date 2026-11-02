# Architecture, Phase 2

The application is a static browser interface. `web/app.js` owns draft input, rendering and local storage. `src/forecast.ts` owns date and money validation plus cash-flow arithmetic. `src/money.ts` parses decimal rupee text without floating-point multiplication. `src/sample.ts` contains the explicitly fictional fixture.

`scripts/build.mjs` copies web assets into dist and strips TypeScript from those same tested modules. It does not maintain a second forecast implementation. No third-party runtime dependencies or remote fonts are used. The static build can be deployed on Vercel or another static host. Server-side AI is deferred to Phase 4 and will require a server runtime.

Opening balance precedes spending on the first date; both endpoints are inclusive. Expenses precede income on each date. The chart includes before-income and closing balances, and the numerical ledger explains that ordering. Forecasts should never be presented as guaranteed cash availability.

Browser storage is best effort and can be cleared by reset. No data is sent to a model, bank or analytics service in Phase 2. Transaction import will need reconciliation and semantic duplicate detection before it feeds this engine.
