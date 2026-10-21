"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Fades content in once it scrolls into view. `delay` staggers siblings, in milliseconds. */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("js");
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={clsx("reveal", shown && "in", className)} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
