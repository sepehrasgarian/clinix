"use client";

import { ArrowRight, Info, PersonStanding, Smile, Bone } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/landing/Reveal";
import { useLang, useLanding } from "@/components/i18n/LangProvider";

const looks = [
  { icon: PersonStanding, tile: "bg-[#eee9ff] text-[#7c5cf5]", chip: "bg-[#eee9ff] text-[#6d4ae0]", num: "bg-[#eee9ff] text-[#6d4ae0]" },
  { icon: Smile, tile: "bg-[#fff1d9] text-[#e9a23b]", chip: "bg-[#fff1d9] text-[#b7791f]", num: "bg-[#fff1d9] text-[#b7791f]" },
  { icon: Bone, tile: "bg-[#e4eeff] text-[#2f6fe0]", chip: "bg-[#e4eeff] text-[#2f6fe0]", num: "bg-[#e4eeff] text-[#2f6fe0]" },
];

/** Three illustrative scenarios. Every card says so, and none of them is presented as a client result. */
export function CaseSnapshots() {
  const t = useLanding().cases;
  const sp = useLang().lang === "zh" ? "" : " ";
  return (
    <section className="relative border-t border-[#ecedf5] bg-[#fafbfe] pt-[clamp(4.5rem,7vw,6.5rem)] pb-[clamp(4.5rem,7vw,6.5rem)]">
      <div className="mx-auto w-[min(1320px,100%-3rem)]">
        <p className="text-center text-xs font-bold tracking-[0.3em] text-[#7c5cf5] uppercase">{t.eyebrow}</p>
        <h2 className="mt-4 text-center text-[clamp(2.1rem,4vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.045em]">
          {t.headline1}{sp}<span className="bg-gradient-to-r from-[#a78bfa] via-[#7c5cf5] to-[#4f46e5] bg-clip-text text-transparent">{t.headline2}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-ink-grey">{t.sub}</p>
        <p className="mx-auto mt-4 flex max-w-2xl items-center justify-center gap-2 text-center text-[13px] text-[#8a93aa]"><Info size={14} className="shrink-0 text-[#7c5cf5]" aria-hidden />{t.note}</p>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {t.items.map((x, i) => {
            const look = looks[i];
            const Icon = look.icon;
            return (
              <Reveal key={x.kind} delay={i * 70} className="flex flex-col rounded-3xl border border-[#ecedf5] bg-white p-6 shadow-[0_22px_50px_-40px_rgba(76,70,180,.4)]">
                <div className="flex items-center gap-3">
                  <span className={`grid size-14 shrink-0 place-items-center rounded-full ${look.tile}`}><Icon size={22} aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold tracking-[0.08em] uppercase">{x.kind}</p>
                    <p className="text-sm text-ink-grey">{x.place}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${look.chip}`}>{x.chip}</span>
                </div>
                <h3 className="mt-6 min-h-[3.2rem] text-xl leading-snug font-bold">{x.title}</h3>
                <div className="mt-5 rounded-3xl border border-[#ecedf5] bg-[#fafafe] p-5">
                  <p className="text-xs text-faint">{t.metricLabel}</p>
                  <p className="mt-1 text-[42px] leading-none font-extrabold tracking-[-0.04em] text-[#101a3f]">{x.metric}</p>
                  <p className="mt-2 text-sm text-ink-grey">{x.metricText}</p>
                </div>
                <p className="mt-6 text-xs font-bold tracking-[0.2em] text-faint uppercase">{t.keyActions}</p>
                <ol className="mt-3 space-y-3">
                  {x.actions.map((a, n) => (
                    <li key={a} className="flex items-center gap-3 text-[15px]"><span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${look.num}`}>{n + 1}</span>{a}</li>
                  ))}
                </ol>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-10 text-center"><Link href="/app/clinics/clinic_demo/findings" className="inline-flex items-center gap-1.5 font-semibold text-primary">{t.sample} <ArrowRight size={16} aria-hidden /></Link></p>
      </div>
    </section>
  );
}
