import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { getReport } from "@/lib/api";

function Delta({ value, suffix = "" }: { value: number; suffix?: string }) {
  const sign = value > 0 ? "+" : "";
  const tone = value > 0 ? "text-success" : value < 0 ? "text-alert" : "text-muted";
  return <span className={`font-mono text-3xl tabular-nums ${tone}`}>{sign}{value}{suffix}</span>;
}

export const metadata: Metadata = { title: "Since last time – Clinix" };

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return <EmptyState text="Your first report is on its way." />;
  const diff = report.diff;
  const claim = (fid: string) => report.findings.find((f) => f.id === fid)?.claim ?? fid;
  const recTitle = (rid: string) => report.recommendations.find((r) => r.id === rid)?.title ?? rid;

  return (
    <>
      <PageHeader title={copy.compare.title} intro={diff ? `${copy.compare.intro} Previous report: ${formatDate(diff.previousGeneratedAt)}.` : copy.compare.intro} />
      {!diff ? (
        <EmptyState text={copy.compare.firstRun} />
      ) : (
        <div className="flex flex-col gap-6">
          <p className="max-w-2xl text-lg leading-relaxed">{diff.summary}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5"><p className="text-sm text-muted">{copy.compare.rating}</p><Delta value={Math.round(diff.ratingDelta * 10) / 10} /></Card>
            <Card className="p-5"><p className="text-sm text-muted">{copy.compare.reviews}</p><Delta value={diff.reviewCountDelta} /></Card>
            <Card className="p-5"><p className="text-sm text-muted">{copy.compare.completed}</p><span className="font-mono text-3xl tabular-nums">{diff.completedRecommendationIds.length}</span></Card>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: copy.compare.completed, items: diff.completedRecommendationIds.map(recTitle) },
              { title: copy.compare.newFindings, items: diff.newFindingIds.map(claim) },
              { title: copy.compare.resolved, items: diff.resolvedFindingIds.map(claim) },
            ].map((col) => (
              <Card key={col.title} className="p-5">
                <h2 className="mb-3 font-semibold">{col.title}</h2>
                {col.items.length ? <ul className="space-y-2 text-sm">{col.items.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="text-sm text-muted">None this time.</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
