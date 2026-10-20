import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Report } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";

function Change({ value, suffix = "" }: { value: number; suffix?: string }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone = value > 0 ? "text-success" : value < 0 ? "text-alert" : "text-muted";
  return <span className={`inline-flex items-center gap-1 font-mono text-2xl font-semibold tabular-nums ${tone}`}><Icon size={20} aria-hidden />{value > 0 ? "+" : ""}{value}{suffix}</span>;
}

/** 02 Month over month: the four change tiles, or a calm empty state on the first report. */
export function MonthOverMonth({ report }: { report: Report }) {
  const d = report.diff;
  if (!d) return <Card className="p-6 text-sm text-muted">Trends appear after your next analysis. This is your first report, and the next one will be compared against it.</Card>;
  const claim = (id: string) => report.findings.find((f) => f.id === id)?.claim ?? id;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Compared with the report of {formatDate(d.previousGeneratedAt)}.</p>
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted">Google rating</p><Change value={Math.round(d.ratingDelta * 10) / 10} /></Card>
        <Card className="p-4"><p className="text-xs text-muted">New reviews</p><Change value={d.reviewCountDelta} /></Card>
        <Card className="p-4"><p className="text-xs text-muted">Actions completed</p><span className="font-mono text-2xl font-semibold tabular-nums">{d.completedRecommendationIds.length}</span></Card>
        <Card className="p-4"><p className="text-xs text-muted">New findings</p><span className="font-mono text-2xl font-semibold tabular-nums">{d.newFindingIds.length}</span></Card>
      </div>
      <Card className="p-5 text-sm">
        <p>{d.summary}</p>
        {d.newFindingIds.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">{d.newFindingIds.map((id) => <li key={id}>{claim(id)}</li>)}</ul>}
      </Card>
    </div>
  );
}
