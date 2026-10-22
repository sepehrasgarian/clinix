import clsx from "clsx";
import { Building2, Check, Star } from "lucide-react";
import { DISCIPLINE_LABELS, type CompetitorCandidate } from "@clinix/contracts";
import { photoUrl } from "@/lib/api";
import { copy } from "@/lib/copy";
import { formatKm } from "@/lib/format";

/** One candidate as a compact row: tick box, photo (or a neutral tile), what we know, distance and a way to see more. */
export function CompetitorCard({
  candidate: c,
  selected,
  active,
  locked,
  onToggle,
  onActivate,
  onDetails,
}: {
  candidate: CompetitorCandidate;
  selected: boolean;
  active: boolean;
  /** The discipline is at its limit and this one is not chosen. */
  locked: boolean;
  onToggle: () => void;
  onActivate: () => void;
  onDetails: () => void;
}) {
  const { place } = c;
  return (
    <li id={`cand-${place.placeId}`} className="scroll-mt-24">
      <div
        onClick={onActivate}
        className={clsx(
          "flex items-center gap-4 rounded-[18px] border bg-white p-[14px] transition-colors",
          selected ? "border-primary bg-[#f7f7ff]" : "border-[#ecedf5] hover:border-[#d6d9ee]",
          active && "ring-2 ring-primary/30",
          c.flag === "irrelevant" && !selected && "opacity-70",
        )}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-disabled={locked}
          aria-label={`Select ${place.name}`}
          title={locked ? "Limit reached. Remove one to swap." : undefined}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={clsx("grid size-6 shrink-0 place-items-center rounded-md border-2", selected ? "border-primary bg-primary text-white" : locked ? "border-[#e4e6f0] bg-[#f4f5fa]" : "border-[#c9cde0] bg-white hover:border-primary")}
        >
          {selected && <Check size={14} strokeWidth={3} aria-hidden />}
        </button>
        {place.photoName ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(place.photoName)} alt="" className="size-[72px] shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="grid size-[72px] shrink-0 place-items-center rounded-xl bg-[#f0f1f7] text-faint" aria-hidden><Building2 size={24} /></span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15.5px] leading-snug font-bold">{place.name}</h3>
            <span className="shrink-0 text-[13px] font-semibold text-ink-grey tabular-nums">{formatKm(c.distanceKm)}</span>
          </div>
          {place.rating !== undefined && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-grey">
              <Star size={13} className="fill-[#f5a524] text-[#f5a524]" aria-hidden />
              <b className="text-ink">{place.rating.toFixed(1)}</b>
              {place.reviewCount !== undefined && <span>({place.reviewCount} {copy.common.reviews})</span>}
            </p>
          )}
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-grey">{c.reason}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.disciplines.slice(0, 3).map((d) => <span key={d} className="rounded-full bg-[#eeefff] px-2.5 py-0.5 text-[12px] font-medium text-primary">{DISCIPLINE_LABELS[d]}</span>)}
          </div>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDetails(); }} aria-label={`View details for ${place.name}`} className="hidden min-h-10 shrink-0 rounded-xl border border-[#dfe2f1] bg-white px-4 text-[13.5px] font-semibold text-primary hover:border-primary/50 sm:block">
          View details
        </button>
      </div>
    </li>
  );
}
