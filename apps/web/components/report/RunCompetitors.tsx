"use client";

import { useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import type { CompetitorCandidate } from "@clinix/contracts";
import { photoUrl } from "@/lib/api";
import { copy } from "@/lib/copy";
import { formatKm } from "@/lib/format";

const SHOWN = 5;

/** The clinics the owner confirmed. The run does not track each one separately, so only what we know about them is shown. */
export function RunCompetitors({ competitors }: { competitors: CompetitorCandidate[] }) {
  const t = copy.onboarding.run;
  const [all, setAll] = useState(false);
  const shown = all ? competitors : competitors.slice(0, SHOWN);
  return (
    <section className="rounded-[22px] border border-[#ecedf5] bg-white p-[22px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" aria-labelledby="comp-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="comp-title" className="text-[17px] font-bold">{t.competitors}</h2>
        <span className="rounded-full bg-[#f1f2f7] px-3 py-1 text-[12.5px] font-semibold text-ink-grey">{competitors.length} {competitors.length === 1 ? "clinic" : "clinics"}</span>
      </div>
      {competitors.length === 0 ? (
        <p className="mt-4 text-[13.5px] text-ink-grey">Your own reviews are being read first. Competitors appear here once they are confirmed.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#eef0f6]">
          {shown.map((c) => (
            <li key={c.place.placeId} className="flex items-center gap-3.5 py-3">
              {c.place.photoName ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(c.place.photoName)} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f0f1f7] text-faint" aria-hidden><Building2 size={18} /></span>
              )}
              <div className="min-w-0"><p className="truncate text-[14px] font-semibold">{c.place.name}</p><p className="text-[12.5px] text-ink-grey">{formatKm(c.distanceKm)} {copy.competitors.distance}</p></div>
            </li>
          ))}
        </ul>
      )}
      {competitors.length > SHOWN && (
        <button type="button" aria-expanded={all} onClick={() => setAll(!all)} className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#f6f7fb] text-[13.5px] font-semibold text-primary hover:bg-[#eef0fb]">
          {all ? t.showLess : `${t.viewAll} ${competitors.length} competitors`}<ChevronDown size={14} className={all ? "rotate-180" : ""} aria-hidden />
        </button>
      )}
    </section>
  );
}
