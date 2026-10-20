import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { copy } from "@/lib/copy";
import { formatKm, toneForLevel } from "@/lib/format";
import { ActionStatus } from "@/components/report/ActionStatus";
import { EmptyReport } from "@/components/report/EmptyReport";
import { getInProgress, getLatestReport, listClinics } from "@/lib/api";

const impactRank = { high: 3, medium: 2, low: 1 } as const;
const effortRank = { low: 3, medium: 2, high: 1 } as const;

export const metadata: Metadata = { title: "Dashboard – ClinX" };

export default async function DashboardPage() {
  const [clinic] = await listClinics();
  const latest = await getLatestReport(clinic.id);
  if (!latest) {
    return (
      <>
        <PageHeader title={copy.dashboard.title} />
        <EmptyReport clinicId={clinic.id} inProgress={await getInProgress(clinic.id)} />
      </>
    );
  }
  const { report, analysis } = latest;

  const nextMoves = [...report.recommendations]
    .filter((r) => r.status !== "done")
    .sort((a, b) => impactRank[b.impact] + effortRank[b.effort] - (impactRank[a.impact] + effortRank[a.effort]))
    .slice(0, 3);
  const base = `/app/clinics/${clinic.id}`;

  return (
    <>
      <PageHeader title={copy.dashboard.title} intro={report.summary} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-semibold">{copy.dashboard.scorecard}</h2>
            <span className="font-mono text-3xl tabular-nums">{report.scorecard.overall}</span>
          </div>
          <p className="mb-6 text-sm text-muted">{report.scorecard.summary}</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {report.scorecard.dimensions.map((d) => (
              <ScoreBar key={d.key} score={d.score} label={d.label} summary={d.summary} />
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">{copy.dashboard.nextMoves}</h2>
            <ol className="space-y-4">
              {nextMoves.map((r, i) => (
                <li key={r.id} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft font-mono text-sm text-primary">{i + 1}</span>
                  <div>
                    <p className="font-medium leading-snug">{r.title}</p>
                    <div className="mt-1 flex gap-2">
                      <Pill tone={toneForLevel(r.impact)}>{copy.actions.impact}: {r.impact}</Pill>
                      <Pill>{copy.actions.effort}: {r.effort}</Pill>
                    </div>
                    <ActionStatus clinicId={clinic.id} analysisId={analysis.id} recommendation={r} compact />
                  </div>
                </li>
              ))}
            </ol>
            <Link href={`${base}/actions`} className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary">
              {copy.dashboard.seeActionPlan} <ArrowRight size={16} aria-hidden />
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-semibold">{copy.dashboard.competitorsNearby}</h2>
            <ul className="divide-y divide-line">
              {report.competitors.map((c) => (
                <li key={c.placeId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-muted">{formatKm(c.distanceKm)} {copy.competitors.distance}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted tabular-nums">{c.rating?.toFixed(1)} · {c.reviewCount}</span>
                </li>
              ))}
            </ul>
            <Link href={`${base}/findings`} className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary">
              {copy.dashboard.seeAllFindings} <ArrowRight size={16} aria-hidden />
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
