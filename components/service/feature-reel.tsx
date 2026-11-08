"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Tool = { slug: string; title: string; copy: string; action: string };
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function scrollMetrics(story: HTMLElement, stage: HTMLElement) {
  const stickyTop = Math.max(20, (window.innerHeight - stage.offsetHeight) / 2);
  const runway = Math.max(1, story.offsetHeight - stage.offsetHeight);
  const leadIn = Math.min(96, runway * 0.2);
  return { stickyTop, leadIn, travel: Math.max(1, runway - leadIn) };
}

/** A bounded sticky story driven by ordinary page scrolling, never a wheel trap. */
export function FeatureReel({ tools }: { tools: Tool[] }) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const selected = useRef(0);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const room = window.matchMedia("(min-height: 640px)");
    const update = () =>
      setEnhanced(
        !reduced.matches && room.matches && "IntersectionObserver" in window,
      );
    update();
    reduced.addEventListener("change", update);
    room.addEventListener("change", update);
    return () => {
      reduced.removeEventListener("change", update);
      room.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enhanced || !root.current || !frame.current) return;
    const story = root.current;
    const stage = frame.current;
    const labels = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-feature-label]"),
    );
    let tick = 0;
    let visible = true;
    function update() {
      tick = 0;
      const { stickyTop, travel, leadIn } = scrollMetrics(story, stage);
      const position =
        clamp(
          (stickyTop - story.getBoundingClientRect().top - leadIn) / travel,
          0,
          1,
        ) *
        (tools.length - 1);
      story.style.setProperty("--feature-position", position.toFixed(4));
      labels.forEach((label, index) => {
        const distance = Math.abs(index - position);
        label.style.opacity = String(clamp(1 - distance * 0.64, 0.12, 1));
        label.style.transform =
          "scale(" + (1 - Math.min(distance, 2) * 0.025) + ")";
      });
      const next = Math.round(position);
      if (next !== selected.current) {
        selected.current = next;
        setActive(next);
      }
    }
    function schedule() {
      if (visible && !tick) tick = requestAnimationFrame(update);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(story);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(tick);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enhanced, tools.length]);

  function choose(index: number) {
    if (!root.current || !frame.current) return;
    const { stickyTop, travel, leadIn } = scrollMetrics(
      root.current,
      frame.current,
    );
    const top =
      window.scrollY +
      root.current.getBoundingClientRect().top -
      stickyTop +
      leadIn +
      (travel * index) / (tools.length - 1);
    window.scrollTo({ top, behavior: "smooth" });
  }
  const tool = tools[active];
  return (
    <div
      className="feature-story"
      ref={root}
      data-enhanced={enhanced}
      data-active-tool={tool.slug}
    >
      <div
        className="feature-frame"
        ref={frame}
        role="region"
        aria-label="Scroll through the six finance tools"
      >
        <div className="feature-dial" aria-hidden="true">
          <p className="eyebrow">A LITTLE MORE PERSPECTIVE</p>
          <svg viewBox="0 0 240 240" className="feature-emblem">
            <g className="feature-orbit">
              {Array.from({ length: 6 }, (_, index) => (
                <path
                  key={index}
                  d="M120 28 A92 92 0 0 1 198 71"
                  transform={"rotate(" + index * 60 + " 120 120)"}
                />
              ))}
            </g>
            <g className="feature-inner-orbit">
              <path d="M57 120 A63 63 0 0 1 120 57" />
              <path d="M183 120 A63 63 0 0 1 120 183" />
            </g>
            <text x="120" y="133" textAnchor="middle">
              a.
            </text>
          </svg>
          <p className="feature-scroll-cue">Scroll to explore</p>
          <div className="feature-progress">
            <span />
          </div>
        </div>
        <div className="feature-reel-window" aria-hidden="true">
          <div className="feature-reel-track">
            {tools.map((item) => (
              <div
                className="feature-reel-label"
                data-feature-label
                key={item.slug}
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>
        <div className="feature-description">
          <div
            key={tool.slug}
            className="feature-description-copy"
            aria-live="polite"
            aria-atomic="true"
          >
            <h3 className="feature-accessible-title">{tool.title}</h3>
            <p>{tool.copy}</p>
            <Link className="feature-action" href={"/demo/" + tool.slug}>
              {tool.action}
            </Link>
          </div>
          <div className="feature-controls" aria-label="Choose a finance tool">
            <button
              type="button"
              onClick={() => choose(active - 1)}
              disabled={active === 0}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => choose(active + 1)}
              disabled={active === tools.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <div className="feature-fallback tool-directory">
        {tools.map((item) => (
          <article className="tool-row" key={item.slug}>
            <div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </div>
            <Link href={"/demo/" + item.slug}>{item.action}</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
