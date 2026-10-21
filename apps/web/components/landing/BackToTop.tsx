"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanding } from "@/components/i18n/LangProvider";

/** Round button bottom right; appears after the first screen. */
export function BackToTop() {
  const { toTop } = useLanding().nav;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button type="button" aria-label={toTop} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-6 bottom-6 z-40 grid size-11 place-items-center rounded-full border border-line bg-white text-ink shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
      <ArrowUp size={18} aria-hidden />
    </button>
  );
}
