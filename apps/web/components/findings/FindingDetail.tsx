import Link from "next/link";
import { DISCIPLINE_LABELS, type Finding, type Report, type Review } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { Pill } from "@/components/ui/Pill";
import { copy, fill } from "@/lib/copy";
import { toneForFinding, toneForLevel } from "@/lib/format";

export function FindingDetail({
  finding,
  report,
  reviews,
  sourceName,
  competitorName,
}: {
  finding: Finding;
  report: Report;
  reviews: Review[];
  sourceName: string;
  competitorName: (id: string | null) => string;
}) {
  const byId = new Map(reviews.map((r) => [r.id, r]));
  const linked = report.recommendations.filter((r) => r.findingIds.includes(finding.id));

  return (
    <Card className="p-6" aria-live="polite">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill tone={toneForFinding(finding)}>{copy.findings.kind[finding.kind]}</Pill>
        <Pill tone={finding.confidence === "confirmed" ? "success" : "neutral"}>{copy.findings.confidence[finding.confidence]}</Pill>
        <Pill>{fill(copy.findings.lens, { discipline: DISCIPLINE_LABELS[finding.discipline] })}</Pill>
        {finding.status === "rejected" && <Pill tone="warning">Set aside</Pill>}
      </div>
      <h2 className="text-xl font-semibold leading-snug tracking-tight">{finding.claim}</h2>
      <p className="mt-1 text-sm text-muted">{finding.competitorPlaceId === null ? copy.findings.aboutYou : sourceName}</p>

      {finding.status === "rejected" && finding.rejectionReason && (
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">{copy.findings.rejection[finding.rejectionReason]}</p>
      )}

      <section className="mt-6">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">{copy.findings.whyItMatters}</h3>
        <p className="leading-relaxed">{finding.whyItMatters}</p>
      </section>

      <section className="mt-6">
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">{copy.findings.evidence}</h3>
        <div className="grid gap-3">
          {finding.evidence.map((e) => {
            const review = byId.get(e.reviewId);
            return review ? <EvidenceCard key={e.reviewId} review={review} quote={e.quote} sourceName={competitorName(report.competitors.some((c) => c.placeId === review.placeId) ? review.placeId : null)} /> : null;
          })}
        </div>
      </section>

      {linked.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">{copy.findings.action}</h3>
          <div className="grid gap-3">
            {linked.map((r) => (
              <div key={r.id} className="rounded-xl border border-primary/20 bg-primary-soft/40 p-4">
                <p className="font-medium">{r.title}</p>
                <p className="mt-1 text-sm text-muted">{r.firstStep}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone={toneForLevel(r.impact)}>{copy.actions.impact}: {r.impact}</Pill>
                  <Pill>{copy.actions.effort}: {r.effort}</Pill>
                  <Pill tone="primary">{copy.actions.horizon[r.horizon]}</Pill>
                </div>
                <Link href={`/app/clinics/${report.clinicId}/actions`} className="mt-3 inline-flex min-h-9 items-center text-sm font-medium text-primary">
                  {copy.dashboard.seeActionPlan}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </Card>
  );
}
