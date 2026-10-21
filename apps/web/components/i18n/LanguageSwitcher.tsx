"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/i18n/LangProvider";
import { LANGS, LANG_COOKIE, LANG_COOKIE_MAX_AGE, LANG_EVENT, LANG_INFO, LANG_STORAGE_KEY, toLang, type Lang } from "@/lib/i18n/languages";

/** Saves the choice where the server can read it (cookie) and as a backup (localStorage), and tells client components. */
export function saveLanguage(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; max-age=${LANG_COOKIE_MAX_AGE}; path=/; samesite=lax`;
  try { window.localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* storage can be blocked; the cookie is what counts */ }
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }));
}

const hasCookie = () => document.cookie.split("; ").some((c) => c.startsWith(`${LANG_COOKIE}=`));

/**
 * Pill with a globe, the short label and a chevron; opens a list of the five languages, each named in its own
 * language. Choosing one applies at once with router.refresh(). `theme` is for a white bar or a dark one.
 */
export function LanguageSwitcher({ theme = "light", align = "right", className }: { theme?: "light" | "dark"; align?: "left" | "right"; className?: string }) {
  const { lang } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasCookie()) return;
    try {
      const stored = toLang(window.localStorage.getItem(LANG_STORAGE_KEY));
      if (stored !== lang) { saveLanguage(stored); router.refresh(); }
    } catch { /* nothing stored */ }
  }, [lang, router]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const choose = (next: Lang) => {
    setOpen(false);
    if (next === lang) return;
    saveLanguage(next);
    router.refresh();
  };

  return (
    <div ref={root} className={clsx("relative", className)}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={LANG_INFO[lang].name} onClick={() => setOpen((o) => !o)}
        className={clsx("inline-flex h-[31px] items-center gap-1.5 rounded-full border px-[15px] text-[12px] font-semibold whitespace-nowrap shadow-sm transition-colors", theme === "light" ? "border-line bg-white/95 text-ink hover:bg-surface" : "border-white/20 bg-white/10 text-white hover:bg-white/15")}>
        <Globe size={14} aria-hidden />{LANG_INFO[lang].short}<ChevronDown size={12} aria-hidden className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <ul role="listbox" aria-label="Language" className={clsx("absolute top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-line bg-white p-1 shadow-[0_18px_40px_-16px_rgba(14,21,38,.35)]", align === "right" ? "right-0" : "left-0")}>
          {LANGS.map((code) => (
            <li key={code} role="none">
              <button type="button" role="option" aria-selected={code === lang} lang={code} onClick={() => choose(code)} className={clsx("flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm", code === lang ? "bg-[#eeefff] font-bold text-primary" : "text-ink hover:bg-surface")}>
                {LANG_INFO[code].name}<span className="text-xs font-normal text-faint">{LANG_INFO[code].short}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
