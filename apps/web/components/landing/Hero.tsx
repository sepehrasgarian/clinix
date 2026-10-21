"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Clock, ShieldCheck } from "lucide-react";
import { useLanding } from "@/components/i18n/LangProvider";

const trustIcons = [BarChart3, ShieldCheck, Clock];

/**
 * Dark hero under the fixed nav. Sizes are in px on purpose: the page root is 14px, so rem would shrink the
 * 86px headline and 58px buttons this layout is built on. Planet and orbit positions are fixed in px too.
 */
export function Hero() {
  const t = useLanding().hero;
  return (
    <section id="hero" className="relative isolate min-h-[820px] overflow-hidden bg-night px-6 pt-[144px] pb-[120px] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,.16),transparent_65%)]" />
        {/* orbit lines */}
        <div className="absolute top-[-3px] left-[-455px] hidden size-[974px] rounded-full border border-white/[.06] lg:block" />
        <div className="absolute top-[70px] right-[-580px] hidden size-[1040px] rounded-full border border-dashed border-white/[.07] lg:block" />
        {/* left planet: gold-lit rim on its right side */}
        <div className="absolute top-[160px] left-[-561px] size-[820px] rounded-full opacity-60 md:opacity-100" style={{ background: "radial-gradient(circle at 25% 50%, #161c66 0%, #0f1448 60%, #0b1033 100%)", boxShadow: "inset 0 0 0 2px rgba(243,193,99,.6), inset -26px 0 54px rgba(243,193,99,.55), inset -90px 0 130px rgba(243,193,99,.22), 0 0 90px 10px rgba(243,193,99,.1)" }} />
        {/* lower-left planet: violet */}
        <div className="absolute top-[544px] left-[-435px] hidden size-[830px] rounded-full md:block" style={{ background: "radial-gradient(circle at 45% 25%, #4136b8 0%, #2c2a8a 45%, #1a1c5e 100%)", boxShadow: "inset 0 0 0 2px rgba(150,135,255,.55), inset 0 30px 90px rgba(124,108,255,.35)" }} />
        {/* right planet: violet rim on its left side */}
        <div className="absolute top-[56px] right-[-559px] size-[840px] rounded-full opacity-60 md:opacity-100" style={{ background: "linear-gradient(90deg, #5547d6 0%, #2f2b8c 9%, #1b2068 32%, #121850 62%, #0e1342 100%)", boxShadow: "inset 0 0 0 2px rgba(150,135,255,.5), inset 30px 0 90px rgba(124,108,255,.45), 0 0 120px 20px rgba(99,102,241,.2)" }} />
        {/* glowing dots */}
        <span className="absolute top-[243px] left-[20.9%] hidden size-2 rounded-full bg-[#6d6df0] shadow-[0_0_14px_5px_rgba(109,109,240,.65)] lg:block" />
        <span className="absolute top-[450px] left-[71.6%] hidden size-2 rounded-full bg-[#6d6df0] shadow-[0_0_14px_5px_rgba(109,109,240,.65)] lg:block" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night to-transparent" />
      </div>

      <div className="relative mx-auto text-center">
        <p className="mb-[31px] inline-flex h-[36px] items-center gap-[13px] rounded-full border border-white/[.12] bg-white/[.04] px-[22px] text-[12px] font-semibold tracking-[0.23em] text-white/85 uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />{t.eyebrow}
        </p>
        <h1 className="hero-h1 mx-auto max-w-[1100px] text-[clamp(41.6px,6vw,86.4px)] leading-[1.04] font-bold tracking-[-0.045em]">
          {t.headline1}
          <br />
          <span className="text-gradient-dark">{t.headline2}</span>
        </h1>
        <p className="hero-sub mx-auto mt-[31px] max-w-[560px] text-[18px] leading-[1.6] text-[#b9c1d6] md:text-[20px]">{t.sub}</p>

        <div className="mt-[41px] flex flex-wrap items-center justify-center gap-[20px]">
          <Link href="/start" className="btn-gold btn-hero">{t.cta} <ArrowRight size={18} aria-hidden /></Link>
          <a href="#how-it-works" className="btn-ghost-dark btn-hero">{t.secondary} <ArrowRight size={18} aria-hidden /></a>
        </div>

        <ul className="hero-trust mx-auto mt-[57px] grid max-w-[880px] gap-6 text-left sm:grid-cols-3 sm:divide-x sm:divide-white/10">
          {t.trust.map((item, i) => {
            const Icon = trustIcons[i];
            return (
              <li key={item.title} className="flex items-center gap-[17px] sm:justify-center sm:px-3">
                <span className="grid size-[48px] shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#b7a8ff]"><Icon size={18} aria-hidden /></span>
                <span>
                  <span className="block text-[15px] leading-snug font-medium">{item.title}</span>
                  <span className="mt-1 block text-[11px] tracking-[0.15em] text-[#9aa3bd] uppercase">{item.sub}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
