import type { Metadata } from "next";
import Link from "next/link";
import type { Recommendation } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { toneForLevel } from "@/lib/format";
import { getReport } from "@/lib/api";

const columns: Recommendation["status"][] = ["todo", "in_progress", "done"];

export const metadata: Metadata = { title: "Action plan – Clinix" };

export default async function ActionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return <EmptyState text="Your first report is on its way." />;

  return (
    <>
      <PageHeader title={copy.actions.title} intro={copy.actions.intro} />
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((status) => {
          const items = report.recommendations.filter((r) => r.status === status);
          return (
            <section key={status} aria-labelledby={`col-${status}`}>
              <h2 id={`col-${status}`} className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold">
                {copy.actions.columns[status]} <span className="font-mono text-xs text-faint">{items.length}</span>
              </h2>
              <div className="flex flex-col gap-3">
                {items.map((r) => (
                  <Card key={r.id} interactive className="p-4">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <Pill tone="primary">{copy.actions.horizon[r.horizon]}</Pill>
                      <Pill tone={toneForLevel(r.impact)}>{copy.actions.impact}: {r.impact}</Pill>
                      <Pill>{copy.actions.effort}: {r.effort}</Pill>
                    </div>
                    <p className="font-medium leading-snug">{r.title}</p>
                    <p className="mt-2 text-sm text-muted">{r.rationale}</p>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-xs font-semibold tracking-wide text-faint uppercase">{copy.actions.firstStep}</dt>
                        <dd>{r.firstStep}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold tracking-wide text-faint uppercase">{copy.actions.expected}</dt>
                        <dd className="text-muted">{r.expectedOutcome}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs text-muted">
                      {copy.actions.basedOn}{" "}
                      {r.findingIds.map((fid, i) => (
                        <Link key={fid} href={`/app/clinics/${id}/findings`} className="font-medium text-primary">
                          {report.findings.find((f) => f.id === fid)?.claim.slice(0, 48) ?? fid}
                          {i < r.findingIds.length - 1 ? ", " : ""}
                        </Link>
                      ))}
                    </p>
                  </Card>
                ))}
                {items.length === 0 && <EmptyState text="Nothing here yet." />}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
