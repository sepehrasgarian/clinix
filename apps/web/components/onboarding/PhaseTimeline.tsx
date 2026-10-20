"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Check, Loader2, X } from "lucide-react";
import { PHASE_LABELS, type PhaseProgress } from "@clinix/contracts";

const DETAIL: Record<PhaseProgress["phase"], string> = {
  validate: "Checking the name, address and disciplines you gave us.",
  enrich: "Matching your clinic to its Google listing: rating, reviews, hours, photos.",
  understand: "Reading your website to list the services you actually offer.",
  discover: "Searching within 2, 5 and 15 km for clinics that compete for the same patients.",
  reviews: "Collecting recent patient reviews for you and each chosen competitor.",
  websites: "Reading each competitor's website: services, team, booking, hours, offers.",
  mine: "Looking for patterns, and checking every quote against the reviews it came from.",
  synthesize: "Writing your ranked action plan from the verified findings.",
};

function elapsed(from?: string, to?: string): string | null {
  if (!from) return null;
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  return ms < 1000 ? "<1s" : `${Math.round(ms / 1000)}s`;
}

/** A vertical timeline of the real phase states, with what each phase is doing and how long it took. */
export function PhaseTimeline({ phases }: { phases: PhaseProgress[] }) {
  const [, tick] = useState(0);
  const running = phases.some((p) => p.status === "running");
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const done = phases.filter((p) => p.status === "done").length;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={phases.length} aria-label="Steps completed">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(done / phases.length) * 100}%` }} />
        </div>
        <span className="font-mono text-xs text-muted tabular-nums">{done}/{phases.length}</span>
      </div>
      <ol className="relative space-y-0" aria-live="polite">
        {phases.map((p, i) => {
          const last = i === phases.length - 1;
          return (
            <li key={p.phase} className="relative flex gap-4 pb-6">
              {!last && <span aria-hidden className={clsx("absolute top-8 left-[15px] h-[calc(100%-1rem)] w-0.5", p.status === "done" ? "bg-success" : "bg-line")} />}
              <span
                className={clsx(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2",
                  p.status === "done" && "border-success bg-success text-white",
                  p.status === "running" && "border-primary bg-primary text-white shadow-[0_0_0_6px_rgba(67,56,202,.15)]",
                  p.status === "failed" && "border-alert bg-alert text-white",
                  (p.status === "pending" || p.status === "skipped") && "border-line bg-card text-faint",
                )}
                aria-label={p.status}
              >
                {p.status === "done" && <Check size={14} aria-hidden />}
                {p.status === "running" && <Loader2 size={14} aria-hidden className="animate-spin" />}
                {p.status === "failed" && <X size={14} aria-hidden />}
                {(p.status === "pending" || p.status === "skipped") && <span className="font-mono text-[11px]">{i + 1}</span>}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={clsx("font-semibold", p.status === "pending" && "text-muted")}>{PHASE_LABELS[p.phase]}</p>
                  {(p.status === "running" || p.status === "done") && <span className="font-mono text-xs text-faint tabular-nums">{elapsed(p.startedAt, p.finishedAt)}</span>}
                </div>
                <p className={clsx("mt-0.5 text-sm", p.status === "running" ? "text-ink" : "text-muted")}>{p.error ?? DETAIL[p.phase]}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
