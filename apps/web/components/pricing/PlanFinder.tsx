"use client";

import clsx from "clsx";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Building2 } from "lucide-react";
import { useState } from "react";
import { useLang, useLanding } from "@/components/i18n/LangProvider";
import { money, monthlyPrice, recommendPlan, whole, yearlyPerMonth, yearlyPrice, type FinderAnswers, type FinderKey } from "@/lib/pricing";


/** Four questions, one plan. Picking an option moves on; finished steps in the list can be reopened. */
export function PlanFinder() {
  const t = useLanding().pricingPage;
  const f = t.finder;
  const { locale, lang } = useLang();
  const [answers, setAnswers] = useState<FinderAnswers>({});
  const [step, setStep] = useState(0);
  const done = step >= f.questions.length;
  const q = f.questions[Math.min(step, f.questions.length - 1)];

  const choose = (index: number) => { setAnswers((a) => ({ ...a, [q.key as FinderKey]: index })); setStep((s) => s + 1); };
  const restart = () => { setAnswers({}); setStep(0); };
  const { plan, extras } = recommendPlan(answers);
  const planCopy = t.plans[["essential", "growth", "scale"].indexOf(plan)];

  return (
    <section id="plan-finder" className="mx-auto w-[min(1100px,100%-3rem)] rounded-[28px] border border-[#ecedf5] bg-gradient-to-br from-white to-[#fffaf1] p-6 shadow-[0_30px_70px_-45px_rgba(76,70,180,.35)] md:p-10" aria-labelledby="finder-title">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-[#4f46e5] uppercase">{f.eyebrow}</p>
          <h2 id="finder-title" className="mt-5 text-[clamp(2rem,3.4vw,2.8rem)] font-bold leading-[1.08] tracking-[-0.04em]">{f.headline1}{lang === "zh" ? "" : " "}<span className="text-[#5b4bdb]">{f.headline2}</span></h2>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-grey">{f.text}</p>
          <ol className="mt-8 space-y-2">
            {f.steps.map((label, i) => {
              const reachable = i <= step || i < Object.keys(answers).length;
              const current = i === step && !done;
              return (
                <li key={label}>
                  <button type="button" disabled={!reachable} onClick={() => setStep(i)} aria-current={current ? "step" : undefined} className={clsx("flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors", current ? "border-[#b6b1f5] bg-white shadow-sm" : "border-transparent", !reachable && "text-faint")}>
                    <span className={clsx("grid size-7 place-items-center rounded-full text-xs font-bold", current ? "border border-[#8b7bff] bg-[#eee9ff] text-primary" : i < step ? "bg-success text-white" : "bg-[#f1f2f7] text-faint")}>{i < step ? <Check size={13} strokeWidth={3} aria-label="answered" /> : i + 1}</span>{label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-3xl border border-[#ecedf5] bg-white p-6 md:p-8" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#eef0f4]" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.min(step, 4)}><div className="h-full rounded-full bg-[#5b5cf0] transition-all" style={{ width: `${(Math.min(step, 4) / 4) * 100}%` }} /></div>
          {!done ? (
            <>
              <p className="mt-6 text-xs text-ink-grey">{f.questionOf.replace("{n}", String(step + 1))}</p>
              <h3 className="mt-2 text-[22px] leading-snug font-bold tracking-[-0.02em]">{q.title}</h3>
              <p className="mt-2 text-sm text-ink-grey">{q.help}</p>
              <div role="radiogroup" aria-label={q.title} className="mt-6 grid gap-3 sm:grid-cols-2">
                {q.options.map((o, i) => {
                  const selected = answers[q.key as FinderKey] === i;
                  return (
                    <button key={o.label} type="button" role="radio" aria-checked={selected} onClick={() => choose(i)} className={clsx("flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:border-[#b6b1f5]", selected ? "border-[#5b5cf0] bg-[#f7f6ff]" : "border-[#e6e8f2]")}>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eee9ff] text-[#5b5cf0]"><Building2 size={17} aria-hidden /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{o.label}</span><span className="block text-xs text-ink-grey">{o.sub}</span></span>
                      <span aria-hidden className={clsx("grid size-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-[#5b5cf0]" : "border-[#c9cedd]")}>{selected && <span className="size-2.5 rounded-full bg-[#5b5cf0]" />}</span>
                    </button>
                  );
                })}
              </div>
              {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"><ArrowLeft size={14} aria-hidden />{f.back}</button>}
            </>
          ) : (
            <div className="mt-6">
              <p className="text-xs font-bold tracking-[0.2em] text-faint uppercase">{f.result.title}</p>
              <h3 className="mt-2 text-3xl font-bold tracking-[-0.03em]">{planCopy.name}</h3>
              <p className="mt-1 text-sm text-ink-grey">{planCopy.tagline}</p>
              <p className="mt-5 text-4xl font-extrabold tracking-[-0.04em]">{money(yearlyPerMonth(plan), locale)}<span className="ml-1 text-sm font-normal text-ink-grey">{t.perMonth}</span></p>
              <p className="mt-1 text-xs text-ink-grey">{whole(yearlyPrice(plan), locale)} {f.result.billed} · {f.result.orMonthly.replace("{price}", whole(monthlyPrice[plan], locale))}</p>
              <p className="mt-6 text-xs font-bold tracking-[0.2em] text-faint uppercase">{f.result.why}</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {f.questions.map((qq) => <li key={qq.key} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden /><span><span className="text-ink-grey">{f.steps[f.questions.indexOf(qq)]}: </span>{qq.options[answers[qq.key as FinderKey] ?? 0].label}</span></li>)}
              </ul>
              {extras && <p className="mt-4 rounded-xl bg-[#fff7ed] p-3 text-xs text-[#b45309]">{f.result.extras}</p>}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link href={extras ? "/demo" : "/start"} className="btn-gold !h-12 text-sm">{extras ? f.result.ctaExtras : f.result.cta} <ArrowRight size={15} aria-hidden /></Link>
                <button type="button" onClick={restart} className="text-sm font-semibold text-primary">{f.restart}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

