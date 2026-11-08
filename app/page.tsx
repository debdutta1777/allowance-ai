import Link from "next/link";
import { ForecastPreview } from "../components/service/forecast-preview";
import { ThemeToggle } from "../components/service/theme";
import { LandingMotion } from "../components/service/landing-motion";
import { FeatureReel } from "../components/service/feature-reel";
import { ScrollWords } from "../components/service/scroll-words";

const tools = [
  [
    "planner",
    "Budget the month. Test a purchase.",
    "Import and review your spending. Set category limits, add upcoming bills and see whether a purchase leaves enough for essentials.",
    "Plan your budget",
  ],
  [
    "investing",
    "Model SIPs. Review your portfolio.",
    "Enter a contribution, time horizon and assumed return. Compare SIP and lump-sum projections, then check your portfolio allocation.",
    "Explore investing",
  ],
  [
    "markets",
    "Backtest a strategy on past prices.",
    "Upload historical closing prices. Review simulated trades, fees, drawdown and buy-and-hold results. No real orders are placed.",
    "Try a backtest",
  ],
  [
    "tax",
    "Compare old and new tax regimes.",
    "Estimate both regimes for a supported salary-only scenario in FY 2025–26. See the deductions, rebates and limits behind the result.",
    "Compare regimes",
  ],
  [
    "safety",
    "Spot warning signs before you pay.",
    "Paste a suspicious payment message to check for PIN requests, collect-request tricks and pressure tactics. The check runs on your device.",
    "Review a message",
  ],
  [
    "business",
    "Forecast cash flow. Calculate EMIs.",
    "Estimate monthly cash movement, fixed-rate loan repayments and tax on an entered subtotal. Review the arithmetic before exporting an estimate.",
    "Explore the calculators",
  ],
];
export default function Home() {
  return (
    <LandingMotion>
      <a className="skip" href="#main-content">
        Skip to content
      </a>
      <div className="hero-surface">
        <header className="landing-bar content-width">
          <Link className="wordmark" href="/" aria-label="Allowance home">
            allowance<span>.</span>
          </Link>
          <nav aria-label="Main navigation">
            <a className="landing-nav-detail" href="#tools">
              What you can do
            </a>
            <Link href="/demo/dashboard">Explore demo</Link>
            <Link href="/sign-in">Sign in</Link>
            <ThemeToggle />
            <Link className="button-link" href="/sign-up">
              Create account
            </Link>
          </nav>
        </header>
        <section className="hero content-width" id="main-content">
          <div className="hero-copy">
            <p className="eyebrow">BUDGETS. SCENARIOS. MONEY DECISIONS.</p>
            <h1>
              Plan this month.
              <br />
              Know what’s
              <br />
              <em>left to spend.</em>
            </h1>
            <p className="hero-description">
              Bring your spending, bills and expected income into one plan. Test
              a purchase before making it, then save the numbers under your
              account.
            </p>
            <div className="actions">
              <Link className="button-link" href="/sign-up">
                Start your workspace
              </Link>
              <Link className="text-link" href="/demo/dashboard">
                Take a look inside
              </Link>
            </div>
            <p className="hero-note">
              Calculated from your inputs. Gemini explanations are optional.
            </p>
          </div>
          <ForecastPreview />
        </section>
        <div className="hero-foundation content-width">
          <p>
            One place for
            <br />
            <strong>your everyday financial planning.</strong>
          </p>
          <span>Budget & spending</span>
          <span>Future planning</span>
          <span>Financial awareness</span>
        </div>
      </div>
      <section
        className="intro-section content-width"
        aria-labelledby="intro-title"
      >
        <p className="eyebrow">PLAN BEYOND THE CURRENT BALANCE</p>
        <div>
          <h2 id="intro-title">
            <ScrollWords text="Know what remains after the bills. Then decide what comes next." />
          </h2>
          <p>
            A balance is a starting point. Rent, daily essentials and the next
            income date determine how much room your plan actually has.
          </p>
          <p>
            Add those commitments to the planner. Compare a purchase, delay an
            expected payment and inspect the daily balances behind the answer.
          </p>
        </div>
      </section>
      <section
        className="landing-tools content-width"
        id="tools"
        aria-labelledby="tools-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">WHAT YOU CAN DO</p>
            <h2 id="tools-title">
              <ScrollWords text="Six tools. A specific answer to each question." />
            </h2>
          </div>
          <p>Explore the working tools with fictional data.</p>
        </div>
        <FeatureReel
          tools={tools.map(([slug, title, copy, action]) => ({
            slug,
            title,
            copy,
            action,
          }))}
        />
      </section>
      <section className="workflow-section">
        <div className="content-width workflow-layout">
          <div data-reveal>
            <p className="eyebrow">FROM INPUT TO INSIGHT</p>
            <h2>
              <ScrollWords text="Import. Review. Plan the next move." />
            </h2>
            <Link className="button-link" href="/demo/transactions">
              Try a sample import
            </Link>
          </div>
          <ol className="workflow-list">
            <li data-reveal>
              <span>01</span>
              <div>
                <h3>Review your spending record.</h3>
                <p>
                  Enter a plan or import supported CSV and dated bank messages.
                  Review every transaction before including it.
                </p>
              </div>
            </li>
            <li data-reveal>
              <span>02</span>
              <div>
                <h3>Calculate a scenario.</h3>
                <p>
                  Compare a purchase, set a monthly limit or explore a scenario.
                  Calculations show the assumptions behind the outcome.
                </p>
              </div>
            </li>
            <li data-reveal>
              <span>03</span>
              <div>
                <h3>Save it to your account.</h3>
                <p>
                  Save plans, reviewed transactions, budgets and holdings to
                  your account. Request an optional Gemini explanation with your
                  consent.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <section className="data-section content-width">
        <p className="eyebrow">YOUR RECORDS, YOUR WORKSPACE</p>
        <h2>
          <ScrollWords text="Your records stay with your account. AI only sees the plan you approve." />
        </h2>
        <div className="data-details">
          <p>
            Your saved workspace is tied to your account. Financial records are
            checked against your identity and protected by database ownership
            rules.
          </p>
          <p>
            No bank or broker connection. No real-money trading. The guest demo
            is fictional and resets on reload. Gemini receives an applied plan
            only after you approve it.
          </p>
        </div>
        <Link className="text-link" href="/demo/settings">
          Understand how your data is handled
        </Link>
      </section>
      <footer className="landing-footer">
        <div className="content-width">
          <div className="footer-invitation">
            <h2>
              <ScrollWords text="Build your first budget. Test your next purchase." />
            </h2>
            <Link className="button-link" href="/sign-up">
              Create your workspace
            </Link>
          </div>
          <div className="footer-bottom">
            <Link className="wordmark" href="/">
              allowance<span>.</span>
            </Link>
            <p>Budgeting and financial scenarios, in one workspace.</p>
            <nav aria-label="Footer navigation">
              <Link href="/demo/dashboard">Explore demo</Link>
              <Link href="/sign-in">Sign in</Link>
            </nav>
          </div>
        </div>
      </footer>
    </LandingMotion>
  );
}
