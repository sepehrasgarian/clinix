"use client";

import clsx from "clsx";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { useLang, useLanding } from "@/components/i18n/LangProvider";
import { money, monthlyPrice, planOrder, whole, yearlyPerMonth, yearlyPrice } from "@/lib/pricing";


/** Monthly / Annual switch and the three plan cards. Annual is the default and shows the per-month price. */
export function PricingPlans() {
  const t = useLanding().pricingPage;
  const { locale } = useLang();
  const [annual, setAnnual] = useState(true);
  return (
    <>
      <div className="mt-10 flex flex-col items-center gap-3">
        <div role="group" aria-label="Billing period" className="inline-flex rounded-full border border-line bg-white p-1 shadow-sm">
          <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)} className={clsx("rounded-full px-5 py-2 text-sm font-semibold transition-colors", !annual ? "bg-[#0e1526] text-white" : "text-ink-grey")}>{t.monthly}</button>
          <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)} className={clsx("flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors", annual ? "bg-[#0e1526] text-white" : "text-ink-grey")}>
            {t.annual}<span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-night">{t.twoFree}</span>
          </button>
        </div>
        <p className="text-xs text-ink-grey">{t.currency}</p>
      </div>

      <div className="mt-12 grid items-start gap-6 lg:grid-cols-3 lg:gap-7">
        {t.plans.map((p, i) => {
          const id = planOrder[i];
          const featured = i === 1;
          return (
            <div key={p.name} className={clsx("relative flex flex-col rounded-[24px] p-8", featured ? "bg-gradient-to-br from-[#2b2f86] to-[#1e2160] text-white shadow-[0_34px_70px_-30px_rgba(43,47,134,.7)] lg:-mt-3 lg:pb-11" : "border border-[#e6e8f2] bg-white shadow-[0_22px_50px_-36px_rgba(76,70,180,.4)]")}>
              {featured && <span className="mb-4 inline-flex w-fit rounded-full bg-gold px-3 py-1 text-xs font-bold text-night">{t.popular}</span>}
              <h2 className={clsx("text-2xl font-bold", !featured && "mt-8")}>{p.name}</h2>
              <p className={clsx("mt-2 min-h-[2.6rem] text-sm", featured ? "text-white/70" : "text-ink-grey")}>{p.tagline}</p>
              <p className="mt-6 text-[44px] leading-none font-extrabold tracking-[-0.04em]">{annual ? money(yearlyPerMonth(id), locale) : whole(monthlyPrice[id], locale)}<span className={clsx("ml-1 text-sm font-normal tracking-normal", featured ? "text-white/70" : "text-ink-grey")}>{t.perMonth}</span></p>
              <p className={clsx("mt-3 text-xs", featured ? "text-white/60" : "text-ink-grey")}>{annual ? `${whole(yearlyPrice(id), locale)} ${t.billedYearly}` : t.billedMonthly}</p>
              <ul className={clsx("mt-6 flex-1 space-y-3 border-t pt-6", featured ? "border-white/15" : "border-[#ecedf5]")}>
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm"><span className={clsx("mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full", featured ? "bg-gold text-night" : "bg-[#eee9ff] text-[#4f46e5]")}><Check size={11} strokeWidth={3} aria-hidden /></span>{f}</li>
                ))}
              </ul>
              <Link href="/start" className={clsx("mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold", featured ? "bg-gold text-night hover:bg-gold-hover" : "border border-ink text-ink hover:bg-surface")}>{t.cta} <ArrowRight size={15} aria-hidden /></Link>
            </div>
          );
        })}
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-ink-grey">{t.note}</p>
    </>
  );
}
