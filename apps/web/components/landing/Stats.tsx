"use client";

import clsx from "clsx";
import { BarChart3, MessageCircle, UserPlus, Users } from "lucide-react";
import { useLang, useLanding } from "@/components/i18n/LangProvider";
import { CountUp } from "@/components/landing/CountUp";
import { Reveal } from "@/components/landing/Reveal";

const icons = [BarChart3, Users, MessageCircle, UserPlus];
const barHeights = [14, 20, 29, 36, 44, 53, 63, 78];
const barColors = ["#e2dcfd", "#d6cffc", "#cbc2fb", "#bfb4f9", "#af9ff6", "#9482f0", "#7563e8", "#5848dc"];
const label = "text-[12px] text-[#6b7487]";

/** The small picture at the bottom of each card. All four share one 78px band so the labels line up across the row. */
function Illustration({ index }: { index: number }) {
  const l = useLanding().stats.illustrations;
  if (index === 0) {
    return (
      <div>
        <div className="flex h-[78px] items-end justify-between" aria-hidden>
          {barHeights.map((h, i) => <span key={h} className="w-[18px] rounded-full" style={{ height: h, background: barColors[i] }} />)}
        </div>
        <div className={clsx("mt-3 flex justify-between", label)}><span>{l.low}</span><span className="font-medium text-[#4338ca]">{l.high}</span></div>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div>
        <div className="flex h-[78px] items-center" aria-hidden>
          <span className="-ml-1.5 grid size-[60px] shrink-0 place-items-center rounded-full bg-[#eceaff]"><span className="size-[15px] rounded-full bg-[#4f46e5]" /></span>
          <span className="mx-1 w-[30px] border-t-2 border-dashed border-[#dcdeea]" />
          <span className="flex flex-1 justify-between">{[0, 1, 2, 3].map((n) => <span key={n} className="grid size-[39px] place-items-center rounded-full bg-[#fde6e6]"><span className="size-[9px] rounded-full bg-[#f26d6d]" /></span>)}</span>
        </div>
        <div className={clsx("relative mt-3 h-[18px]", label)}><span className="absolute left-[9%] -translate-x-1/2 font-medium text-ink">{l.you}</span><span className="absolute left-[59%] -translate-x-1/2">{l.competitors}</span></div>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div>
        <div className="relative h-[78px]" aria-hidden>
          <span className="absolute top-1/2 right-0 left-0 h-0.5 -translate-y-1/2 rounded-full bg-[#e6e8f2]" />
          <span className="absolute top-1/2 left-0 h-1.5 w-[45%] -translate-y-1/2 rounded-full bg-[#5b4de0]" />
          <span className="absolute top-[8px] bottom-[8px] left-[45%] border-l border-dashed border-[#8a93aa]" />
          {[9, 21, 39].map((x) => <span key={x} className="absolute top-1/2 size-[17px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4f46e5] ring-[3px] ring-[#cfcaf8]" style={{ left: `${x}%` }} />)}
          {[61, 77, 93].map((x) => <span key={x} className="absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d3d6e5]" style={{ left: `${x}%` }} />)}
        </div>
        <div className={clsx("relative mt-3 flex justify-between", label)}><span className="font-medium text-[#4338ca]">{l.recent}</span><span className="absolute left-[45%] -translate-x-1/2">{l.months}</span><span>{l.older}</span></div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex h-[78px] items-center justify-between" aria-hidden>
        {[0, 1, 2, 3, 4].map((n) => n === 2
          ? <span key={n} className="grid size-[68px] place-items-center rounded-full bg-[#fff0d6] text-[#e9902a]"><UserPlus size={28} strokeWidth={1.6} /></span>
          : <span key={n} className="grid size-[39px] place-items-center rounded-full bg-[#f1f2f8] text-[#b3b9d1]"><Users size={17} strokeWidth={1.6} /></span>)}
      </div>
      <p className={clsx("mt-3 text-center font-medium !text-[#b7791f]", label)}>{l.every}</p>
    </div>
  );
}

/** Four industry figures with a small picture each. Footnoted as published research, not a promise. */
export function Stats() {
  const t = useLanding().stats;
  const sp = useLang().lang === "zh" ? "" : " ";
  return (
    <section id="numbers" className="relative scroll-mt-24 overflow-hidden border-t border-[#ecedf5] bg-[#fafbfe] pt-[clamp(4.5rem,7vw,6.5rem)] pb-[clamp(3rem,5vw,4.5rem)]">
      <div aria-hidden className="pointer-events-none absolute -left-[460px] top-[-40px] hidden size-[900px] rounded-full border border-[#e6e9f4] md:block" />
      <div aria-hidden className="pointer-events-none absolute -right-[420px] top-[-60px] hidden size-[900px] rounded-full border border-[#e6e9f4] md:block" />
      <div aria-hidden className="pointer-events-none absolute -left-60 bottom-0 size-[520px] rounded-full bg-[#faf1de]/70 blur-3xl" />
      <span aria-hidden className="absolute top-[102px] left-[12.4%] hidden size-3 rounded-full bg-[#2f6df0] shadow-[0_0_14px_3px_rgba(47,109,240,.35)] md:block" />
      <span aria-hidden className="absolute top-[104px] left-[83.9%] hidden size-3 rounded-full bg-[#8b7bff] shadow-[0_0_14px_3px_rgba(139,123,255,.35)] md:block" />
      <div className="relative mx-auto w-[min(1320px,100%-3rem)]">
        <p className="text-center text-[12px] font-bold tracking-[0.3em] text-[#3730a3] uppercase">{t.eyebrow}</p>
        <h2 className="mt-4 text-center text-[clamp(34px,4vw,58px)] leading-[1.05] font-bold tracking-[-0.045em]">
          {t.headline1}{sp}<span className="bg-gradient-to-r from-[#e9a23b] via-[#c06bc0] to-[#5b5cf0] bg-clip-text text-transparent">{t.highlight}</span>{sp}{t.headline2}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-[19px] text-ink-grey">{t.sub}</p>
        <div className="mt-14 grid gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
          {t.items.map((x, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={x.title} delay={i * 70} className="flex min-h-[378px] flex-col rounded-[24px] border border-[#ecedf5] bg-white p-[24px] shadow-[0_14px_40px_-32px_rgba(76,70,180,.35)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_26px_60px_-32px_rgba(76,70,180,.45)]">
                <div className="flex items-center gap-[17px]">
                  <span className={clsx("grid size-[55px] shrink-0 place-items-center rounded-full", i % 2 ? "bg-[#fff1dd] text-[#e9902a]" : "bg-[#eeeaff] text-[#4f46e5]")}><Icon size={22} strokeWidth={1.7} aria-hidden /></span>
                  <h3 className="text-[18px] leading-tight font-bold tracking-[-0.01em]">{x.title}</h3>
                </div>
                <p className="mt-[29px] text-[52px] leading-none font-extrabold tracking-[-0.05em] text-[#101a3f]"><CountUp value={x.value} prefix={"prefix" in x ? x.prefix : ""} suffix={"suffix" in x ? x.suffix : ""} /></p>
                <p className="mt-4 text-[15.5px] leading-[1.5] text-ink-grey">{x.text}</p>
                <div className="mt-auto pt-6"><Illustration index={i} /></div>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-8 text-center text-[12px] text-[#8a93aa]">{t.footnote}</p>
      </div>
    </section>
  );
}
