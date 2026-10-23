"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Loader2, RotateCw, TriangleAlert } from "lucide-react";
import type { Clinic } from "@clinix/contracts";
import { retryAnalysis } from "@/lib/api";
import { copy } from "@/lib/copy";
import { currentStage, stageRows, type Completed, type HeroState } from "@/lib/dashboard";
import { panel } from "./panel";
import { StageSteps } from "./StageSteps";

const primary = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";
const secondary = "inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe2f1] bg-white px-5 text-sm font-semibold hover:border-primary/40";

/** A compact module for a run that is under way, waiting for the owner, or has stopped. Nothing here shows for a finished run. */
export function AnalysisStatus({ clinic, hero, latest }: { clinic: Clinic; hero: Exclude<HeroState, { kind: "none" | "completed" }>; latest: Completed | null }) {
  const t = copy.dashboard.hero;
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/app/clinics/${clinic.id}`;

  if (hero.kind === "setup") {
    return (
      <section className={`${panel} flex flex-wrap items-center justify-between gap-4 p-5`} aria-labelledby="status-title">
        <div><h2 id="status-title" className="text-[17px] font-bold">{t.setupTitle}</h2><p className="mt-1 text-[14px] text-muted">{t.setupText}</p></div>
        <Link href="/start" className={primary}>{t.setupAction}</Link>
      </section>
    );
  }

  const rows = stageRows(hero.analysis);
  const done = rows.filter((r) => r.status === "done").length;
  const stage = currentStage(rows);

  const retry = async () => {
    setRetrying(true);
    setError(null);
    try {
      await retryAnalysis(clinic.id, hero.analysis.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.retryFailed);
    } finally {
      setRetrying(false);
    }
  };

  if (hero.kind === "failed") {
    return (
      <section className={`${panel} p-5 sm:p-6`} aria-labelledby="status-title">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-soft text-warning" aria-hidden><TriangleAlert size={17} /></span>
          <div className="min-w-0">
            <h2 id="status-title" className="text-[17px] font-bold">{t.failedTitle}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">{hero.analysis.error ?? t.failedText}</p>
            {stage && <p className="mt-1 text-[13px] text-muted">{t.stoppedAt}: <span className="font-semibold text-ink">{stage.title}</span></p>}
          </div>
        </div>
        <div className="mt-4"><StageSteps rows={rows} /></div>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-alert">{error}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={retry} disabled={retrying} className={primary}>
            <RotateCw size={15} aria-hidden className={retrying ? "animate-spin motion-reduce:animate-none" : ""} />{retrying ? t.retrying : t.retry}
          </button>
          <Link href="/contact" className={secondary}>{t.support}</Link>
        </div>
        {latest && <p className="mt-3 text-[13px] text-muted">{t.previousReport}</p>}
      </section>
    );
  }

  return (
    <section className={`${panel} p-5 sm:p-6`} aria-labelledby="status-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="status-title" className="text-[17px] font-bold">{hero.queued ? t.queued : t.processing}</h2>
        <span className="text-[13px] font-medium text-muted tabular-nums">{done} of {rows.length} {t.steps}</span>
      </div>
      <div role="progressbar" aria-label={t.processing} aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={done} className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eceef6]">
        <div className="h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${(done / rows.length) * 100}%` }} />
      </div>
      {stage?.now && !hero.queued && <p className="mt-3 flex items-center gap-2 text-[14px] text-muted"><Loader2 size={14} aria-hidden className="animate-spin motion-reduce:animate-none" />{stage.now}</p>}
      <div className="mt-4"><StageSteps rows={rows} /></div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-[#eef0f7] pt-4">
        <p className="flex items-start gap-2 text-[13.5px] text-muted"><Clock size={15} aria-hidden className="mt-0.5 shrink-0" /><span><span className="font-semibold text-ink">{t.background}</span> {t.backgroundText}</span></p>
        <Link href={`${base}/run/${hero.analysis.id}`} className={secondary}>{t.details}</Link>
      </div>
    </section>
  );
}
