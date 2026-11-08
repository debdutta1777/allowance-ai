import Link from "next/link";
import { ForecastPreview } from "../components/service/forecast-preview";
import { ThemeToggle } from "../components/service/theme";
import { LandingMotion } from "../components/service/landing-motion";
import { FeatureReel } from "../components/service/feature-reel";

const tools = [
  [
    "planner",
    "Make room for what matters.",
    "Bring in reviewed transactions, set monthly limits and see how a purchase changes the days ahead.",
    "Plan your budget",
  ],
  [
    "investing",
    "Understand the longer view.",
    "Explore SIP and lump-sum scenarios, understand investment basics and review your entered portfolio allocation.",
    "Explore investing",
  ],
  [
    "markets",
    "Test an idea against the past.",
    "Backtest a moving-average strategy on uploaded historical prices, with fees and a paper trade ledger.",
    "Try a backtest",
  ],
  [
    "tax",
    "Put the tax rules in perspective.",
    "Compare supported salary scenarios under the old and new regimes, with the assumptions beside the results.",
    "Compare regimes",
  ],
  [
    "safety",
    "Pause before you approve.",
    "Review suspicious payment messages for common warning signs. The check runs locally and never opens their links.",
    "Review a message",
  ],
  [
    "business",
    "See the numbers behind the next step.",
    "Work through cash-flow scenarios, loan payments and entered GST arithmetic before committing to a decision.",
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
            <p className="eyebrow">PERSONAL FINANCE, CONSIDERED</p>
            <h1>
              A clearer picture.
              <br />A better money
              <br />
              <em>decision.</em>
            </h1>
            <p className="hero-description">
              From this month’s essentials to the plans ahead. Understand your
              spending, explore the possibilities and make your next move with
              context.
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
              Your own inputs. Transparent calculations. AI when you choose.
            </p>
          </div>
          <ForecastPreview />
        </section>
        <div className="hero-foundation content-width">
          <p>
            Thoughtful tools for
            <br />
            <strong>everyday money questions.</strong>
          </p>
          <span>Budget & spending</span>
          <span>Future planning</span>
          <span>Financial awareness</span>
        </div>
      </div>
      <section
        className="intro-section content-width"
        aria-labelledby="intro-title"
        data-reveal
      >
        <p className="eyebrow">LESS GUESSWORK. MORE CONTEXT.</p>
        <div>
          <h2 id="intro-title">
            Your finances deserve
            <br />
            more than a best guess.
          </h2>
          <p>
            There’s a difference between knowing your balance and knowing what
            you can do with it. Allowance brings your plans, spending and
            financial questions into one personal workspace.
          </p>
          <p>
            Start with a budget. Test a purchase. Look further ahead. Each tool
            explains its inputs and limits so you can understand the result.
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
            <h2 id="tools-title">A little clarity, wherever you need it.</h2>
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
              A simple way
              <br />
              to get your bearings.
            </h2>
            <Link className="button-link" href="/demo/transactions">
              Try a sample import
            </Link>
          </div>
          <ol className="workflow-list">
            <li data-reveal>
              <span>01</span>
              <div>
                <h3>Bring your numbers.</h3>
                <p>
                  Enter a plan or import supported CSV and dated bank messages.
                  Review every transaction before including it.
                </p>
              </div>
            </li>
            <li data-reveal>
              <span>02</span>
              <div>
                <h3>See what changes.</h3>
                <p>
                  Compare a purchase, set a monthly limit or explore a scenario.
                  Calculations show the assumptions behind the outcome.
                </p>
              </div>
            </li>
            <li data-reveal>
              <span>03</span>
              <div>
                <h3>Keep the useful picture.</h3>
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
      <section className="data-section content-width" data-reveal>
        <p className="eyebrow">YOUR RECORDS, YOUR WORKSPACE</p>
        <h2>
          Personal by design.
          <br />
          <span>Clear about the boundaries.</span>
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
          <div className="footer-invitation" data-reveal>
            <h2>
              Make room for
              <br />
              <em>a clearer next step.</em>
            </h2>
            <Link className="button-link" href="/sign-up">
              Create your workspace
            </Link>
          </div>
          <div className="footer-bottom">
            <Link className="wordmark" href="/">
              allowance<span>.</span>
            </Link>
            <p>Money decisions, with more context.</p>
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
