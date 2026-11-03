"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  demoWorkspace,
  validateWorkspace,
  type Workspace,
} from "../../lib/workspace-model";

type Context = {
  data: Workspace;
  update: (fn: (data: Workspace) => Workspace) => void;
  dirty: boolean;
  status: string;
  save: () => Promise<void>;
  demo: boolean;
  email: string;
  busy: boolean;
};
const WorkspaceContext = createContext<Context | null>(null);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace not ready.");
  return value;
}
export function WorkspaceProvider({
  demo,
  children,
}: {
  demo: boolean;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<Workspace | null>(null),
    [accountId, setAccountId] = useState(""),
    [revision, setRevision] = useState(0),
    [dirty, setDirty] = useState(false),
    [status, setStatus] = useState(
      demo ? "Opening the fictional demo…" : "Loading your private workspace…",
    ),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    if (demo) {
      setData(demoWorkspace());
      setStatus(
        "Fictional demo. Changes stay in memory and reset when you reload.",
      );
      return;
    }
    let alive = true;
    (async () => {
      try {
        const session = await fetch("/api/auth/session", { cache: "no-store" });
        const account = (await session.json()) as {
          user?: { id: string; email?: string };
        };
        if (!account.user) {
          window.location.replace("/sign-in");
          return;
        }
        const response = await fetch("/api/workspace", { cache: "no-store" });
        const result = (await response.json()) as {
          error?: string;
          workspace: unknown;
          revision: number;
          accountId: string;
        };
        if (!response.ok) throw new Error(result.error);
        if (result.accountId !== account.user.id)
          throw new Error(
            "Account changed while loading. Reload your workspace.",
          );
        if (alive) {
          setAccountId(account.user.id);
          setEmail(account.user.email ?? "");
          setData(validateWorkspace(result.workspace));
          setRevision(result.revision);
          setStatus(
            result.revision
              ? "Loaded from your account."
              : "Your account workspace is empty. Add a plan to begin.",
          );
        }
      } catch (error) {
        if (alive)
          setStatus(
            error instanceof Error ? error.message : "Workspace unavailable.",
          );
      }
    })();
    return () => {
      alive = false;
    };
  }, [demo]);
  useEffect(() => {
    if (demo || !accountId) return;
    let active = true;
    async function verify() {
      try {
        const result = (await (
          await fetch("/api/auth/session", { cache: "no-store" })
        ).json()) as { user?: { id: string } };
        if (active && result.user?.id !== accountId) {
          setData(null);
          setDirty(false);
          setStatus(
            "Your signed-in account changed or the session ended. Reload to continue.",
          );
        }
      } catch {
        /* A network failure does not overwrite the loaded workspace. */
      }
    }
    const focus = () => {
      void verify();
    };
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      window.removeEventListener("focus", focus);
    };
  }, [demo, accountId]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !demo) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, demo]);
  function update(fn: (data: Workspace) => Workspace) {
    setData((previous) => (previous ? fn(previous) : previous));
    generation.current++;
    setDirty(true);
    setStatus(
      demo
        ? "Demo changes are temporary."
        : "Unsaved changes. Select Save workspace to store them under your account.",
    );
  }
  async function save() {
    if (!data || demo) return;
    setBusy(true);
    const version = generation.current;
    try {
      validateWorkspace(data);
      const response = await fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace: data, revision, accountId }),
      });
      const result = (await response.json()) as {
        error?: string;
        workspace: unknown;
        revision: number;
        accountId: string;
      };
      if (response.status === 401) {
        setStatus(
          "Your session ended. Export your work before signing in again.",
        );
        return;
      }
      if (!response.ok) throw new Error(result.error);
      setRevision(result.revision);
      setDirty(generation.current !== version);
      setStatus(
        generation.current === version
          ? "Saved privately to your account."
          : "Earlier changes saved; newer edits still need saving.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Save failed. Your changes remain in this tab.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <section className="notice">
        <h1>Your workspace</h1>
        <p role="status">{status}</p>
        <button onClick={() => window.location.reload()}>Retry loading</button>
        <a href="/sign-in">Return to sign in</a>
      </section>
    );
  return (
    <WorkspaceContext.Provider
      value={{ data, update, dirty, status, save, demo, email, busy }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
