"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { DISCIPLINE_LABELS, type Recommendation, type Report } from "@clinix/contracts";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { Pill } from "@/components/ui/Pill";
import { toneForLevel } from "@/lib/format";
import { competitorName, findingsFor, horizonGroups, rankedActions } from "@/lib/report";
import { ActionCheck } from "./ActionCheck";

/** The plan as a list: this week, this month, this quarter. A row is a tick, a title, tags and "How to do it". */
export function ActionPlan({ report, clinicId, analysisId, clinicName, onOpen }: { report: Report; clinicId: string; analysisId: string; clinicName: string; onOpen?: (rec: Recommendation, index: number) => void }) {
  const ordered = rankedActions(report);
  const sections = [...report.disciplines.flatMap((d) => d.recommendations), ...ordered];
  const all = [...new Map(sections.map((r) => [r.id, r])).values()];
  const done = all.filter((r) => r.status === "done").length;
  const numberOf = new Map(all.map((r, i) => [r.id, i + 1]));

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">{done} of {all.length} actions done</p>
      {horizonGroups.map((g) => {
        const rows = all.filter((r) => r.horizon === g.key);
        if (rows.length === 0) return null;
        return (
          <section key={g.key} aria-labelledby={`h-${g.key}`}>
            <h3 id={`h-${g.key}`} className="mb-2 flex items-baseline gap-2 font-semibold">{g.label} <span className="font-mono text-xs text-faint">{rows.length} actions</span></h3>
            <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-card">
              {rows.map((r) => (
                <ActionRow key={r.id} report={report} rec={r} index={numberOf.get(r.id)!} clinicId={clinicId} analysisId={analysisId} clinicName={clinicName} onOpen={onOpen} />
              ))}
            </ul>
          </section>
        );
      })}
      {all.length === 0 && <p className="text-sm text-muted">This report has no recommendations.</p>}
    </div>
  );
}

function ActionRow({ report, rec, index, clinicId, analysisId, clinicName, onOpen }: { report: Report; rec: Recommendation; index: number; clinicId: string; analysisId: string; clinicName: string; onOpen?: (rec: Recommendation, index: number) => void }) {
  const [open, setOpen] = useState(false);
  const isDone = rec.status === "done";
  const findings = findingsFor(report, rec);
  const reviews = new Map(report.reviews.map((r) => [r.id, r]));
  return (
    <li className={clsx("p-4", isDone && "bg-surface/60")}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5"><ActionCheck clinicId={clinicId} analysisId={analysisId} recommendation={rec} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono text-xs text-faint">{index}</span>
            <button type="button" onClick={() => onOpen?.(rec, index)} className={clsx("text-left font-medium leading-snug hover:text-primary", isDone && "text-muted line-through")}>
              {isDone && <span className="sr-only">Done: </span>}{rec.title}
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Pill tone={toneForLevel(rec.impact)}>{rec.impact} impact</Pill>
            <Pill>{rec.effort} effort</Pill>
            <Pill tone="neutral">{rec.disciplines.length === 1 ? DISCIPLINE_LABELS[rec.disciplines[0]] : "Whole clinic"}</Pill>
          </div>
          <p className="mt-2 text-sm text-muted"><span className="font-medium text-ink">Start here:</span> {rec.firstStep}</p>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-primary">
            How to do it <ChevronDown size={14} aria-hidden className={clsx("transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <div className="mt-2 space-y-3 rounded-xl border border-line bg-surface/60 p-4 text-sm">
              <p><span className="font-semibold">Why:</span> {rec.rationale}</p>
              <p><span className="font-semibold">What should change:</span> {rec.expectedOutcome}</p>
              {findings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-wide text-faint uppercase">Evidence</p>
                  <div className="mt-2 space-y-2">
                    {findings.map((f) => (
                      <div key={f.id}>
                        <p className="font-medium">{f.claim} <span className="font-normal text-muted">· {competitorName(report, f.competitorPlaceId, clinicName)}</span></p>
                        {f.evidence.slice(0, 2).map((e) => {
                          const r = reviews.get(e.reviewId);
                          return r ? <div key={e.reviewId} className="mt-2"><EvidenceCard review={r} quote={e.quote} sourceName={competitorName(report, report.competitors.some((c) => c.placeId === r.placeId) ? r.placeId : null, clinicName)} /></div> : null;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
