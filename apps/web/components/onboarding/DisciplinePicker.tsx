"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Check, Plus, Search, X } from "lucide-react";
import { DISCIPLINE_LABELS, DISCIPLINES, type Discipline } from "@clinix/contracts";
import { disciplineBlurb, isCommon } from "@/lib/disciplines";
import { Sticker } from "./Sticker";

export const MAX_DISCIPLINES = 4;
const ALL = DISCIPLINES.filter((d) => d.id !== "other").map((d) => d.id as Discipline);

/**
 * The disciplines field: chosen stickers inline, and a sticker grid that opens in place
 * underneath to pick from all disciplines. The first chosen one leads the analysis.
 */
export function DisciplinePicker({ value, onChange, autoFilled }: { value: Discipline[]; onChange: (next: Discipline[]) => void; autoFilled?: boolean }) {
  const [open, setOpen] = useState(false);
  const remove = (d: Discipline) => onChange(value.filter((x) => x !== d));
  return (
    <div>
      <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-xl border border-line bg-card p-2">
        {value.map((d, i) => (
          <span key={d} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-1 pl-1 text-sm" data-testid="chosen-discipline">
            <Sticker discipline={d} size={30} tilt={false} />
            <span className="font-medium">{DISCIPLINE_LABELS[d]}</span>
            {i === 0 && <span className="rounded-full bg-[#f5b942] px-1.5 py-0.5 text-[10px] font-semibold text-[#0b0f1f]">Lead</span>}
            <button type="button" onClick={() => remove(d)} aria-label={`Remove ${DISCIPLINE_LABELS[d]}`} className="grid size-7 place-items-center rounded-full hover:bg-line"><X size={12} /></button>
          </span>
        ))}
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="discipline-panel" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-3 text-sm font-medium text-primary hover:bg-primary-soft">
          {open ? <X size={14} aria-hidden /> : <Plus size={14} aria-hidden />} {open ? "Close" : value.length ? "Add or change" : "Choose disciplines"}
        </button>
      </div>
      {autoFilled && value.length > 0 && <p className="mt-1.5 text-xs text-primary">Set from your Google listing. Change it if we got it wrong.</p>}
      {open && <DisciplinePanel value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** The sticker grid, opened in place under the field. */
function DisciplinePanel({ value, onChange, onClose }: { value: Discipline[]; onChange: (next: Discipline[]) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return ALL.filter((d) => DISCIPLINE_LABELS[d].toLowerCase().includes(q) || value.includes(d));
    return ALL.filter((d) => showAll || isCommon(d) || value.includes(d));
  }, [query, showAll, value]);

  const toggle = (d: Discipline) => {
    if (value.includes(d)) return onChange(value.filter((x) => x !== d));
    if (value.length < MAX_DISCIPLINES) onChange([...value, d]);
  };

  return (
    <section id="discipline-panel" aria-label="Choose disciplines" className="mt-3 rounded-2xl border border-line bg-surface/60 shadow-[var(--shadow-card)]">
      <div>
        <div className="flex items-center justify-between px-3 pt-3">
          <p className="text-xs text-muted">{value.length}/{MAX_DISCIPLINES} chosen. The first one leads the analysis.</p>
        </div>
        <div className="p-3">
          <div className="flex min-h-11 items-stretch overflow-hidden rounded-xl border border-line bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <span className="grid w-11 shrink-0 place-items-center border-r border-line text-faint"><Search size={16} aria-hidden /></span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${ALL.length} disciplines`} aria-label="Search disciplines" className="min-h-11 w-full bg-transparent px-3 text-sm outline-none placeholder:text-faint" />
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto px-3 pb-3">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Disciplines">
            {visible.map((d) => {
              const idx = value.indexOf(d);
              const on = idx >= 0;
              const full = !on && value.length >= MAX_DISCIPLINES;
              return (
                <li key={d}>
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={full}
                    onClick={() => toggle(d)}
                    className={clsx(
                      "relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-transform",
                      on ? "border-primary bg-primary-soft/60" : "border-line bg-card hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
                      full && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <Sticker discipline={d} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-tight">{DISCIPLINE_LABELS[d]}</span>
                      <span className="block truncate text-[11px] text-muted">{disciplineBlurb(d)}</span>
                    </span>
                    {on && (
                      <span className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        {idx === 0 && <span className="rounded-full bg-[#f5b942] px-1.5 py-0.5 text-[10px] font-semibold text-[#0b0f1f]">Lead</span>}
                        <span className="grid size-5 place-items-center rounded-full bg-primary text-white"><Check size={12} aria-hidden /></span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {visible.length === 0 && <p className="p-2 text-sm text-muted">No discipline matches. Pick the closest one; &quot;Other health service&quot; covers everything else.</p>}
          {!query && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 min-h-9 text-xs font-medium text-primary">
              {showAll ? "Show common disciplines only" : `Show all ${ALL.length} disciplines`}
            </button>
          )}
        </div>
        <div className="flex justify-end border-t border-line p-3">
          <button type="button" onClick={onClose} className="min-h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white">Done</button>
        </div>
      </div>
    </section>
  );
}
