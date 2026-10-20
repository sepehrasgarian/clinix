import Link from "next/link";
import { ArrowRight, BarChart3, Clock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { copy } from "@/lib/copy";

const trustIcons = [BarChart3, ShieldCheck, Clock];

/** Dark hero: ink background, two glowing "planets", gold-to-violet second headline line, gold primary button. */
export function Hero() {
  const t = copy.landing.hero;
  return (
    <section className="relative isolate overflow-hidden bg-[#0b0f1f] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-24 size-[560px] rounded-full bg-[#2e2a7a]" style={{ boxShadow: "0 0 0 2px rgba(245,185,66,.35), 0 0 120px 40px rgba(245,185,66,.18)" }} />
        <div className="absolute -right-56 -top-10 size-[720px] rounded-full bg-[#2a2a6e]" style={{ boxShadow: "0 0 160px 60px rgba(99,102,241,.25)" }} />
        <div className="absolute left-1/2 top-0 h-full w-[1200px] -translate-x-1/2 rounded-full border border-white/5" />
        <span className="absolute left-[18%] top-[8%] size-1.5 rounded-full bg-[#a78bfa] shadow-[0_0_12px_4px_rgba(167,139,250,.6)]" />
        <span className="absolute right-[22%] top-[42%] size-1.5 rounded-full bg-[#a78bfa] shadow-[0_0_12px_4px_rgba(167,139,250,.6)]" />
      </div>

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo surface="dark" height={30} />
        <Link href="/start" className="min-h-10 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
          {t.navCta}
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pt-14 pb-20 text-center md:pt-20 md:pb-24">
        <p className="mb-6 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs tracking-wide text-white/70 uppercase">{t.eyebrow}</p>
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
          {t.headline1}
          <br />
          <span className="bg-gradient-to-r from-[#f5b942] via-[#e9a3c9] to-[#6d5cf5] bg-clip-text text-transparent">{t.headline2}</span>
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-lg text-white/70">{t.sub}</p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/start" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5b942] px-6 text-base font-semibold text-[#0b0f1f] shadow-[0_10px_40px_-10px_rgba(245,185,66,.7)] hover:bg-[#f7c55e]">
            {t.cta} <ArrowRight size={18} aria-hidden />
          </Link>
          <a href="#how" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-base font-medium text-white hover:bg-white/10">
            {t.secondary} <ArrowRight size={18} aria-hidden />
          </a>
        </div>

        <ul className="mx-auto mt-14 grid max-w-4xl gap-6 text-left sm:grid-cols-3 sm:divide-x sm:divide-white/10">
          {t.trust.map((item, i) => {
            const Icon = trustIcons[i];
            return (
              <li key={item.title} className="flex items-center gap-3 sm:justify-center">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#a78bfa]"><Icon size={18} aria-hidden /></span>
                <span>
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="block text-[11px] tracking-[0.14em] text-white/50 uppercase">{item.sub}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
