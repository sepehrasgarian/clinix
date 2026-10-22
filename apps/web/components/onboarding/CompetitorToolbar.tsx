import { Search } from "lucide-react";
import { DISTANCES, SORTS, type SortKey } from "@/lib/competitors";

const select = "min-h-[46px] rounded-xl border border-[#e3e6f2] bg-white px-3.5 text-[14px] font-medium outline-none focus-visible:border-primary";

/** Search by name or place, a distance cap and the sort order. None of these ever changes what is selected. */
export function CompetitorToolbar({ query, onQuery, maxKm, onMaxKm, sort, onSort }: { query: string; onQuery: (q: string) => void; maxKm: number | null; onMaxKm: (km: number | null) => void; sort: SortKey; onSort: (s: SortKey) => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row" role="search">
      <label className="flex min-h-[46px] flex-1 items-center gap-2.5 rounded-xl border border-[#e3e6f2] bg-white px-3.5 focus-within:border-primary">
        <Search size={16} className="text-faint" aria-hidden />
        <span className="sr-only">Search clinics</span>
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search clinics by name or location" className="field-input w-full bg-transparent text-[14px] outline-none placeholder:text-[#9aa3bd]" />
      </label>
      <label>
        <span className="sr-only">Distance</span>
        <select value={maxKm ?? ""} onChange={(e) => onMaxKm(e.target.value ? Number(e.target.value) : null)} className={select}>
          {DISTANCES.map((d) => <option key={d.label} value={d.km ?? ""}>{d.label}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Sort by</span>
        <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className={select}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{`Sort: ${s.label}`}</option>)}
        </select>
      </label>
    </div>
  );
}
