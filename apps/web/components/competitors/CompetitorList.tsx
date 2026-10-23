"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Download, Search } from "lucide-react";
import { DISCIPLINE_LABELS, type Discipline, type Report } from "@clinix/contracts";
import { competitorsCsv, disciplineCounts, SORTS, visibleCompetitors, type Competitor, type Filter, type Sort } from "@/lib/competitorList";
import { CompetitorDrawer } from "./CompetitorDrawer";
import { CompetitorRows } from "./CompetitorRows";

const control = "min-h-11 rounded-xl border border-[#e5e9f2] bg-white text-sm text-[#101936]";

function download(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "competitors.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

/** Filters, search and sort over one table; a drawer for the competitor the owner opens. */
export function CompetitorList({ report, disciplines, you, findingsHref }: { report: Report; disciplines: Discipline[]; you: { reviews?: number; rating?: number; services?: number }; findingsHref: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("closest");
  const [open, setOpen] = useState<Competitor | null>(null);
  const counts = useMemo(() => disciplineCounts(report.competitors, disciplines), [report.competitors, disciplines]);
  const rows = useMemo(() => visibleCompetitors(report.competitors, disciplines, { filter, query, sort }), [report.competitors, disciplines, filter, query, sort]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by discipline" className="flex flex-wrap gap-2">
          {counts.map(({ key, count }) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={clsx("inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-medium", filter === key ? "border-primary bg-[#f0efff] text-primary" : "border-[#e5e9f2] bg-white text-[#475069] hover:border-primary/40")}>
              {key === "all" ? "All clinics" : DISCIPLINE_LABELS[key]}<span className="rounded-full bg-[#eef0f6] px-1.5 text-xs tabular-nums">{count}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="relative">
            <Search aria-hidden size={16} strokeWidth={1.5} className="pointer-events-none absolute top-3.5 left-3.5 text-[#8a93a3]" />
            <span className="sr-only">Search by clinic name or service</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by clinic name or service..." className={`${control} w-72 max-w-full pr-3 pl-10`} />
          </label>
          <label className="relative">
            <span className="sr-only">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${control} appearance-none pr-10 pl-4`}>{SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
            <ChevronDown aria-hidden size={16} className="pointer-events-none absolute top-3.5 right-3.5 text-muted" />
          </label>
        </div>
      </div>
      <section className="overflow-hidden rounded-[18px] border border-[#e5e9f2] bg-white shadow-[0_4px_20px_rgba(20,27,65,.035)]" aria-label="Competitors">
        {rows.length === 0
          ? <p className="p-10 text-center text-sm text-[#66718b]">No clinic matches. Clear the search or choose another discipline.</p>
          : <CompetitorRows rows={rows} owner={disciplines} yours={you.reviews} onOpen={setOpen} />}
      </section>
      <div className="flex justify-end">
        <button type="button" disabled={rows.length === 0} onClick={() => download(competitorsCsv(rows, you.reviews))} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#5145e8] px-5 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:opacity-50"><Download size={16} strokeWidth={1.5} aria-hidden />Export list</button>
      </div>
      {open && <CompetitorDrawer competitor={open} report={report} yours={{ reviews: you.reviews, rating: you.rating }} yourServices={you.services} findingsHref={findingsHref} onClose={() => setOpen(null)} />}
    </div>
  );
}
