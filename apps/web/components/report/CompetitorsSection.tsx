"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { DISCIPLINE_LABELS, primaryDiscipline, type Discipline, type Report } from "@clinix/contracts";
import { Sticker } from "@/components/onboarding/Sticker";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { Pill } from "@/components/ui/Pill";
import { Stars } from "@/components/ui/Stars";
import { copy } from "@/lib/copy";
import { formatKm } from "@/lib/format";

type Sort = "closest" | "reviews" | "rating";

/** 04 Competitors: filter by discipline, search, sort; one collapsible card per rival. */
export function CompetitorsSection({ report, disciplines }: { report: Report; disciplines: Discipline[] }) {
  const [filter, setFilter] = useState<Discipline | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("closest");
  const [open, setOpen] = useState<string | null>(null);
  const reviews = new Map(report.reviews.map((r) => [r.id, r]));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return report.competitors
      .filter((c) => filter === "all" || primaryDiscipline(c.disciplines, disciplines) === filter)
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => (sort === "closest" ? a.distanceKm - b.distanceKm : sort === "reviews" ? (b.reviewCount ?? 0) - (a.reviewCount ?? 0) : (b.rating ?? 0) - (a.rating ?? 0)));
  }, [report.competitors, filter, query, sort, disciplines]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filter by discipline" className="flex flex-wrap gap-1.5">
          {(["all", ...disciplines] as const).map((d) => (
            <button key={d} type="button" aria-pressed={filter === d} onClick={() => setFilter(d)} className={clsx("min-h-9 rounded-full border px-3 text-sm", filter === d ? "border-primary bg-primary-soft text-primary" : "border-line bg-card text-muted")}>
              {d === "all" ? "All" : DISCIPLINE_LABELS[d]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="relative">
            <Search aria-hidden size={14} className="pointer-events-none absolute top-2.5 left-2.5 text-faint" />
            <span className="sr-only">Search by clinic name</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="min-h-9 rounded-full border border-line bg-card pr-3 pl-8 text-sm" />
          </label>
          <label className="text-sm text-muted">
            <span className="sr-only">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-9 rounded-full border border-line bg-card px-3 text-sm">
              <option value="closest">Closest first</option>
              <option value="reviews">Most reviews</option>
              <option value="rating">Highest rated</option>
            </select>
          </label>
        </div>
      </div>

      <ul className="grid gap-3">
        {list.map((c) => {
          const isOpen = open === c.placeId;
          const findings = report.findings.filter((f) => f.competitorPlaceId === c.placeId && f.status === "kept");
          const strengths = findings.filter((f) => f.kind === "strength").length;
          const weaknesses = findings.filter((f) => f.kind === "weakness" || f.kind === "admin_friction").length;
          const sample = findings.flatMap((f) => f.evidence).map((e) => reviews.get(e.reviewId)).find(Boolean);
          return (
            <li key={c.placeId} className="rounded-[var(--radius-card)] border border-line bg-card">
              <button type="button" onClick={() => setOpen(isOpen ? null : c.placeId)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-4 text-left">
                <Sticker discipline={primaryDiscipline(c.disciplines, disciplines)} size={36} tilt={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="text-xs text-muted">{formatKm(c.distanceKm)} {copy.competitors.distance} · {c.reviewsAnalyzed} {copy.competitors.reviewsAnalyzed}</p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  {strengths > 0 && <Pill tone="alert">{strengths} strengths</Pill>}
                  {weaknesses > 0 && <Pill tone="success">{weaknesses} openings</Pill>}
                </div>
                {c.rating !== undefined && <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted tabular-nums"><Stars rating={c.rating} size={11} /> {c.rating.toFixed(1)} · {c.reviewCount}</span>}
                <ChevronDown size={16} aria-hidden className={clsx("shrink-0 text-faint transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="grid gap-4 border-t border-line p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-faint uppercase">What their patients say</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {findings.slice(0, 6).map((f) => (
                        <li key={f.id} className="flex gap-2"><span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", f.kind === "weakness" || f.kind === "admin_friction" ? "bg-success" : "bg-alert")} />{f.claim}</li>
                      ))}
                      {findings.length === 0 && <li className="text-muted">No finding about this clinic yet.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-faint uppercase">One of their reviews</p>
                    <div className="mt-2">{sample ? <EvidenceCard review={sample} quote={sample.text.slice(0, 140)} sourceName={c.name} /> : <p className="text-sm text-muted">No review on file.</p>}</div>
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-primary">
                        Their website <ExternalLink size={14} aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {list.length === 0 && <li className="text-sm text-muted">No clinic matches that search.</li>}
      </ul>
    </div>
  );
}
