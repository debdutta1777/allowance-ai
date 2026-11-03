"use client";
import { useState } from "react";
import Link from "next/link";
export function AuthForm({
  action,
  configured,
}: {
  action: "sign-in" | "sign-up" | "recover" | "password";
  configured: boolean;
}) {
  const [status, setStatus] = useState(""),
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
      if (result.signedIn) window.location.assign("/app/dashboard");
    } catch (error) {
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
      <Link href="/">Allowance / Home</Link>
      <h1>{title}</h1>
      <p>
        Keep your plans, transactions and budgets in your personal workspace.
      </p>
      {!configured && (
        <p role="status" className="notice">
          Account access is awaiting connection to the dedicated database. The
          fictional demo is available now; sign-up is disabled until secure
          storage is configured.
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
        <p role="status">{status}</p>
      </form>
      <nav aria-label="Account options">
        <Link href="/sign-in">Sign in</Link>
        <Link href="/sign-up">Create account</Link>
        <Link href="/forgot-password">Forgot password</Link>
        <Link href="/demo/dashboard">Try the fictional demo</Link>
      </nav>
    </main>
  );
}
