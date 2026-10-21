"use client";

import clsx from "clsx";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useLanding } from "@/components/i18n/LangProvider";
import { useSignedIn } from "@/components/auth/useSignedIn";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

/** Fixed white top bar. The link for the section on screen gets a 2px underline. */
export function Nav() {
  const t = useLanding().nav;
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const signedIn = useSignedIn();
  const account = signedIn ? { href: "/app", label: t.account } : { href: "/login", label: t.login };

  useEffect(() => {
    const hero = document.getElementById("hero");
    const onScroll = () => setScrolled(window.scrollY > (hero ? hero.offsetHeight - 84 : 40));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = t.links.map((l) => document.getElementById(l.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver((entries) => {
      const hit = entries.find((e) => e.isIntersecting);
      if (hit) setActive(hit.target.id);
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [t.links]);

  const demo = <Link href={t.href} className="inline-flex h-[42px] items-center rounded-full bg-[#f59e0b] px-[19px] text-[13.2px] font-bold text-[#101a32] shadow-[0_10px_24px_-12px_rgba(245,158,11,.7)] hover:brightness-105">{t.cta}</Link>;
  return (
    <header className={clsx("fixed inset-x-0 top-0 z-50 border-b bg-white transition-shadow duration-200", scrolled ? "border-line bg-white/95 shadow-[0_10px_30px_-18px_rgba(14,21,38,.3)] backdrop-blur" : "border-transparent")}>
      <div className="mx-auto flex h-[88px] w-[calc(100%-48px)] max-w-[1820px] items-center justify-between lg:h-[96px] lg:w-[calc(100%-80px)]">
        <div className="lg:hidden"><Logo surface="light" height={38} /></div>
        <div className="hidden lg:block"><Logo surface="light" height={48} /></div>
        <nav aria-label="Sections" className="hidden items-center lg:flex">
          {t.links.map((l) => (
            <a key={l.id} href={l.href} aria-current={(l.href.includes("#") ? active === l.id : (pathname ?? "").startsWith(l.href)) ? "true" : undefined}
              className="ml-[clamp(14px,1.6vw,30px)] border-b-2 whitespace-nowrap first:ml-0 xl:ml-[clamp(18px,2.85vw,43px)] xl:first:ml-0 border-transparent py-1.5 text-[14px] font-medium tracking-[0.04em] text-slate-500 transition-colors hover:text-ink aria-[current]:border-ink aria-[current]:text-ink xl:text-[15px]">
              {l.label}
            </a>
          ))}
          <Link href="/contact" aria-current={(pathname ?? "").startsWith("/contact") ? "page" : undefined} className="ml-[clamp(14px,1.6vw,30px)] text-[14px] whitespace-nowrap xl:ml-[clamp(16px,2.6vw,39px)] font-medium tracking-[0.04em] text-slate-500 hover:text-ink aria-[current]:font-semibold aria-[current]:text-ink xl:text-[15px]">{t.contact}</Link>
          <Link href={account.href} className="ml-[clamp(14px,1.6vw,30px)] text-[14px] font-medium whitespace-nowrap text-ink xl:ml-[clamp(16px,2.4vw,36px)] xl:text-[15px]">{account.label}</Link>
          <LanguageSwitcher theme="light" className="ml-[clamp(14px,1.6vw,30px)]" />
          <span className="ml-[clamp(14px,1.8vw,27px)] whitespace-nowrap">{demo}</span>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          {demo}
          <button type="button" aria-label={open ? t.closeMenu : t.openMenu} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="grid size-11 place-items-center rounded-full border border-line text-ink">
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <div className="landing-shell pb-4 lg:hidden">
          <ul className="rounded-[18px] border border-line bg-white p-2 shadow-[var(--shadow-card)]">
            <li className="px-3 py-2"><LanguageSwitcher align="left" /></li>
            {t.links.map((l) => (
              <li key={l.id}><a href={l.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 font-medium hover:bg-surface">{l.label}</a></li>
            ))}
            <li className="mt-1 border-t border-line pt-1"><Link href="/contact" className="flex min-h-11 items-center rounded-xl px-3 font-medium hover:bg-surface">{t.contact}</Link></li>
            <li><Link href={account.href} className="flex min-h-11 items-center rounded-xl px-3 font-medium hover:bg-surface">{account.label}</Link></li>
          </ul>
        </div>
      )}
    </header>
  );
}
