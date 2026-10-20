"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { DISCIPLINE_LABELS, type Finding, type Report, type Review } from "@clinix/contracts";
import { DisciplineBadge } from "@/components/ui/DisciplineBadge";
import { LedgerCounter } from "@/components/ui/LedgerCounter";
import { Dot, Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { toneForFinding } from "@/lib/format";
import { FindingDetail } from "./FindingDetail";

export function FindingsExplorer({ report, reviews, clinicName }: { report: Report; reviews: Review[]; clinicName: string }) {
  const [showRejected, setShowRejected] = useState(false);
  const [competitor, setCompetitor] = useState<string | "all">("all");
  const kept = report.findings.filter((f) => f.status === "kept");
  const [selectedId, setSelectedId] = useState<string | null>(kept[0]?.id ?? null);

  const competitorName = (id: string | null) => (id === null ? clinicName : report.competitors.find((c) => c.placeId === id)?.name ?? "Competitor");

  const visible = useMemo(
    () => report.findings.filter((f) => (showRejected || f.status === "kept") && (competitor === "all" || f.competitorPlaceId === competitor)),
    [report.findings, showRejected, competitor],
  );
  const selected = visible.find((f) => f.id === selectedId) ?? visible[0] ?? null;

  const byDiscipline = useMemo(() => {
    const groups = new Map<string, Finding[]>();
    for (const f of visible) groups.set(f.discipline, [...(groups.get(f.discipline) ?? []), f]);
    return [...groups.entries()];
  }, [visible]);

  return (
    <div className="flex flex-col gap-4">
      <LedgerCounter ledger={report.ledger} showRejected={showRejected} onToggle={() => setShowRejected((v) => !v)} />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by competitor">
        {[{ id: "all" as const, name: copy.findings.filterAll }, { id: null, name: clinicName }, ...report.competitors.map((c) => ({ id: c.placeId, name: c.name }))].map((c) => {
          const value = c.id === null ? "own" : c.id;
          const active = competitor === "all" ? c.id === "all" : competitor === c.id;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setCompetitor(c.id === "all" ? "all" : (c.id as string | null) ?? "all")}
              aria-pressed={active}
              className={clsx("min-h-9 rounded-full border px-3 text-sm", active ? "border-primary bg-primary-soft text-primary" : "border-line bg-card text-muted hover:text-ink")}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState text={copy.findings.empty} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,2fr)_3fr]">
          <nav aria-label="Findings" className="flex flex-col gap-4">
            {byDiscipline.map(([discipline, items]) => (
              <section key={discipline}>
                <h2 className="mb-2 px-1"><DisciplineBadge discipline={discipline as keyof typeof DISCIPLINE_LABELS} /></h2>
                <ul className="flex flex-col gap-1.5">
                  {items.map((f) => {
                    const active = selected?.id === f.id;
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(f.id)}
                          aria-current={active ? "true" : undefined}
                          className={clsx(
                            "w-full rounded-xl border p-3 text-left transition-colors",
                            active ? "border-primary bg-card shadow-[var(--shadow-card)]" : "border-line bg-card/60 hover:bg-card",
                            f.status === "rejected" && "opacity-60",
                          )}
                        >
                          <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                            <Dot tone={toneForFinding(f)} />
                            <span>{copy.findings.kind[f.kind]}</span>
                            <span aria-hidden>·</span>
                            <span className="truncate">{competitorName(f.competitorPlaceId)}</span>
                          </div>
                          <p className="text-sm leading-snug font-medium">{f.claim}</p>
                          <div className="mt-2 flex gap-1.5">
                            <Pill tone={f.confidence === "confirmed" ? "success" : "neutral"}>{copy.findings.confidence[f.confidence]}</Pill>
                            {f.status === "rejected" && <Pill tone="warning">Set aside</Pill>}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>

          {selected && <FindingDetail finding={selected} report={report} reviews={reviews} sourceName={competitorName(selected.competitorPlaceId)} competitorName={competitorName} />}
        </div>
      )}
    </div>
  );
}
