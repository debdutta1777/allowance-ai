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
    const textTargets = Array.from(
      container.querySelectorAll<HTMLElement>("[data-scroll-text]"),
    ).map((element) => ({
      element,
      words: Array.from(
        element.querySelectorAll<HTMLElement>(".scroll-word > span"),
      ),
    }));
    let frame = 0;
    function paintWords() {
      frame = 0;
      for (const { element, words } of textTargets) {
        if (media.matches) {
          delete element.dataset.wordMotion;
          continue;
        }
        const box = element.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) continue;
        element.dataset.wordMotion = "on";
        const progress = Math.min(
          1,
          Math.max(
            0,
            (window.innerHeight * 0.88 - box.top) /
              (window.innerHeight * 0.48 + box.height * 0.25),
          ),
        );
        words.forEach((word, index) => {
          const amount = Math.min(
            1,
            Math.max(0, progress * (words.length + 2) - index),
          );
          word.style.setProperty(
            "--word-opacity",
            String(0.24 + amount * 0.76),
          );
          word.style.setProperty("--word-lift", (1 - amount) * 9 + "px");
        });
      }
    }
    function scheduleWords() {
      if (!frame) frame = requestAnimationFrame(paintWords);
    }
    let observer: IntersectionObserver | undefined;
    function start() {
      observer?.disconnect();
      scheduleWords();
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
    window.addEventListener("scroll", scheduleWords, { passive: true });
    window.addEventListener("resize", scheduleWords);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      media.removeEventListener("change", start);
      window.removeEventListener("scroll", scheduleWords);
      window.removeEventListener("resize", scheduleWords);
      textTargets.forEach(({ element }) => {
        delete element.dataset.wordMotion;
      });
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
