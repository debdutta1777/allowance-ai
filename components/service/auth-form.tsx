"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme";
export function AuthForm({
  action,
  configured,
  notice = "",
  unavailableMessage = "Account access is awaiting connection to the dedicated database. The fictional demo is available now; sign-up is disabled until secure storage is configured.",
}: {
  action: "sign-in" | "sign-up" | "recover" | "password";
  configured: boolean;
  notice?: string;
  unavailableMessage?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(""),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false);
  const title = {
    "sign-in": "Sign in",
    "sign-up": "Create your account",
    recover: "Recover your account",
    password: "Set a new password",
  }[action];
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setFailed(false);
    const fields = new FormData(event.currentTarget);
    try {
      const body =
        action === "recover"
          ? { email: fields.get("email") }
          : action === "password"
            ? { password: fields.get("password") }
            : { email: fields.get("email"), password: fields.get("password") };
      const response = await fetch("/api/auth/" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        error?: string;
        message: string;
        signedIn?: boolean;
      };
      if (!response.ok) throw new Error(result.error);
      setStatus(result.message);
      if (result.signedIn) router.replace("/app/dashboard");
    } catch (error) {
      setFailed(true);
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to continue. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <aside className="auth-story">
        <Link className="wordmark" href="/" aria-label="Allowance home">
          allowance<span>.</span>
        </Link>
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER, IN VIEW</p>
          <h2>
            A clearer picture
            <br />
            of your money.
            <br />
            <em>
              A little more room
              <br />
              to think.
            </em>
          </h2>
          <p>
            A personal place for your plans, spending and the decisions ahead.
          </p>
        </div>
        <p>YOUR INPUTS. TRANSPARENT CALCULATIONS.</p>
      </aside>
      <div className="auth-content">
        <div className="auth-theme">
          <ThemeToggle />
        </div>
        <p className="eyebrow">ALLOWANCE / YOUR PERSONAL WORKSPACE</p>
        <h1>{title}</h1>
        {notice && (
          <p role="status" className="auth-error">
            {notice}
          </p>
        )}
        <p>
          Keep your plans, transactions and budgets in your personal workspace.
        </p>
        {!configured && (
          <p role="status" className="notice">
            {unavailableMessage}
          </p>
        )}
        <form method="post" action={"/api/auth/" + action} onSubmit={submit}>
          {action !== "password" && (
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
          )}
          {action !== "recover" && (
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={
                  action === "sign-in" ? "current-password" : "new-password"
                }
                minLength={12}
                maxLength={128}
                required
              />
              <small>12 to 128 characters.</small>
            </label>
          )}
          <button disabled={busy || !configured}>
            {busy ? "Working…" : title}
          </button>
          <p
            role={failed ? "alert" : "status"}
            className={failed ? "auth-error" : undefined}
          >
            {status}
          </p>
        </form>
        {(action === "sign-in" || action === "sign-up") && (
          <ConfirmationHelp configured={configured} />
        )}
        {action === "password" && status && !failed && (
          <Link className="button-link" href="/app/dashboard">
            Return to your workspace
          </Link>
        )}
        <nav aria-label="Account options">
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up">Create account</Link>
          <Link href="/forgot-password">Forgot password</Link>
          <Link href="/demo/dashboard">Try the fictional demo</Link>
        </nav>
      </div>
    </main>
  );
}

function ConfirmationHelp({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <details className="confirmation-help">
      <summary>Need a new confirmation email?</summary>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const email = new FormData(event.currentTarget).get("email");
          setBusy(true);
          setMessage("");
          try {
            const response = await fetch("/api/auth/resend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
            const result = (await response.json()) as {
              message?: string;
              error?: string;
            };
            setMessage(
              response.ok
                ? (result.message ?? "Check your inbox.")
                : (result.error ??
                    "The email could not be requested. Try again later."),
            );
          } catch {
            setMessage("Unable to connect. Check your connection and retry.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <button disabled={busy || !configured}>
          {busy ? "Requesting…" : "Request confirmation email"}
        </button>
        <p role="status">{message}</p>
      </form>
    </details>
  );
}
