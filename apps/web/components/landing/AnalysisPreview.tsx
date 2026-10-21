"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Info, Link2, Star, TrendingUp, Users } from "lucide-react";
import { Chip, type ChipTone } from "@/components/landing/Chip";
import { useLanding } from "@/components/i18n/LangProvider";

const tileIcons = [Users, BarChart3, TrendingUp, Star];
const itemIcons = [Star, Link2, Users];
const barColors = ["from-[#7c7cf8] to-[#5b5cf0]", "from-[#a78bfa] to-[#8b7bff]", "from-[#5b5cf0] to-[#4338ca]", "from-[#a78bfa] to-[#7c6cff]"];

/** "Real analysis. Not a sales call." with a sample market-overview card. The numbers are an illustration, labelled as such. */
export function AnalysisPreview() {
  const t = useLanding().features;
  const c = t.card;
  return (
    <section id="features" className="relative scroll-mt-24 overflow-hidden bg-[#f7f8fc] py-[clamp(4.5rem,7vw,6.5rem)]">
      <div aria-hidden className="pointer-events-none absolute -left-72 -top-40 size-[640px] rounded-full border border-[#e3e6f2]" />
      <div aria-hidden className="pointer-events-none absolute -right-64 top-1/3 size-[720px] rounded-full border border-[#e3e6f2]" />
      <div aria-hidden className="pointer-events-none absolute -right-40 top-24 size-[480px] rounded-full bg-[#6d5cf5]/15 blur-3xl" />
      <div className="relative mx-auto grid w-[min(1320px,100%-3rem)] items-center gap-12 xl:grid-cols-[0.8fr_1.2fr] xl:gap-16">
        <div>
          <p className="inline-flex rounded-full bg-[#ecebff] px-4 py-1.5 text-xs font-bold tracking-[0.24em] text-primary uppercase">{t.eyebrow}</p>
          <h2 className="mt-6 text-[clamp(2.4rem,4.6vw,4rem)] font-bold leading-[1.05] tracking-[-0.045em]">
            {t.headline1}
            <br />
            <span className="text-gradient-light">{t.headline2}</span>
          </h2>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-grey md:text-[19px]">{t.text}</p>
          <ol className="relative mt-9 space-y-8">
            <span aria-hidden className="absolute top-6 bottom-6 left-[21px] border-l border-dashed border-[#b6bdea]" />
            {t.steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-4">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#4f46e5] to-[#3b82f6] text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,.6)]">{i + 1}</span>
                <span>
                  <span className="block text-lg font-bold">{s.title}</span>
                  <span className="mt-1 block text-[15px] text-ink-grey">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link href="/demo" className="inline-flex h-14 items-center gap-2 rounded-xl bg-gold px-7 font-bold text-night shadow-[0_14px_40px_-16px_rgba(243,193,99,.9)] hover:bg-gold-hover">{t.cta}</Link>
            <Link href="/app/clinics/clinic_demo/findings" className="inline-flex items-center gap-1.5 font-semibold text-primary">{t.sample} <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </div>

        <div className="rounded-[26px] border border-[#e6e8f2] bg-white/90 p-5 shadow-[0_34px_80px_-36px_rgba(76,70,180,.4)] md:p-8" data-testid="market-overview">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">{c.title}</h3>
              <p className="mt-1 text-sm text-ink-grey">{c.sub}</p>
            </div>
            <span className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-grey">{c.badge}</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {c.tiles.map((x, i) => {
              const Icon = tileIcons[i];
              return (
                <div key={x.label} className="flex flex-col rounded-[20px] border border-[#eceef5] p-4">
                  <div className="flex items-start gap-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full ${i === 3 ? "bg-[#fff1d9] text-[#e9a23b]" : "bg-[#eee9ff] text-[#5b5cf0]"}`}><Icon size={17} aria-hidden /></span>
                    <span>
                      <span className="block text-[22px] leading-none font-bold text-[#101a3f]">{x.value}</span>
                      <span className="mt-1 block text-xs text-ink-grey">{x.label}</span>
                    </span>
                  </div>
                  <span className="mt-3"><Chip tone={x.tone as ChipTone}>{x.note}</Chip></span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[#eceef5] p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 font-bold">{c.position} <Info size={13} className="text-faint" aria-hidden /></p>
                <span className="rounded-full bg-[#eee9ff] px-3 py-1 text-xs font-bold text-primary">{c.rank}</span>
              </div>
              <ul className="mt-5 space-y-4">
                {c.dimensions.map((d, i) => (
                  <li key={d.label} className="grid grid-cols-[1fr_auto_1.5rem] items-center gap-3 text-sm">
                    <span className="text-ink-grey">{d.label}</span>
                    <span className="h-2 w-28 overflow-hidden rounded-full bg-[#eef0f6]"><span className={`block h-full rounded-full bg-gradient-to-r ${barColors[i]}`} style={{ width: `${d.score}%` }} /></span>
                    <span className="text-right font-semibold tabular-nums">{d.score}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[20px] border border-[#eceef5] p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 font-bold">{c.opportunities} <Info size={13} className="text-faint" aria-hidden /></p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">{c.seeAll} <ArrowRight size={14} aria-hidden /></span>
              </div>
              <ul className="mt-4 space-y-4">
                {c.items.map((x, i) => {
                  const Icon = itemIcons[i];
                  return (
                    <li key={x.title} className="flex gap-3">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${i === 0 ? "bg-[#fff1d9] text-[#e9a23b]" : "bg-[#eee9ff] text-[#5b5cf0]"}`}><Icon size={16} aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-[15px] font-bold leading-snug">{x.title}</span>
                          <Chip tone={x.tone as ChipTone}>{x.level}</Chip>
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-grey">{x.text}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
