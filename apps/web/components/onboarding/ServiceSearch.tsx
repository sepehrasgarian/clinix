"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Plus, Search, X } from "lucide-react";
import { DISCIPLINE_LABELS, type Discipline } from "@clinix/contracts";
import { disciplineIcon, isCommon, searchDisciplines, stickerColor } from "@/lib/disciplines";
import { Sticker } from "./Sticker";

export const MAX_DISCIPLINES = 4;

/**
 * The services field: a search that lists every discipline on focus, chosen ones as chips underneath. The first chip is
 * PRIMARY because the first choice sets the lens of the whole analysis. Keys: arrows move, Enter chooses, Escape closes.
 */
export function ServiceSearch({ value, onChange, autoFilled }: { value: Discipline[]; onChange: (next: Discipline[]) => void; autoFilled?: boolean }) {
  const id = useId();
  const listId = `${id}-list`;
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const full = value.length >= MAX_DISCIPLINES;
  const matches = useMemo(() => searchDisciplines(query, value), [query, value]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const choose = (d: Discipline) => {
    if (value.length >= MAX_DISCIPLINES || value.includes(d)) return;
    onChange([...value, d]);
    setQuery("");
    setActive(0);
    input.current?.focus();
  };
  const remove = (d: Discipline) => onChange(value.filter((x) => x !== d));

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, Math.max(matches.length - 1, 0))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { if (open && matches[active]) { e.preventDefault(); choose(matches[active]); } else e.preventDefault(); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={root}>
      <div className="relative">
        {full ? (
          <p className="rounded-[12px] border border-[#e3e6f2] bg-[#fafbfe] px-4 py-[14px] text-sm text-ink-grey">That&apos;s the maximum of {MAX_DISCIPLINES} disciplines. Remove one to swap it.</p>
        ) : (
          <div className="flex min-h-[48px] items-stretch overflow-hidden rounded-[12px] border border-[#e3e6f2] bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12">
            <span className="grid w-[48px] shrink-0 place-items-center border-r border-[#e3e6f2] bg-[#fafbfe] text-[#666e8c]"><Search size={16} aria-hidden /></span>
            <input
              ref={input}
              role="combobox"
              aria-label="Search services"
              aria-expanded={open}
              aria-controls={listId}
              aria-activedescendant={open && matches[active] ? `${id}-${matches[active]}` : undefined}
              aria-autocomplete="list"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKey}
              placeholder={value.length > 0 ? "Add another discipline…" : "Search services (e.g. physiotherapy, chiropractic, massage…)"}
              autoComplete="off"
              className="field-input min-h-[46px] w-full bg-transparent px-4 text-[15px] outline-none placeholder:text-[#9aa3bd]"
            />
          </div>
        )}
        {open && !full && (
          <ul id={listId} role="listbox" aria-label="Services" className="absolute z-20 mt-2 max-h-[340px] w-full overflow-auto rounded-[12px] border border-[#e3e6f2] bg-white p-1 shadow-[0_24px_50px_-24px_rgba(14,21,38,.35)]">
            {matches.length === 0 ? (
              <li className="px-3 py-3 text-sm text-ink-grey">
                No markets matched “{query}”. Pick{" "}
                <button type="button" onClick={() => choose("other" as Discipline)} className="font-semibold text-primary underline underline-offset-2">Other</button> to continue.
              </li>
            ) : (
              matches.map((d, i) => {
                const Icon = disciplineIcon(d);
                return (
                  <li key={d} id={`${id}-${d}`} role="option" aria-selected={i === active}>
                    <button type="button" onMouseEnter={() => setActive(i)} onClick={() => choose(d)} className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === active ? "bg-[#eeefff] text-primary" : "text-ink")}>
                      <span className="grid size-7 shrink-0 place-items-center rounded-full" style={{ background: stickerColor(d) }}><Icon size={14} aria-hidden /></span>
                      <span className="flex-1 text-[13.5px] font-medium">{DISCIPLINE_LABELS[d]}</span>
                      {isCommon(d) && <span className="rounded-full bg-[#eeefff] px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.08em] text-primary uppercase">Popular</span>}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {value.map((d, i) => (
            <span key={d} data-testid="chosen-discipline" className={clsx("inline-flex min-h-9 items-center gap-2 rounded-full py-1 pr-1 pl-1.5 text-sm font-medium", i === 0 ? "bg-[#e9e7ff] text-[#4338ca]" : "bg-[#eeefff] text-ink")}>
              <Sticker discipline={d} size={24} tilt={false} />
              {DISCIPLINE_LABELS[d]}
              {i === 0 && <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.06em] uppercase">Primary</span>}
              <button type="button" onClick={() => remove(d)} aria-label={`Remove ${DISCIPLINE_LABELS[d]}`} className="grid size-7 place-items-center rounded-full hover:bg-white/70"><X size={13} /></button>
            </span>
          ))}
          {!full && (
            <button type="button" onClick={() => { input.current?.focus(); setOpen(true); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#e3e6f2] bg-white px-3.5 text-sm font-medium hover:border-primary/40">
              <Plus size={14} aria-hidden /> Add another
            </button>
          )}
        </div>
      )}
      {autoFilled && value.length > 0 && <p className="mt-2 text-xs text-primary">Set from your Google listing. Change it if we got it wrong.</p>}
    </div>
  );
}
