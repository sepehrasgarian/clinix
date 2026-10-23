"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, Star } from "lucide-react";
import { DISCIPLINE_LABELS, type Discipline } from "@clinix/contracts";
import { logoUrl } from "@/lib/api";
import { compareReviews, disciplineOf, initialsOf, type Competitor } from "@/lib/competitorList";
import { formatKm } from "@/lib/format";

const COUNT = (n: number) => n.toLocaleString("en-CA");
const view = "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#dfe2f1] bg-white px-3.5 text-[13px] font-semibold text-primary hover:border-primary/40";

/** The clinic's logo from its listing, else its initials. Never a stand-in picture. */
export function Mark({ c }: { c: Competitor }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e5e9f2] bg-white text-[13px] font-semibold text-[#66718b]" aria-hidden>
      {failed
        // eslint-disable-next-line @next/next/no-img-element
        ? initialsOf(c.name) : <img src={logoUrl({ placeId: c.placeId })} alt="" onError={() => setFailed(true)} className="size-full object-contain p-1" />}
    </span>
  );
}

export function Rating({ c }: { c: Competitor }) {
  if (c.rating === undefined) return <span className="text-muted">–</span>;
  return <span className="tabular-nums"><span className="inline-flex items-center gap-1 font-semibold text-[#101936]">{c.rating.toFixed(1)}<Star size={13} aria-hidden className="fill-[#e5a50a] text-[#e5a50a]" /><span className="sr-only"> stars</span></span>{c.reviewCount !== undefined && <span className="block text-xs text-muted">({COUNT(c.reviewCount)})</span>}</span>;
}

function Services({ c }: { c: Competitor }) {
  const all = c.site?.services ?? [];
  if (all.length === 0) return <span className="text-muted">–</span>;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Services on their site">
      {all.slice(0, 2).map((s) => <li key={s} className="max-w-[140px] truncate rounded-md bg-[#f3f4f9] px-2 py-1 text-xs text-[#66718b]" title={s}>{s}</li>)}
      {all.length > 2 && <li className="rounded-md bg-[#f3f4f9] px-2 py-1 text-xs text-[#66718b]" title={all.slice(2).join(", ")}>+{all.length - 2}</li>}
    </ul>
  );
}

const tone = { more: "text-[#c2410c]", fewer: "text-[#16845d]", similar: "text-[#66718b]", unknown: "text-[#66718b]" } as const;

/** One comparison signal: the competitor's Google review count against the clinic's. */
export function Comparison({ c, yours }: { c: Competitor; yours: number | undefined }) {
  const cmp = compareReviews(c.reviewCount, yours);
  if (cmp.kind === "unknown") return <span className="text-muted">–</span>;
  if (cmp.kind === "similar") return <span className="text-[13px] font-semibold text-[#66718b]">Similar review count<span className="block text-xs font-normal">to your clinic</span></span>;
  return (
    <span className="flex items-center gap-3">
      <span className={clsx("grid h-10 min-w-12 place-items-center rounded-lg px-2 text-[15px] font-semibold tabular-nums", cmp.kind === "more" ? "bg-[#fff1e8]" : "bg-[#e9f7f0]", tone[cmp.kind])}>{cmp.diff > 0 ? "+" : "−"}{COUNT(Math.abs(cmp.diff))}</span>
      <span className="text-[13px] font-semibold text-[#101936]">{cmp.kind === "more" ? "more reviews" : "fewer reviews"}<span className="block text-xs font-normal text-muted">than your clinic</span></span>
    </span>
  );
}

const subtitle = (c: Competitor, owner: Discipline[]) => [...new Set([disciplineOf(c, owner), ...c.disciplines])].slice(0, 2).map((d) => DISCIPLINE_LABELS[d]).join(" · ");

/** One table on desktop, compact cards below the md breakpoint. Both read the same rows. */
export function CompetitorRows({ rows, owner, yours, onOpen }: { rows: Competitor[]; owner: Discipline[]; yours: number | undefined; onOpen: (c: Competitor) => void }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead>
            <tr className="text-xs text-[#66718b]">
              <th scope="col" className="px-6 py-4 font-medium">Clinic</th>
              <th scope="col" className="px-3 py-4 text-right font-medium">Distance</th>
              <th scope="col" className="px-3 py-4 font-medium">Google rating</th>
              <th scope="col" className="px-3 py-4 font-medium">Key services</th>
              <th scope="col" className="px-3 py-4 font-medium">Comparison with you</th>
              <th scope="col" className="px-6 py-4"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.placeId} className="border-t border-[#eef0f6] hover:bg-[#fafbff]">
                <th scope="row" className="max-w-[300px] px-6 py-3 font-normal">
                  <span className="flex items-center gap-3"><Mark c={c} /><span className="min-w-0"><span className="block truncate text-[14px] font-semibold text-[#101936]" title={c.name}>{c.name}</span><span className="block truncate text-xs text-[#66718b]">{subtitle(c, owner)}</span></span></span>
                </th>
                <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums text-[#66718b]">{formatKm(c.distanceKm)}</td>
                <td className="px-3 py-3"><Rating c={c} /></td>
                <td className="px-3 py-3"><Services c={c} /></td>
                <td className="px-3 py-3"><Comparison c={c} yours={yours} /></td>
                <td className="px-6 py-3 text-right"><button type="button" onClick={() => onOpen(c)} aria-label={`View details, ${c.name}`} className={view}>View details <ArrowRight size={14} aria-hidden /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-[#eef0f6] md:hidden">
        {rows.map((c) => (
          <li key={c.placeId} className="space-y-3 p-4">
            <div className="flex items-start gap-3"><Mark c={c} /><div className="min-w-0 flex-1"><p className="font-semibold text-[#101936]">{c.name}</p><p className="text-xs text-[#66718b]">{subtitle(c, owner)}</p></div><span className="text-xs whitespace-nowrap text-[#66718b] tabular-nums">{formatKm(c.distanceKm)}</span></div>
            <div className="flex items-center justify-between gap-3"><Rating c={c} /><Comparison c={c} yours={yours} /></div>
            <button type="button" onClick={() => onOpen(c)} aria-label={`View details, ${c.name}`} className={view}>View details <ArrowRight size={14} aria-hidden /></button>
          </li>
        ))}
      </ul>
    </>
  );
}
