"use client";

import { useState } from "react";
import clsx from "clsx";
import type { NearbyClinic } from "@clinix/contracts";
import { distanceLabel, reviewsLabel } from "@/lib/overview";

const AVATARS = ["bg-[#eeefff] text-primary", "bg-[#e3f7ee] text-[#0f7a50]", "bg-[#fff4e0] text-[#c27a12]", "bg-[#fde7f0] text-[#c2306a]"];
const SHOWN = 3;

/** The nearest competitors, three to start with and all of them on request, each with distance, rating and reviews. */
export function NearbyList({ clinics }: { clinics: NearbyClinic[] }) {
  const [all, setAll] = useState(false);
  const rows = all ? clinics : clinics.slice(0, SHOWN);
  return (
    <section aria-labelledby="nearby-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="nearby-title" className="text-[15px] font-bold">Nearby competitors</h3>
        {clinics.length > SHOWN && <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="text-sm font-semibold text-primary">{all ? "Show less" : `View all (${clinics.length})`}</button>}
      </div>
      <ul className={clsx("mt-3 divide-y divide-[#f0f1f7]", all && "max-h-[420px] overflow-auto pr-1")}>
        {rows.map((c, i) => (
          <li key={c.placeId} className="flex items-center gap-3 py-3">
            <span className={clsx("grid size-11 shrink-0 place-items-center rounded-xl text-[15px] font-bold", AVATARS[i % AVATARS.length])} aria-hidden>{c.name.trim()[0]?.toUpperCase()}</span>
            <span className="min-w-0">
              <span className="block truncate text-[14.5px] font-semibold">{c.name}</span>
              <span className="block text-[13px] text-ink-grey">
                {distanceLabel(c.distanceKm)}
                {c.rating !== undefined && <> · <b className="text-[#b7791f]">{c.rating.toFixed(1)}★</b>{c.reviewCount !== undefined && <> ({reviewsLabel(c.reviewCount)})</>}</>}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
