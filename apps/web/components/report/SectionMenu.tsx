"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

export type Section = { id: string; label: string };

/** Sticky section menu that highlights the section on screen and scrolls smoothly to a section. */
export function SectionMenu({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);
  return (
    <nav aria-label="Report sections" className="sticky top-0 z-20 -mx-4 border-b border-line bg-surface/95 px-4 backdrop-blur md:-mx-8 md:px-8">
      <ul className="flex gap-1 overflow-x-auto py-2">
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined} className={clsx("inline-flex min-h-9 items-center rounded-full px-3 text-sm whitespace-nowrap", active === s.id ? "bg-primary-soft font-medium text-primary" : "text-muted hover:text-ink")}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SectionHeading({ number, label, title, intro }: { number: string; label: string; title: string; intro?: string }) {
  return (
    <header className="mb-5">
      <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.16em] text-primary uppercase"><span className="font-mono text-faint">{number}</span>{label}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      {intro && <p className="mt-1 max-w-2xl text-muted">{intro}</p>}
    </header>
  );
}
