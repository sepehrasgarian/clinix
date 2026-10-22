"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BarChart3, ClipboardList, Layers, ShieldCheck, CircleCheck } from "lucide-react";
import type { Analysis, Clinic } from "@clinix/contracts";
import { retryAnalysis } from "@/lib/api";
import { copy } from "@/lib/copy";
import { RunCompetitors } from "./RunCompetitors";
import { RunProgress } from "./RunProgress";

const card = "rounded-[22px] border border-[#ecedf5] bg-white shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]";
const getIcons = [ShieldCheck, BarChart3, ClipboardList, Layers];

/** The page after "Start my first analysis": the real state of the run, who is read, what comes out, and the way to the report. */
export function RunView({ clinic, analysis, onRefresh }: { clinic: Clinic; analysis: Analysis; onRefresh: () => void }) {
  const t = copy.onboarding.run;
  const done = analysis.status === "succeeded";
  const failed = analysis.status === "failed";
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const chosen = analysis.discovery?.candidates.filter((c) => analysis.discovery!.selectedPlaceIds.includes(c.place.placeId)) ?? [];
  const base = `/app/clinics/${clinic.id}`;

  const retry = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      await retryAnalysis(clinic.id, analysis.id);
      onRefresh();
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : "We couldn't retry just now.");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={base} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#e3e6f2] bg-white px-[18px] text-sm font-semibold shadow-sm hover:border-primary/40"><ArrowLeft size={16} aria-hidden />{t.backToDashboard}</Link>
        <h1 className="mt-5 text-[clamp(30px,3.4vw,42px)] leading-[1.08] font-bold tracking-[-0.04em]">
          {done ? t.readyTitle : failed ? t.stoppedTitle : <>{t.titleStart}<span className="bg-gradient-to-r from-[#4338ca] to-[#7c6cf5] bg-clip-text text-transparent">{t.titleAccent}</span></>}
        </h1>
        <p className="mt-3 max-w-[640px] text-[16px] leading-relaxed text-ink-grey">{done ? t.readyText : failed ? t.stoppedText : t.intro}</p>
      </div>

      {done && (
        <section className="flex flex-wrap items-center gap-4 rounded-[22px] border border-[#cfeedd] bg-[#f3fbf7] p-[22px]" aria-label="Analysis ready">
          <span className="grid size-11 place-items-center rounded-full bg-[#22a06b] text-white" aria-hidden><CircleCheck size={22} /></span>
          <p className="min-w-[200px] flex-1 text-[15px] font-medium">Every finding in it is backed by reviews we checked word for word.</p>
          <Link href={`${base}/findings`} className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#4338ca] to-[#5b5cf0] px-7 text-[15px] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(67,56,202,.8)]">{t.open} <span aria-hidden>→</span></Link>
          <Link href={base} className="inline-flex h-12 items-center rounded-[12px] border border-[#dfe2f1] bg-white px-6 text-[15px] font-semibold hover:border-primary/40">{t.dashboard}</Link>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.85fr_1fr]">
        <div className="flex flex-col gap-6">{!done && <RunProgress analysis={analysis} base={base} onRetry={retry} retrying={retrying} retryError={retryError} />}</div>
        <RunCompetitors competitors={chosen} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.85fr_1fr]">
        <section className={`${card} p-[22px]`} aria-labelledby="get-title">
          <h2 id="get-title" className="text-[17px] font-bold">{t.getTitle}</h2>
          <p className="mt-0.5 text-[13px] text-ink-grey">{t.getText}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {t.gets.map((g, i) => { const Icon = getIcons[i]; return (
              <li key={g.title} className="rounded-2xl border border-[#ecedf5] p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#eeefff] text-primary" aria-hidden><Icon size={17} /></span><h3 className="mt-3 text-[14px] font-bold">{g.title}</h3><p className="mt-1 text-[12.5px] leading-snug text-ink-grey">{g.text}</p></li>
            ); })}
          </ul>
        </section>
        {!done && !failed && (
          <section className={`${card} p-[22px]`} aria-labelledby="notify-title">
            <div className="flex items-start gap-3.5"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eeefff] text-primary" aria-hidden><Bell size={17} /></span><div><h2 id="notify-title" className="text-[16px] font-bold">{t.notifyTitle}</h2><p className="mt-1 text-[13px] leading-snug text-ink-grey">{t.notifyText}</p></div></div>
          </section>
        )}
      </div>
    </div>
  );
}
