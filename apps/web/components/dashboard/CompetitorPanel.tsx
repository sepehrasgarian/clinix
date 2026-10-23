"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { DISCIPLINE_LABELS } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import type { CompetitorRow } from "@/lib/dashboard";
import { formatKm } from "@/lib/format";
import { logoUrl } from "@/lib/api";
import { panel } from "./panel";

/** The competitor's logo from its listing; a plain building when there is none. */
function Thumb({ name, placeId }: { name: string; placeId: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e7eaf2] bg-[#f7f8fc] text-faint" aria-hidden>
      {failed ? <Building2 size={16} strokeWidth={1.5} /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={logoUrl({ placeId })} alt="" title={name} onError={() => setFailed(true)} className="size-full object-contain" />}
    </span>
  );
}

/** The nearest competitors with the figures Google lists for them. No images, no invented status. */
export function CompetitorPanel({ rows, href, fromReport }: { rows: CompetitorRow[]; href: string; fromReport: boolean }) {
  const t = copy.dashboard.competitors;
  return (
    <section className={`${panel} p-6`} aria-labelledby="competitors-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1f0ff] text-primary" aria-hidden><Building2 size={19} strokeWidth={1.5} /></span>
          <div><h2 id="competitors-title" className="text-[18px] font-semibold text-[#111b35]">{t.title}</h2>
          <p className="text-[13px] text-muted">{fromReport ? t.reportSub : t.selectedSub}</p></div>
        </div>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">{t.all} ({rows.length}) <ArrowRight size={14} aria-hidden /></Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{t.empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead>
              <tr className="text-xs text-faint"><th scope="col" className="py-2 font-medium">Clinic</th><th scope="col" className="py-2 pr-6 text-right font-medium">Distance</th><th scope="col" className="py-2 pr-6 text-right font-medium">Google rating</th><th scope="col" className="py-2 pr-6 text-right font-medium">Reviews</th>{fromReport && <th scope="col" className="py-2 font-medium">Key services</th>}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((r) => (
                <tr key={r.placeId} className="border-t border-[#eef0f7]">
                  <th scope="row" className="max-w-[260px] py-2.5 pr-3 font-medium">
                    <span className="flex items-center gap-3"><Thumb name={r.name} placeId={r.placeId} /><span className="min-w-0"><span className="block truncate text-[#111b35]" title={r.name}>{r.name}</span>
                    {r.disciplines.length > 0 && <span className="block truncate text-xs font-normal text-muted">{r.disciplines.map((d) => DISCIPLINE_LABELS[d]).join(" · ")}</span>}</span></span>
                  </th>
                  <td className="py-2.5 pr-6 text-right whitespace-nowrap tabular-nums text-muted">{formatKm(r.distanceKm)}</td>
                  <td className="py-3 pr-3 whitespace-nowrap tabular-nums">{r.rating !== undefined ? <>{r.rating.toFixed(1)}<span className="text-[#e5a50a]" aria-hidden> ★</span><span className="sr-only"> stars</span></> : "–"}</td>
                  <td className="py-3 pr-3 whitespace-nowrap tabular-nums text-muted">{r.reviewCount?.toLocaleString("en-CA") ?? "–"}</td>
                  {fromReport && <td className="py-2.5"><div className="flex flex-wrap gap-1.5">{(r.services ?? []).slice(0, 2).map((x) => <span key={x} className="rounded-md bg-[#f1f2f7] px-2 py-0.5 text-xs text-muted">{x}</span>)}{(r.services ?? []).length === 0 && <span className="text-muted">–</span>}</div></td>}
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
