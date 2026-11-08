"use client";
import { useEffect, useRef } from "react";

/** Enhance server-rendered content only after the observer is available. */
export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const container = root.current;
    if (!container || !("IntersectionObserver" in window)) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = Array.from(
      container.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const seen = new WeakSet<Element>();
    let observer: IntersectionObserver | undefined;
    function start() {
      observer?.disconnect();
      if (media.matches) {
        targets.forEach((target) => {
          target.dataset.revealState = "visible";
        });
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.revealState = "visible";
            seen.add(entry.target);
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
      );
      targets.forEach((target) => {
        // Keep the initial viewport, restored scroll positions and focused content readable.
        if (
          seen.has(target) ||
          target.getBoundingClientRect().top < window.innerHeight - 24 ||
          target.contains(document.activeElement)
        ) {
          target.dataset.revealState = "visible";
          seen.add(target);
        } else {
          target.dataset.revealState = "pending";
          observer?.observe(target);
        }
      });
    }
    start();
    media.addEventListener("change", start);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", start);
      targets.forEach((target) => {
        delete target.dataset.revealState;
      });
    };
  }, []);
  return (
    <main className="landing" ref={root}>
      {children}
    </main>
  );
}
