"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { DISCIPLINE_LABELS, primaryDiscipline, type Discipline, type Finding, type FindingKind, type Report, type Review } from "@clinix/contracts";
import { Sticker } from "@/components/onboarding/Sticker";
import { LedgerCounter } from "@/components/ui/LedgerCounter";
import { Dot, Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { toneForFinding } from "@/lib/format";
import { FindingDetail } from "./FindingDetail";

const KINDS: FindingKind[] = ["switching_reason", "weakness", "strength", "admin_friction", "access", "unmet_demand"];
/** How many findings a clinic's group shows before "Show more". Long reports have 30+ per clinic. */
const PAGE = 6;

/**
 * Findings grouped by who they are about, your clinic first, with discipline tabs and a kind filter.
 * A group opens to its findings; one finding at a time shows its evidence on the right.
 */
export function FindingsExplorer({ report, reviews, clinicName, disciplines = [] }: { report: Report; reviews: Review[]; clinicName: string; disciplines?: Discipline[] }) {
  const [showRejected, setShowRejected] = useState(false);
  const [discipline, setDiscipline] = useState<Discipline | "all">("all");
  const [kind, setKind] = useState<FindingKind | "all">("all");
  const [openGroup, setOpenGroup] = useState<string | "own" | null>("own");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const competitorName = (id: string | null) => (id === null ? clinicName : report.competitors.find((c) => c.placeId === id)?.name ?? "Competitor");

  const visible = useMemo(
    () => report.findings.filter((f) => (showRejected || f.status === "kept") && (discipline === "all" || f.discipline === discipline) && (kind === "all" || f.kind === kind)),
    [report.findings, showRejected, discipline, kind],
  );
  const groups = useMemo(() => {
    const ids: (string | null)[] = [null, ...report.competitors.map((c) => c.placeId)];
    return ids.map((id) => ({ id, name: competitorName(id), items: visible.filter((f) => f.competitorPlaceId === id) })).filter((g) => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, report.competitors, clinicName]);
  const selected = visible.find((f) => f.id === selectedId) ?? groups.find((g) => (g.id ?? "own") === openGroup)?.items[0] ?? visible[0] ?? null;
  const disciplinesPresent = disciplines.filter((d) => report.findings.some((f) => f.discipline === d));
  const kindCount = (k: FindingKind) => report.findings.filter((f) => f.status === "kept" && f.kind === k && (discipline === "all" || f.discipline === discipline)).length;

  return (
    <div className="flex flex-col gap-4">
      <LedgerCounter ledger={report.ledger} showRejected={showRejected} onToggle={() => setShowRejected((v) => !v)} />
      <p className="text-sm text-muted">
        {report.findings.filter((f) => f.status === "kept").length} findings from {report.reviews.length} reviews across you and {report.competitors.length} competitors. Open a clinic to read what its patients say; pick a finding to see the exact reviews behind it.
      </p>

      {disciplinesPresent.length > 1 && (
        <div role="tablist" aria-label="Disciplines" className="flex flex-wrap gap-2">
          <button role="tab" aria-selected={discipline === "all"} type="button" onClick={() => setDiscipline("all")} className={clsx("min-h-10 rounded-full border px-3 text-sm font-medium", discipline === "all" ? "border-primary bg-primary-soft text-primary" : "border-line bg-card text-muted")}>All disciplines</button>
          {disciplinesPresent.map((d) => (
            <button key={d} role="tab" aria-selected={discipline === d} type="button" onClick={() => setDiscipline(d)} className={clsx("inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium", discipline === d ? "border-primary bg-primary-soft text-primary" : "border-line bg-card text-muted")}>
              <Sticker discipline={d} size={22} tilt={false} className="rounded-lg border-2" />{DISCIPLINE_LABELS[d]}
            </button>
          ))}
        </div>
      )}

      <div role="group" aria-label="Filter by kind" className="flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")} className={clsx("min-h-9 rounded-full border px-3 text-xs font-medium", kind === "all" ? "border-ink bg-ink text-white" : "border-line bg-card text-muted")}>All kinds</button>
        {KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={clsx("inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium", kind === k ? "border-ink bg-ink text-white" : "border-line bg-card text-muted")}>
            <Dot tone={toneForFinding({ kind: k, competitorPlaceId: "x" })} /> {copy.findings.kind[k]} <span className="font-mono opacity-70">{kindCount(k)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState text={copy.findings.empty} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(300px,2fr)_3fr]">
          <nav aria-label="Findings" className="flex flex-col gap-2">
            {groups.map((g) => {
              const key = g.id ?? "own";
              const isOpen = openGroup === key;
              const disc = g.id === null ? disciplines[0] : primaryDiscipline(report.competitors.find((c) => c.placeId === g.id)?.disciplines ?? [], disciplines);
              return (
                <section key={key} className="rounded-[var(--radius-card)] border border-line bg-card">
                  <button type="button" onClick={() => setOpenGroup(isOpen ? null : key)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-3 text-left">
                    {disc && <Sticker discipline={disc} size={30} tilt={false} />}
                    <span className="min-w-0 flex-1">
                      <span className={clsx("block truncate font-semibold", g.id === null && "text-primary")}>{g.id === null ? `${g.name} (you)` : g.name}</span>
                      <span className="block text-xs text-muted">{g.items.length} findings</span>
                    </span>
                    <ChevronDown size={16} aria-hidden className={clsx("shrink-0 text-faint transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <ul className="flex flex-col gap-1 border-t border-line p-2">
                      {(expanded[key] ? g.items : g.items.slice(0, PAGE)).map((f: Finding) => {
                        const active = selected?.id === f.id;
                        return (
                          <li key={f.id}>
                            <button type="button" onClick={() => setSelectedId(f.id)} aria-current={active ? "true" : undefined} className={clsx("w-full rounded-lg p-2.5 text-left text-sm transition-colors", active ? "bg-primary-soft" : "hover:bg-surface", f.status === "rejected" && "opacity-60")}>
                              <span className="mb-1 flex items-center gap-2 text-xs text-muted"><Dot tone={toneForFinding(f)} />{copy.findings.kind[f.kind]}{f.status === "rejected" && <Pill tone="warning">Set aside</Pill>}</span>
                              <span className="block leading-snug">{f.claim}</span>
                            </button>
                          </li>
                        );
                      })}
                      {g.items.length > PAGE && (
                        <li>
                          <button type="button" onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))} className="min-h-10 w-full rounded-lg text-sm font-medium text-primary hover:bg-primary-soft">
                            {expanded[key] ? "Show fewer" : `Show ${g.items.length - PAGE} more`}
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </section>
              );
            })}
          </nav>
          <div className="lg:sticky lg:top-20 lg:self-start">
            {selected && <FindingDetail finding={selected} report={report} reviews={reviews} sourceName={competitorName(selected.competitorPlaceId)} competitorName={competitorName} />}
          </div>
        </div>
      )}
    </div>
  );
}
