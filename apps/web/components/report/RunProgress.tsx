"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check, Clock, Loader2, RotateCw, X } from "lucide-react";
import type { Analysis, PhaseProgress } from "@clinix/contracts";
import { copy } from "@/lib/copy";

const card = "rounded-[22px] border border-[#ecedf5] bg-white shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]";
type Status = "done" | "running" | "failed" | "pending";

/** Seconds as "48s" or "1m 12s". Only called with real timestamps from the run. */
function span(from?: string, to?: string, now = Date.now()): string | null {
  if (!from) return null;
  const s = Math.max(0, Math.round(((to ? new Date(to).getTime() : now) - new Date(from).getTime()) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

/**
 * The four stages of the deep analysis as the run reports them. When the run has stopped, nothing shows as running: the stage
 * that was in progress (or the next one) is marked stopped, and the way forward is one Try again.
 */
export function RunProgress({ analysis, base, onRetry, retrying, retryError }: { analysis: Analysis; base: string; onRetry: () => void; retrying: boolean; retryError: string | null }) {
  const t = copy.onboarding.run;
  const stopped = analysis.status === "failed";
  const live = analysis.status === "queued" || analysis.status === "running";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

  const rows = t.stages.map((stage) => ({ stage, progress: analysis.phases.find((p) => p.phase === stage.phase) as PhaseProgress | undefined }));
  const raw = (p?: PhaseProgress): Status => (p?.status === "done" || p?.status === "skipped" ? "done" : p?.status === "running" ? "running" : p?.status === "failed" ? "failed" : "pending");
  // On a stopped run, the failed stage — or the one that was running, or the next — is where it stopped.
  const stopIndex = stopped ? Math.max(0, rows.findIndex((r) => raw(r.progress) === "failed" || raw(r.progress) === "running") >= 0 ? rows.findIndex((r) => raw(r.progress) === "failed" || raw(r.progress) === "running") : rows.findIndex((r) => raw(r.progress) === "pending")) : -1;
  const statusAt = (i: number): Status => (stopped && i === stopIndex ? "failed" : stopped && raw(rows[i].progress) === "running" ? "pending" : raw(rows[i].progress));
  const done = rows.filter((_, i) => statusAt(i) === "done").length;
  const currentIndex = stopped ? stopIndex : Math.max(0, rows.findIndex((r) => raw(r.progress) === "running") >= 0 ? rows.findIndex((r) => raw(r.progress) === "running") : rows.findIndex((r) => raw(r.progress) === "pending"));
  const current = rows[currentIndex] ?? rows[rows.length - 1];
  const startedAt = analysis.phases.find((p) => p.startedAt)?.startedAt;
  const circ = 2 * Math.PI * 15.5;
  const pill = stopped ? { text: "Stopped", cls: "bg-alert-soft text-alert" } : analysis.status === "queued" ? { text: "Waiting to start", cls: "bg-[#f1f2f7] text-ink-grey" } : { text: "In progress", cls: "bg-[#eeefff] text-primary" };

  return (
    <>
      <section className={clsx(card, "p-[24px]")} aria-labelledby="current-step">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative grid size-[132px] shrink-0 place-items-center" role="img" aria-label={`${done} of ${rows.length} ${t.stepsDone}`}>
            <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#eceef6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={stopped ? "#b9bdd3" : "url(#ring)"} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(done / rows.length) * circ} ${circ}`} className="transition-[stroke-dasharray] duration-700 motion-reduce:transition-none" />
              <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4338ca" /><stop offset="1" stopColor="#7c6cf5" /></linearGradient></defs>
            </svg>
            <div className="text-center" aria-hidden><p className="text-[26px] leading-none font-bold tabular-nums">{done} of {rows.length}</p><p className="mt-1 text-[12px] text-ink-grey">{t.stepsDone}</p></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[12px] font-semibold tracking-[0.14em] text-ink-grey uppercase">{stopped ? t.stoppedAt : t.currentStep}</p>
              <span className={clsx("rounded-full px-2.5 py-0.5 text-[12px] font-semibold", pill.cls)}>{pill.text}</span>
            </div>
            <h2 id="current-step" className="mt-1.5 text-[22px] leading-tight font-bold">{current.stage.title}</h2>
            {stopped ? (
              <>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-grey">{analysis.error ?? "This step stopped before it finished."}</p>
                {retryError && <p role="alert" className="mt-2 text-[13px] font-medium text-alert">{retryError}</p>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={onRetry} disabled={retrying} className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#4338ca] to-[#5b5cf0] px-6 text-[14px] font-semibold text-white disabled:opacity-50"><RotateCw size={15} aria-hidden className={retrying ? "animate-spin motion-reduce:animate-none" : ""} />{retrying ? "Retrying…" : copy.onboarding.scanning.retry}</button>
                  <Link href={base} className="inline-flex h-11 items-center rounded-full border border-[#dfe2f1] bg-white px-6 text-[14px] font-semibold hover:border-primary/40">{t.backToDashboard}</Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-grey">{current.stage.now}</p>
                <p className="mt-3 flex items-center gap-2 text-[13.5px] text-ink-grey"><Clock size={15} aria-hidden />{analysis.status === "queued" ? t.queued : startedAt ? `${t.running} Running for ${span(startedAt, undefined, now)}.` : t.running}</p>
              </>
            )}
          </div>
        </div>
      </section>
      <section className={clsx(card, "p-[24px]")} aria-label="Stages">
        <ol aria-live="polite">
          {rows.map(({ stage, progress }, i) => {
            const status = statusAt(i);
            const last = i === rows.length - 1;
            const time = status === "done" ? span(progress?.startedAt, progress?.finishedAt) : status === "running" ? span(progress?.startedAt, undefined, now) : null;
            return (
              <li key={stage.phase} className="relative flex gap-4 pb-5 last:pb-0">
                {!last && <span aria-hidden className={clsx("absolute top-10 bottom-0 left-[17px] w-0.5", status === "done" ? "bg-[#22a06b]" : "bg-[#e3e6f2]")} />}
                <span className={clsx("relative z-10 mt-1 grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors motion-reduce:transition-none", status === "done" ? "bg-[#22a06b] text-white" : status === "running" ? "bg-primary text-white ring-[6px] ring-primary/15" : status === "failed" ? "bg-alert text-white" : "border border-[#d9dce8] bg-white text-ink-grey")} aria-hidden>
                  {status === "done" ? <Check size={16} strokeWidth={3} /> : status === "running" ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> : status === "failed" ? <X size={16} /> : i + 1}
                </span>
                <div className={clsx("min-w-0 flex-1 rounded-2xl px-4 py-3", status === "running" && "bg-[#f6f6ff]", status === "failed" && "bg-alert-soft/60")}>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <h3 className={clsx("text-[15px] font-bold", status === "pending" && "text-ink-grey")}><span className="mr-2 text-[12px] font-semibold text-faint tabular-nums">{String(i + 1).padStart(2, "0")}</span>{stage.title}</h3>
                    <span className="flex items-center gap-2 text-[12.5px]">
                      <span className={clsx("rounded-full px-2.5 py-0.5 font-semibold", status === "done" ? "bg-[#e6f7ee] text-[#16875a]" : status === "running" ? "bg-[#eeefff] text-primary" : status === "failed" ? "bg-alert-soft text-alert" : "bg-[#f1f2f7] text-ink-grey")}>{status === "done" ? "Completed" : status === "running" ? "In progress" : status === "failed" ? "Stopped" : "Pending"}</span>
                      {time && <span className="text-faint tabular-nums">{time}</span>}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-ink-grey">{status === "failed" ? (progress?.error ?? analysis.error ?? stage.text) : stage.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
