"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Info, Search } from "lucide-react";
import { DISCIPLINE_LABELS, primaryDiscipline, type Analysis, type CompetitorCandidate, type Discipline } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { PER_DISCIPLINE_MAX, countPerDiscipline, groupByDiscipline, visibleCandidates, type SortKey } from "@/lib/competitors";
import { AddCompetitor } from "./AddCompetitor";
import { CompetitorCard } from "./CompetitorCard";
import { CompetitorDetails } from "./CompetitorDetails";
import { CompetitorMap } from "./CompetitorMap";
import { CompetitorToolbar } from "./CompetitorToolbar";
import { SelectionSummary } from "./SelectionSummary";
import { PrimaryButton, SetupFrame } from "./SetupFrame";
import { Sticker } from "./Sticker";

export { PER_DISCIPLINE_MAX, countPerDiscipline };

/** The same business listed twice (two place ids, one name and address) is shown once. The owner's own clinic is never a candidate. */
function usable(candidates: CompetitorCandidate[], ownPlaceId?: string): CompetitorCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = `${c.place.name}|${c.place.address}`.toLowerCase();
    if (c.place.placeId === ownPlaceId || seen.has(c.place.placeId) || seen.has(key)) return false;
    seen.add(c.place.placeId);
    seen.add(key);
    return true;
  });
}

/** Step 2, second screen: the owner confirms up to five competitors per discipline (checkpoint 2). */
export function CompetitorsStage({
  analysis,
  disciplines,
  onConfirm,
  onAdd,
  onBack,
  busy,
  city = "",
  initialSelected,
  onSelectionChange,
}: {
  analysis: Analysis;
  disciplines: Discipline[];
  onConfirm: (placeIds: string[]) => void;
  onAdd?: (pick: { placeId: string } | { query: string }) => Promise<void>;
  onBack?: () => void;
  busy?: boolean;
  city?: string;
  /** Choices made before leaving, restored when the owner comes back. */
  initialSelected?: string[];
  onSelectionChange?: (placeIds: string[]) => void;
}) {
  const t = copy.onboarding.competitors;
  const discovery = analysis.discovery!;
  const own = analysis.scan?.place;
  const candidates = useMemo(() => usable(discovery.candidates, own?.placeId), [discovery.candidates, own?.placeId]);
  const known = useMemo(() => new Set(candidates.map((c) => c.place.placeId)), [candidates]);
  const [selected, setSelected] = useState<string[]>(() => (initialSelected ?? discovery.selectedPlaceIds).filter((id) => known.has(id)));
  const [tab, setTab] = useState<Discipline | null>(null);
  const [query, setQuery] = useState("");
  const [maxKm, setMaxKm] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const groups = useMemo(() => groupByDiscipline(candidates, disciplines), [candidates, disciplines]);
  const active = groups.find((g) => g.d === tab) ?? groups[0];
  const countIn = (d: Discipline, ids = selected) => countPerDiscipline(candidates, ids, d, disciplines);
  const chosen = active ? active.items.filter((c) => selected.includes(c.place.placeId)) : [];
  const visible = active ? visibleCandidates(active.items, { query, maxKm, sort }) : [];
  const atLimit = !!active && chosen.length >= PER_DISCIPLINE_MAX;
  const detail = candidates.find((c) => c.place.placeId === detailsId) ?? null;

  const change = (ids: string[]) => { setSelected(ids); onSelectionChange?.(ids); };
  const toggle = (c: CompetitorCandidate) => {
    const id = c.place.placeId;
    if (selected.includes(id)) return change(selected.filter((x) => x !== id));
    if (countIn(primaryDiscipline(c.disciplines, disciplines)) < PER_DISCIPLINE_MAX) change([...selected, id]);
  };
  const focusCard = (id: string) => {
    setActiveId(id);
    document.getElementById(`cand-${id}`)?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  };

  // A clinic the owner just added is chosen for them, under its own discipline, unless that is full.
  useEffect(() => {
    const c = justAdded ? candidates.find((k) => k.place.placeId === justAdded) : undefined;
    if (!c) return;
    const d = primaryDiscipline(c.disciplines, disciplines);
    setTab(d);
    setJustAdded(null);
    setActiveId(c.place.placeId);
    if (!selected.includes(c.place.placeId) && countIn(d) < PER_DISCIPLINE_MAX) change([...selected, c.place.placeId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justAdded, candidates]);

  const total = selected.length;
  const aside = (
    <>
      {active && (
        <SelectionSummary
          discipline={active.d}
          chosen={chosen}
          progress={groups.map((g) => ({ d: g.d, count: countIn(g.d) }))}
          total={total}
          onRemove={(id) => change(selected.filter((x) => x !== id))}
          onClear={() => change(selected.filter((id) => !active.items.some((c) => c.place.placeId === id)))}
          onSwitch={setTab}
        />
      )}
      {own && active && (
        <div>
          <CompetitorMap center={own} candidates={active.items} selectedIds={selected} activeId={activeId} onPick={focusCard} name={own.name} />
          <div className="mt-2 flex items-center gap-5 px-1 text-[12.5px] text-ink-grey">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#161a3a]" aria-hidden />Your clinic</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" aria-hidden />Chosen</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-primary bg-white" aria-hidden />Candidate</span>
          </div>
        </div>
      )}
      <section className="flex gap-3 rounded-[22px] border border-[#e6e3ff] bg-gradient-to-br from-[#f6f5ff] to-[#fbfaff] p-[20px]">
        <Info size={18} className="mt-0.5 shrink-0 text-[#6d5cf5]" aria-hidden />
        <div>
          <h2 className="text-[15.5px] font-bold">{t.whyTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-grey">{t.whyText}</p>
        </div>
      </section>
    </>
  );

  return (
    <SetupFrame
      step={2}
      back={{ label: copy.onboarding.steps[1], onClick: onBack, href: "/start" }}
      title={t.title}
      intro={t.intro}
      status={`${total} ${total === 1 ? "competitor" : "competitors"} ${t.selected}`}
      action={<PrimaryButton onClick={() => onConfirm(selected)} disabled={total === 0 || busy}>{busy ? t.starting : `${t.start} with ${total} ${total === 1 ? "competitor" : "competitors"}`}</PrimaryButton>}
      aside={aside}
      asideWidth={440}
    >
      <div className="flex flex-col gap-5">
        {groups.length > 1 && (
          <div role="tablist" aria-label="Disciplines" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {groups.map(({ d }) => {
              const n = countIn(d);
              const on = active?.d === d;
              return (
                <button key={d} role="tab" aria-selected={on} type="button" onClick={() => { setTab(d); setActiveId(null); }} className={clsx("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold", on ? "border-primary bg-[#eeefff] text-primary" : "border-[#e3e6f2] bg-white text-ink-grey hover:text-ink")}>
                  <Sticker discipline={d} size={22} tilt={false} className="rounded-lg border-2" />
                  {DISCIPLINE_LABELS[d]}
                  <span className={clsx("text-xs tabular-nums", n >= PER_DISCIPLINE_MAX ? "font-bold text-[#b45309]" : "text-faint")}>{n}/{PER_DISCIPLINE_MAX}{n >= PER_DISCIPLINE_MAX && " · full"}</span>
                </button>
              );
            })}
          </div>
        )}
        {active ? (
          <section aria-label={`${DISCIPLINE_LABELS[active.d]} competitors`} role="tabpanel" className="flex flex-col gap-4">
            <CompetitorToolbar query={query} onQuery={setQuery} maxKm={maxKm} onMaxKm={setMaxKm} sort={sort} onSort={setSort} />
            <div className="flex items-baseline justify-between gap-3 text-[13.5px] text-ink-grey">
              <p>{visible.length === active.items.length ? `${active.items.length} clinics found for ${DISCIPLINE_LABELS[active.d]}` : `Showing ${visible.length} of ${active.items.length} clinics`}</p>
              <p className="font-semibold tabular-nums">{chosen.length} selected / {PER_DISCIPLINE_MAX} maximum</p>
            </div>
            {atLimit && <p role="status" className="rounded-xl bg-[#fff7e6] px-4 py-2.5 text-[13.5px] text-[#8a5a00]">You&apos;ve chosen the maximum of {PER_DISCIPLINE_MAX} for {DISCIPLINE_LABELS[active.d]}. Remove one to swap.</p>}
            {visible.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {visible.map((c) => {
                  const on = selected.includes(c.place.placeId);
                  return <CompetitorCard key={c.place.placeId} candidate={c} selected={on} active={activeId === c.place.placeId} locked={atLimit && !on} onToggle={() => toggle(c)} onActivate={() => setActiveId(c.place.placeId)} onDetails={() => setDetailsId(c.place.placeId)} />;
                })}
              </ul>
            ) : (
              <div className="rounded-[18px] border border-dashed border-[#d3d7ec] bg-white/70 p-8 text-center">
                <Search size={20} className="mx-auto text-faint" aria-hidden />
                <p className="mt-2 text-[14px] font-semibold">No clinics match your search</p>
                <button type="button" onClick={() => { setQuery(""); setMaxKm(null); }} className="mt-2 text-[13.5px] font-semibold text-primary hover:underline">Clear search and filters</button>
              </div>
            )}
          </section>
        ) : (
          <p className="rounded-[18px] border border-dashed border-[#d3d7ec] bg-white/70 p-8 text-center text-[14px] text-ink-grey">We found no clinics near you for these disciplines. Add one below to continue.</p>
        )}
        {onAdd && (
          <AddCompetitor
            city={city}
            ownPlaceId={own?.placeId}
            knownIds={candidates.map((c) => c.place.placeId)}
            onAdd={async (pick) => { await onAdd(pick); setJustAdded(pick.placeId); }}
            onExisting={(id) => { const c = candidates.find((k) => k.place.placeId === id); if (c) { setTab(primaryDiscipline(c.disciplines, disciplines)); focusCard(id); } }}
          />
        )}
      </div>
      {detail && <CompetitorDetails candidate={detail} selected={selected.includes(detail.place.placeId)} locked={countIn(primaryDiscipline(detail.disciplines, disciplines)) >= PER_DISCIPLINE_MAX} onToggle={() => toggle(detail)} onClose={() => setDetailsId(null)} />}
    </SetupFrame>
  );
}
