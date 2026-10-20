import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DisciplineBadge } from "@/components/ui/DisciplineBadge";
import { Pill } from "@/components/ui/Pill";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stars } from "@/components/ui/Stars";
import { copy } from "@/lib/copy";
import { formatKm } from "@/lib/format";
import { EmptyReport } from "@/components/report/EmptyReport";
import { getInProgress, getLatestReport } from "@/lib/api";

export const metadata: Metadata = { title: "Competitors – ClinX" };

export default async function CompetitorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const latest = await getLatestReport(id);
  if (!latest) return <EmptyReport clinicId={id} inProgress={await getInProgress(id)} />;
  const { report } = latest;

  return (
    <>
      <PageHeader title={copy.competitors.title} intro={copy.competitors.intro} />
      <div className="grid gap-4 md:grid-cols-2">
        {report.competitors.map((c) => {
          const findings = report.findings.filter((f) => f.competitorPlaceId === c.placeId && f.status === "kept");
          return (
            <Card key={c.placeId} interactive className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{c.name}</h2>
                  <p className="text-sm text-muted">{formatKm(c.distanceKm)} {copy.competitors.distance}</p>
                </div>
                {c.rating !== undefined && (
                  <div className="text-right">
                    <Stars rating={c.rating} />
                    <p className="font-mono text-xs text-muted tabular-nums">{c.rating.toFixed(1)} · {c.reviewCount} {copy.common.reviews}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.disciplines.map((d) => <DisciplineBadge key={d} discipline={d} />)}
                <Pill tone="primary">{c.reviewsAnalyzed} {copy.competitors.reviewsAnalyzed}</Pill>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {findings.map((f) => (
                  <li key={f.id}>
                    <Link href={`/app/clinics/${id}/findings`} className="hover:text-primary">{f.claim}</Link>
                  </li>
                ))}
                {findings.length === 0 && <li className="text-muted">No findings yet.</li>}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
