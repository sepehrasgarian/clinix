"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Building2, Check, FileText, SlidersHorizontal, Star, User } from "lucide-react";
import clsx from "clsx";
import { Reveal } from "@/components/landing/Reveal";
import { useLang, useLanding } from "@/components/i18n/LangProvider";
import { money, monthlyPrice, whole, yearlyPerMonth, yearlyPrice, planOrder } from "@/lib/pricing";

const planIcons = [User, BarChart3, Building2];

/** Three plans. Annual is ten months of the monthly price, shown as the per-month starting price. */
export function Pricing() {
  const t = useLanding().pricing;
  const { locale, lang } = useLang();
  const sp = lang === "zh" ? "" : " ";
  return (
    <section id="pricing" className="relative scroll-mt-24 overflow-hidden border-t border-[#ecedf5] bg-[#fafbfe] py-[clamp(4.5rem,7vw,6.5rem)]">
      <div aria-hidden className="pointer-events-none absolute -left-72 top-0 size-[640px] rounded-full border border-[#e3e6f2]" />
      <div aria-hidden className="pointer-events-none absolute -right-72 top-16 size-[640px] rounded-full border border-[#f1e6d2]" />
      <span aria-hidden className="absolute top-[130px] left-[12%] hidden size-3 rounded-full bg-[#5b5cf0] lg:block" />
      <span aria-hidden className="absolute top-[170px] right-[14%] hidden size-3 rounded-full bg-[#f3b94a] lg:block" />
      <div className="relative mx-auto w-[min(1240px,100%-3rem)]">
        <p className="text-center text-xs font-bold tracking-[0.3em] text-[#3730a3] uppercase">{t.eyebrow}</p>
        <h2 className="mt-4 text-center text-[clamp(2.1rem,4vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.045em]">
          {t.headline1}{sp}<span className="bg-gradient-to-r from-[#f3b94a] via-[#e39aa0] to-[#a07cf0] bg-clip-text text-transparent">{t.highlight}</span>{sp}{t.headline2}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-ink-grey">{t.sub}</p>

        <div className="mt-14 grid items-center gap-6 lg:grid-cols-3 lg:gap-7">
          {t.plans.map((p, i) => {
            const Icon = planIcons[i];
            const featured = i === 1;
            const yearly = yearlyPrice(planOrder[i]);
            return (
              <Reveal key={p.name} delay={i * 70} className={clsx("relative flex flex-col rounded-[28px] p-7", featured ? "bg-gradient-to-br from-[#2b2f86] to-[#1e2160] text-white shadow-[0_34px_70px_-30px_rgba(43,47,134,.7)] lg:-my-3 lg:py-10" : "border border-[#e6e8f2] bg-white shadow-[0_22px_50px_-36px_rgba(76,70,180,.4)]")}>
                {featured && <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-night"><Star size={12} aria-hidden />{t.popular}</span>}
                <div className="flex items-start gap-4">
                  <span className={clsx("grid size-[52px] shrink-0 place-items-center rounded-2xl", featured ? "bg-[#5b5cf0] text-white" : "bg-[#eee9ff] text-[#4f46e5]")}><Icon size={22} aria-hidden /></span>
                  <div>
                    <h3 className="text-[22px] font-bold">{p.name}</h3>
                    <p className={clsx("mt-1 max-w-[14rem] text-[15px]", featured ? "text-white/75" : "text-ink-grey")}>{p.tagline}</p>
                  </div>
                </div>
                <div className={clsx("mt-6 border-t pt-6", featured ? "border-white/15" : "border-[#ecedf5]")}>
                  <p className={clsx("text-[11px] font-bold tracking-[0.2em] uppercase", featured ? "text-white/60" : "text-faint")}>{t.startingAt}</p>
                  <p className="mt-2 text-[44px] leading-none font-extrabold tracking-[-0.04em]">{money(yearlyPerMonth(planOrder[i]), locale)}<span className={clsx("ml-1 text-base font-normal tracking-normal", featured ? "text-white/70" : "text-ink-grey")}>{t.perMonth}</span></p>
                  <p className={clsx("mt-3 text-[13.5px]", featured ? "text-white/65" : "text-ink-grey")}>{t.billing.replace("{0}", whole(yearly, locale)).replace("{1}", whole(monthlyPrice[planOrder[i]], locale))}</p>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[15px]">
                      <span className={clsx("grid size-5 shrink-0 place-items-center rounded-full", featured ? "bg-gold text-night" : "bg-[#eee9ff] text-[#4f46e5]")}><Check size={12} strokeWidth={3} aria-hidden /></span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" className={clsx("mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full font-bold", featured ? "bg-gold text-night hover:bg-gold-hover" : "border border-ink text-ink hover:bg-surface")}>{t.details} <ArrowRight size={16} aria-hidden /></Link>
              </Reveal>
            );
          })}
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-6 border-t border-[#ecedf5] pt-10 sm:grid-cols-2 sm:divide-x sm:divide-[#ecedf5]">
          {t.perks.map((x, i) => (
            <div key={x.title} className="flex items-center gap-4 sm:px-6">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#eee9ff] text-[#4f46e5]">{i === 0 ? <SlidersHorizontal size={20} aria-hidden /> : <FileText size={20} aria-hidden />}</span>
              <div><p className="font-bold">{x.title}</p><p className="text-sm text-ink-grey">{x.text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
