"use client";

import clsx from "clsx";
import { Reveal } from "@/components/landing/Reveal";
import { StepCard } from "@/components/landing/StepCard";
import { useLang, useLanding } from "@/components/i18n/LangProvider";

/** Where each step sits on the wide layout: card above or below the wave, and the offset that puts its node on the line. */
const placement = [
  { above: true, offset: "xl:bottom-[357px] xl:left-[20%]" },
  { above: false, offset: "xl:top-[315px] xl:left-[40%]" },
  { above: true, offset: "xl:bottom-[357px] xl:left-[60%]" },
  { above: false, offset: "xl:top-[311px] xl:left-[80%]" },
];

/** Four steps on a wave. Cards 1 and 3 sit above it, 2 and 4 below; nodes sit at 20/40/60/80% of the width. Under xl they stack beside a vertical line. */
export function HowItWorks() {
  const t = useLanding().how;
  const sp = useLang().lang === "zh" ? "" : " ";
  return (
    <section id="how-it-works" className="relative scroll-mt-24 overflow-hidden bg-white py-[clamp(4.5rem,7vw,6.5rem)]" aria-labelledby="how-title">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 size-[520px] rounded-full bg-[#eef0fc] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-[8%] size-[640px] rounded-full bg-[#faf1de] blur-3xl" />
      <div className="relative mx-auto w-[min(1240px,100%-3rem)]">
        <p className="text-center text-xs font-bold tracking-[0.3em] text-[#4f46e5] uppercase">{t.eyebrow}</p>
        <h2 id="how-title" className="mt-4 text-center text-[clamp(2.1rem,4vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.045em]">
          {t.headline1}{sp}<span className="bg-gradient-to-r from-[#4f46e5] to-[#7c5cf5] bg-clip-text text-transparent">{t.headline2}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-ink-grey">{t.sub}</p>
      </div>

      <div className="relative mt-16 xl:h-[650px]">
        <svg aria-hidden viewBox="0 0 1000 650" preserveAspectRatio="none" className="absolute inset-0 hidden h-full w-full xl:block">
          <defs>
            <linearGradient id="how-wave" gradientUnits="userSpaceOnUse" x1="0" x2="1000" y1="0" y2="0">
              <stop offset="0" stopColor="#a9b8f2" stopOpacity=".5" />
              <stop offset="0.2" stopColor="#5b5cf0" />
              <stop offset="0.4" stopColor="#4f46e5" />
              <stop offset="0.58" stopColor="#3b82f6" />
              <stop offset="0.8" stopColor="#6366f1" />
              <stop offset="1" stopColor="#c026d3" />
            </linearGradient>
          </defs>
          <path d="M0,259 C45,259 65,322 110,322 C150,322 160,271 200,271 C260,271 340,337 400,337 C460,337 540,271 600,271 C660,271 740,333 800,333 C860,333 900,260 956,260" fill="none" stroke="url(#how-wave)" strokeWidth="3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span aria-hidden className="absolute top-[253px] left-[95.6%] hidden size-[14px] -translate-x-1/2 rounded-full bg-[#c026d3] shadow-[0_0_0_11px_rgba(192,38,211,.14),0_0_20px_4px_rgba(192,38,211,.35)] xl:block" />

        <ol className="relative mx-auto grid w-[min(1240px,100%-3rem)] gap-8 pl-14 xl:static xl:block xl:w-full xl:gap-0 xl:pl-0">
          <span aria-hidden className="absolute top-0 bottom-0 left-5 w-0.5 bg-gradient-to-b from-gold via-[#4f46e5] to-[#7c5cf5] xl:hidden" />
          {t.steps.map((s, i) => {
            const p = placement[i];
            return (
              <Reveal as="li" key={s.title} delay={i * 80} className={clsx("relative flex flex-col xl:absolute xl:w-[398px] xl:-translate-x-1/2 xl:items-center", p.offset, !p.above && "xl:flex-col-reverse")}>
                <div className="w-full"><StepCard index={i} /></div>
                <span aria-hidden className="hidden h-[35px] border-l border-dashed border-[#c9cfe0] xl:block" />
                <span className={clsx("absolute -left-14 top-3 z-10 grid size-11 place-items-center rounded-full text-[16px] font-bold xl:static xl:size-11", i === 0 ? "bg-gold text-night shadow-[0_0_0_8px_rgba(245,185,66,.22)]" : "bg-gradient-to-br from-[#5b5cf0] to-[#4338ca] text-white shadow-[0_0_0_8px_rgba(79,70,229,.17)]")}>0{i + 1}</span>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
