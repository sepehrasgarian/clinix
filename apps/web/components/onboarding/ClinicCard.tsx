"use client";

import { useState } from "react";
import { Link2, MapPin } from "lucide-react";
import type { Place } from "@clinix/contracts";
import { photoUrl } from "@/lib/api";
import { cityFromAddress } from "@/lib/overview";
import { cleanWebsite, websiteHost } from "@/lib/website";
import { ClinicLogo } from "./ClinicLogo";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** The clinic in one row: its photo (or a building), name, where it is and its site, and its logo on the right. */
export function ClinicCard({ place }: { place: Pick<Place, "placeId" | "name" | "address" | "website" | "photoName"> }) {
  const site = cleanWebsite(place.website);
  const host = site ? websiteHost(site) : null;
  const [noLogo, setNoLogo] = useState(false);
  const city = cityFromAddress(place.address);
  return (
    <div className="flex items-center gap-[18px] rounded-[22px] border border-[#ecedf5] bg-white p-[16px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" data-testid="clinic-card">
      {place.photoName ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl(place.photoName)} alt="" className="h-[76px] w-[120px] shrink-0 rounded-xl object-cover" />
      ) : host && !noLogo ? (
        <ClinicLogo site={host} fill onMissing={() => setNoLogo(true)} />
      ) : (
        <span className="grid size-[56px] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#eeefff] to-[#e2e4ff] text-[19px] font-bold text-primary" aria-hidden>{initials(place.name)}</span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[17px] font-bold">{place.name}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13.5px] text-ink-grey">
          {city && <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden />{city}</span>}
          {site && <a href={site} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary"><Link2 size={14} aria-hidden />{site.replace(/^https?:\/\//, "")}</a>}
        </div>
      </div>
      {place.photoName && host && <span className="hidden sm:block"><ClinicLogo site={host} /></span>}
    </div>
  );
}
