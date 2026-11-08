"use client";
import { createContext, useContext, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext({
  theme: "light" as Theme,
  toggle: () => {},
});
function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
function subscribeTheme(notify: () => void) {
  function sync(event: StorageEvent) {
    if (event.key !== "allowance-theme" && event.key !== null) return;
    document.documentElement.dataset.theme =
      event.newValue === "dark" ? "dark" : "light";
    notify();
  }
  window.addEventListener("storage", sync);
  window.addEventListener("allowance-theme-change", notify);
  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener("allowance-theme-change", notify);
  };
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readTheme,
    () => "light" as Theme,
  );
  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("allowance-theme-change"));
    try {
      localStorage.setItem("allowance-theme", next);
    } catch {
      /* Theme switching still works when storage is unavailable. */
    }
  }
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function ThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
      }
    >
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
