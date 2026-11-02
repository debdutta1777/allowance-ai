# Vercel deployment

Import https://github.com/debdutta1777/allowance-ai with framework Next.js, repository root, Node.js 24.x and the framework-default output directory. vercel.json supplies npm ci and npm run build. Build creates the public planner assets and then runs next build --webpack.

In Project Settings, add GEMINI_API_KEY under Environment Variables and select the intended environments. The value is the key itself without surrounding quotes. GEMINI_MODEL is optional and defaults to gemini-3.5-flash-lite. Redeploy after changing variables. Never use NEXT_PUBLIC_GEMINI_API_KEY.

After deployment:

- GET /api/ai returns only available, provider and sessionKeyAllowed. available true means a server secret is present; it does not verify the key's quota or access.
- The private-review key-entry panel is disabled on Vercel. Visitors do not need to enter their own key.
- Use synthetic sample data for the first explanation. The user explicitly consents before plan inputs and calculated figures are sent to Gemini.
- If requests fail, inspect the displayed error and your Google AI Studio key/project quota. Do not send the key in an issue or screenshot. A free-tier project and an accessible model are required for free-tier usage; the application does not configure Google billing.

For another Node.js host, run npm ci, npm run build and npm run start with the same server environment values. ALLOW_SESSION_KEYS should remain false outside the trusted Sites private-review environment.

The real key, Vercel project and live provider response are configured and checked by the owner after deployment. Automated provider tests use mocks.
