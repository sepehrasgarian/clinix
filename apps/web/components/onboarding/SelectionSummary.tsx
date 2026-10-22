import clsx from "clsx";
import { X } from "lucide-react";
import { DISCIPLINE_LABELS, type CompetitorCandidate, type Discipline } from "@clinix/contracts";
import { formatKm } from "@/lib/format";
import { PER_DISCIPLINE_MAX } from "@/lib/competitors";

export type DisciplineProgress = { d: Discipline; count: number };

/** The owner's choices: the current discipline's list with a remove action, and every discipline's progress. */
export function SelectionSummary({
  discipline,
  chosen,
  progress,
  total,
  onRemove,
  onClear,
  onSwitch,
}: {
  discipline: Discipline;
  chosen: CompetitorCandidate[];
  progress: DisciplineProgress[];
  total: number;
  onRemove: (placeId: string) => void;
  onClear: () => void;
  onSwitch: (d: Discipline) => void;
}) {
  const empty = progress.filter((p) => p.count === 0);
  return (
    <section className="rounded-[22px] border border-[#ecedf5] bg-white p-[20px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" aria-labelledby="selection-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="selection-title" className="text-[17px] font-bold">Your selection <span className="ml-1 text-[14px] font-medium text-ink-grey">{chosen.length}/{PER_DISCIPLINE_MAX}</span></h2>
        {chosen.length > 0 && <button type="button" onClick={onClear} className="text-[13px] font-semibold text-primary hover:underline">Clear all</button>}
      </div>
      <p className="mt-0.5 text-[13px] text-ink-grey">{DISCIPLINE_LABELS[discipline]}</p>
      {chosen.length === 0 ? (
        <p className="mt-4 rounded-xl bg-[#f6f7fb] px-4 py-3 text-[13.5px] text-ink-grey">Tick the clinics you want us to read in depth.</p>
      ) : (
        <ol className="mt-3 divide-y divide-[#eef0f6]">
          {chosen.map((c, i) => (
            <li key={c.place.placeId} className="flex items-center gap-3 py-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eeefff] text-[12px] font-bold text-primary">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{c.place.name}</span>
              <span className="shrink-0 text-[12.5px] text-ink-grey tabular-nums">{formatKm(c.distanceKm)}</span>
              <button type="button" onClick={() => onRemove(c.place.placeId)} aria-label={`Remove ${c.place.name}`} className="grid size-7 shrink-0 place-items-center rounded-full text-faint hover:bg-[#f1f2f8] hover:text-ink"><X size={14} aria-hidden /></button>
            </li>
          ))}
        </ol>
      )}
      {progress.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Progress by discipline">
          {progress.map((p) => (
            <li key={p.d}>
              <button type="button" onClick={() => onSwitch(p.d)} className={clsx("rounded-full px-3 py-1 text-[12.5px] font-semibold", p.d === discipline ? "bg-primary text-white" : p.count > 0 ? "bg-[#e6f7ee] text-[#16875a]" : "bg-[#f1f2f7] text-ink-grey")}>
                {DISCIPLINE_LABELS[p.d]} {p.count}/{PER_DISCIPLINE_MAX}
              </button>
            </li>
          ))}
        </ul>
      )}
      {progress.length > 1 && empty.length > 0 && total > 0 && <p className="mt-3 text-[12.5px] text-ink-grey">Nothing chosen yet for {empty.map((p) => DISCIPLINE_LABELS[p.d]).join(", ")}. You can still continue.</p>}
    </section>
  );
}
