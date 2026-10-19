"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { DISCIPLINE_LABELS, type Analysis, type CompetitorCandidate, type Discipline } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Stars } from "@/components/ui/Stars";
import { copy } from "@/lib/copy";
import { formatKm } from "@/lib/format";
import { PrimaryButton, SetupFrame } from "./SetupFrame";

export const PER_DISCIPLINE_MAX = 5;

export function countPerDiscipline(candidates: CompetitorCandidate[], selected: string[], d: Discipline): number {
  return candidates.filter((c) => selected.includes(c.place.placeId) && c.disciplines.includes(d)).length;
}

/** Step 3 of 4: the owner confirms up to five competitors per discipline (checkpoint 2). */
export function CompetitorsStage({ analysis, disciplines, onConfirm, onAdd, busy }: { analysis: Analysis; disciplines: Discipline[]; onConfirm: (placeIds: string[]) => void; onAdd?: (query: string) => Promise<void>; busy?: boolean }) {
  const discovery = analysis.discovery!;
  const [selected, setSelected] = useState<string[]>(discovery.selectedPlaceIds);
  const [missed, setMissed] = useState("");
  const [adding, setAdding] = useState(false);

  const grouped = useMemo(
    () => disciplines.map((d) => ({ d, items: discovery.candidates.filter((c) => c.disciplines.includes(d)) })).filter((g) => g.items.length),
    [discovery.candidates, disciplines],
  );

  const toggle = (c: CompetitorCandidate) => {
    if (selected.includes(c.place.placeId)) return setSelected(selected.filter((id) => id !== c.place.placeId));
    const full = c.disciplines.some((d) => disciplines.includes(d) && countPerDiscipline(discovery.candidates, selected, d) >= PER_DISCIPLINE_MAX);
    if (!full) setSelected([...selected, c.place.placeId]);
  };

  const flagTone = { strong: "success", borderline: "warning", irrelevant: "neutral" } as const;

  return (
    <SetupFrame
      step={3}
      back={{ href: "/onboarding", label: copy.onboarding.steps[1] }}
      title={copy.onboarding.competitors.title}
      intro={copy.onboarding.competitors.intro}
      status={`${selected.length} ${copy.onboarding.competitors.selected}`}
      action={<PrimaryButton onClick={() => onConfirm(selected)} disabled={selected.length === 0 || busy}>{busy ? copy.onboarding.competitors.starting : copy.onboarding.competitors.start}</PrimaryButton>}
    >
      <div className="flex flex-col gap-6">
        {grouped.map(({ d, items }) => {
          const n = countPerDiscipline(discovery.candidates, selected, d);
          return (
            <section key={d} aria-labelledby={`disc-${d}`}>
              <h2 id={`disc-${d}`} className="mb-3 flex items-baseline gap-2 font-semibold">
                {DISCIPLINE_LABELS[d]} <span className={clsx("font-mono text-xs", n >= PER_DISCIPLINE_MAX ? "text-warning" : "text-faint")}>{n} / {PER_DISCIPLINE_MAX}</span>
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {items.map((c) => {
                  const on = selected.includes(c.place.placeId);
                  return (
                    <li key={c.place.placeId}>
                      <button type="button" onClick={() => toggle(c)} aria-pressed={on} className={clsx("flex w-full gap-3 rounded-xl border p-4 text-left", on ? "border-primary bg-card shadow-[var(--shadow-card)]" : "border-line bg-card/70 hover:bg-card", c.flag === "irrelevant" && "opacity-60")}>
                        <span className={clsx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border", on ? "border-primary bg-primary text-white" : "border-line")}>{on && <Check size={14} aria-hidden />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="font-medium leading-snug">{c.place.name}</span>
                            <span className="shrink-0 text-xs text-muted">{formatKm(c.distanceKm)}</span>
                          </span>
                          {c.place.rating !== undefined && (
                            <span className="mt-1 flex items-center gap-2 text-xs text-muted"><Stars rating={c.place.rating} size={11} /> {c.place.rating.toFixed(1)} · {c.place.reviewCount} {copy.common.reviews}</span>
                          )}
                          <span className="mt-2 block text-sm text-muted">{c.reason}</span>
                          <span className="mt-2 block"><Pill tone={flagTone[c.flag]}>{copy.onboarding.competitors.flags[c.flag]}</Pill></span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {onAdd && (
          <Card className="p-5">
            <h2 className="font-semibold">{copy.onboarding.competitors.addMissed}</h2>
            <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!missed.trim()) return; setAdding(true); try { await onAdd(missed.trim()); setMissed(""); } finally { setAdding(false); } }}>
              <label htmlFor="missed" className="sr-only">{copy.onboarding.competitors.addPlaceholder}</label>
              <input id="missed" value={missed} onChange={(e) => setMissed(e.target.value)} placeholder={copy.onboarding.competitors.addPlaceholder} className="min-h-11 flex-1 rounded-lg border border-line px-3 text-sm sm:max-w-xs" />
              <button type="submit" disabled={adding} className="min-h-11 rounded-lg border border-line px-4 text-sm font-medium">{copy.onboarding.competitors.add}</button>
            </form>
          </Card>
        )}
      </div>
    </SetupFrame>
  );
}
