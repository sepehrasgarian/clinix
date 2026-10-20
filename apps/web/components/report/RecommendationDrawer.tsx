"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DISCIPLINE_LABELS, type Recommendation, type Report } from "@clinix/contracts";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { Pill } from "@/components/ui/Pill";
import { copy } from "@/lib/copy";
import { toneForLevel } from "@/lib/format";
import { competitorName, findingsFor } from "@/lib/report";

/** The detail of one recommendation: why, how to start, what should change, and the evidence behind it. */
export function RecommendationDrawer({ report, rec, index, clinicName, onClose }: { report: Report; rec: Recommendation; index: number; clinicName: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const findings = findingsFor(report, rec);
  const reviews = new Map(report.reviews.map((r) => [r.id, r]));
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/25" role="dialog" aria-modal="true" aria-labelledby="rec-title" onClick={onClose}>
      <div className="flex h-full w-full max-w-xl flex-col bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-line p-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Recommendation #{index}</p>
            <h2 id="rec-title" className="mt-1 text-lg font-semibold leading-snug">{rec.title}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="primary">{copy.actions.horizon[rec.horizon]}</Pill>
              <Pill tone={toneForLevel(rec.impact)}>{copy.actions.impact}: {rec.impact}</Pill>
              <Pill>{copy.actions.effort}: {rec.effort}</Pill>
              <Pill>{rec.disciplines.length === 1 ? DISCIPLINE_LABELS[rec.disciplines[0]] : "Whole clinic"}</Pill>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-lg hover:bg-surface"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-faint uppercase">Why it matters</h3>
            <p className="mt-1 leading-relaxed">{rec.rationale}</p>
          </section>
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-faint uppercase">How to start</h3>
            <p className="mt-1 leading-relaxed">{rec.firstStep}</p>
          </section>
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-faint uppercase">What should change</h3>
            <p className="mt-1 leading-relaxed">{rec.expectedOutcome}</p>
          </section>
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-faint uppercase">Supporting evidence</h3>
            <div className="mt-2 space-y-4">
              {findings.map((f) => (
                <div key={f.id} className="rounded-xl border border-line p-3">
                  <p className="text-sm font-medium">{f.claim}</p>
                  <p className="text-xs text-muted">{competitorName(report, f.competitorPlaceId, clinicName)} · {copy.findings.confidence[f.confidence]}</p>
                  <div className="mt-2 space-y-2">
                    {f.evidence.slice(0, 3).map((e) => {
                      const r = reviews.get(e.reviewId);
                      return r ? <EvidenceCard key={e.reviewId} review={r} quote={e.quote} sourceName={competitorName(report, report.competitors.some((c) => c.placeId === r.placeId) ? r.placeId : null, clinicName)} /> : null;
                    })}
                  </div>
                </div>
              ))}
              {findings.length === 0 && <p className="text-sm text-muted">No finding is linked to this action.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
