"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WorkspaceProvider, useWorkspace } from "./workspace-context";
import { ThemeToggle } from "./theme";
export const sections = [
  ["dashboard", "Dashboard"],
  ["planner", "Planner"],
  ["transactions", "Transactions"],
  ["budgets", "Monthly budgets"],
  ["investing", "Investing & portfolio"],
  ["markets", "Trading & markets"],
  ["tax", "Tax helper"],
  ["safety", "Scam & fraud checks"],
  ["business", "Small business"],
  ["settings", "Settings"],
] as const;
function Frame({
  demo,
  children,
}: {
  demo: boolean;
  children: React.ReactNode;
}) {
  const path = usePathname(),
    w = useWorkspace(),
    [error, setError] = useState(""),
    [menuOpen, setMenuOpen] = useState(false);
  async function signOut() {
    if (
      w.dirty &&
      !window.confirm(
        "Unsaved edits will be lost. Cancel to save or export them first.",
      )
    )
      return;
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error();
      window.location.replace("/sign-in");
    } catch {
      setError("Sign-out failed. Retry before leaving a shared device.");
    }
  }
  return (
    <div className="service-shell">
      <a className="skip" href="#page-content">
        Skip to page
      </a>
      <aside className="sidebar" data-open={menuOpen}>
        <Link href="/" className="wordmark">
          allowance<span>.</span>
        </Link>
        <p className="eyebrow">MONEY DECISIONS, WITH CONTEXT</p>
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-controls="workspace-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close menu" : "Workspace menu"}
        </button>
        <nav aria-label="Workspace pages" id="workspace-navigation">
          {sections.map(([slug, label], index) => (
            <div className="nav-entry" key={slug}>
              {[0, 4, 9].includes(index) && (
                <div className="nav-group">
                  {index === 0
                    ? "YOUR MONEY"
                    : index === 4
                      ? "EXPLORE & UNDERSTAND"
                      : "YOUR ACCOUNT"}
                </div>
              )}
              <Link
                key={slug}
                onClick={() => setMenuOpen(false)}
                href={`/${demo ? "demo" : "app"}/${slug}`}
                aria-current={
                  path === `/${demo ? "demo" : "app"}/${slug}`
                    ? "page"
                    : undefined
                }
              >
                <span className="nav-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {label}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {demo ? (
            <>
              <p>Fictional demo</p>
              <Link href="/sign-up">Create a personal account</Link>
            </>
          ) : (
            <>
              <p>{w.email}</p>
              <button onClick={signOut}>Sign out</button>
              {w.dirty && (
                <small>Save or export your edits before signing out.</small>
              )}
            </>
          )}
          <p role="status">{error}</p>
          <Link href="/">Back to home</Link>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-bar">
          <span>{demo ? "DEMO WORKSPACE" : "PRIVATE WORKSPACE"}</span>
          <ThemeToggle />
          <span role="status">{w.status}</span>
          {!demo && (
            <button onClick={w.save} disabled={!w.dirty || w.busy}>
              {w.busy ? "Saving…" : "Save workspace"}
            </button>
          )}
        </header>
        <main id="page-content">{children}</main>
        <footer className="workspace-footer">
          Amounts in INR. No bank or broker connection. Only reviewed inputs you
          approve are sent to Gemini.
        </footer>
      </div>
    </div>
  );
}
export function ServiceShell({
  demo,
  children,
}: {
  demo: boolean;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider demo={demo}>
      <Frame demo={demo}>{children}</Frame>
    </WorkspaceProvider>
  );
}
