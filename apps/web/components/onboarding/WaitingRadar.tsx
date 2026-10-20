"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { AnalysisStage } from "@clinix/contracts";

const LINES: Record<AnalysisStage, string[]> = {
  quick_scan: [
    "Matching your name and address to your Google listing…",
    "Reading your rating, review count, hours and photos…",
    "Opening your website and listing the services you offer…",
    "Counting clinics within 5 km that offer the same services…",
    "Checking whether anything measurable stands out…",
  ],
  discovery: [
    "Searching within 2 km for clinics offering your services…",
    "Widening to 5 km, then 15 km…",
    "Dropping hospitals, pharmacies and unrelated businesses…",
    "Keeping clinics of your discipline, closest first…",
    "Scoring each one: would a patient pick them instead of you?",
    "Writing a one-line reason for every candidate…",
  ],
  deep: [
    "Collecting recent patient reviews for you and each competitor…",
    "Removing reviewer names and photos…",
    "Reading reviews through your discipline's guide…",
    "Checking every quote against the review it came from…",
    "Setting aside findings with fewer than two reviews behind them…",
    "Measuring your scorecard against the competitors you chose…",
    "Writing your ranked action plan…",
  ],
};

/**
 * Something to look at while a stage runs: a radar of the search rings around the clinic,
 * and a rotating line saying what is being checked. Descriptive, never a fake progress bar.
 */
export function WaitingRadar({ stage, clinicName, compact = false }: { stage: AnalysisStage; clinicName?: string; compact?: boolean }) {
  const lines = LINES[stage];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), 3200);
    return () => clearInterval(id);
  }, [lines.length]);

  const rings = stage === "discovery" ? ["2 km", "5 km", "15 km"] : ["", "", ""];
  return (
    <div className={clsx("flex flex-col items-center gap-5 sm:flex-row", compact ? "sm:gap-5" : "sm:gap-8")} data-testid="waiting-radar">
      {!compact && <div className="relative size-44 shrink-0" aria-hidden>
        {[0, 1, 2].map((r) => (
          <span
            key={r}
            className={clsx("absolute rounded-full border border-primary/30", stage === "discovery" && "motion-safe:animate-[ping_3s_ease-out_infinite]")}
            style={{ inset: `${(2 - r) * 28}px`, animationDelay: `${r * 1}s`, opacity: 0.9 - r * 0.2 }}
          />
        ))}
        {[0, 1, 2].map((r) => (
          <span key={`s${r}`} className="absolute rounded-full border border-dashed border-line" style={{ inset: `${(2 - r) * 28}px` }}>
            {rings[r] && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-card px-1 font-mono text-[10px] text-faint">{rings[r]}</span>}
          </span>
        ))}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-white shadow-[0_0_0_8px_rgba(67,56,202,.12)]">
            <span className="size-3 rounded-full bg-white" />
          </span>
        </span>
        {stage === "discovery" &&
          [
            [22, 34], [70, 18], [120, 40], [150, 96], [110, 140], [40, 128],
          ].map(([x, y], k) => (
            <span key={k} className="absolute size-2.5 rounded-full bg-[#f5b942] shadow motion-safe:animate-pulse" style={{ left: x, top: y, animationDelay: `${k * 0.4}s` }} />
          ))}
      </div>}
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">Right now</p>
        <p key={i} className="mt-1 text-base font-medium motion-safe:animate-[fadeIn_.5s_ease-out]" aria-live="polite">{lines[i]}</p>
        {clinicName && <p className="mt-2 text-sm text-muted">Everything we find is measured against {clinicName}.</p>}
      </div>
    </div>
  );
}
