"use client";

import { DISCIPLINE_LABELS, type Discipline, type Place } from "@clinix/contracts";
import { Globe, MapPin, Phone, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { copy, fill } from "@/lib/copy";
import { photoUrl, type MarketCard } from "@/lib/api";
import { cleanWebsite } from "@/lib/website";
import { websiteHost } from "@/lib/website";
import { ClinicLogo } from "./ClinicLogo";
import { LiveMap } from "./LiveMap";

const n = (v: number) => v.toLocaleString("en-CA");

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[14px] border border-[#ecedf5] bg-white p-3">
      <p className="text-[26px] leading-none font-bold tracking-[-0.02em]">{value}</p>
      <p className="mt-2 text-[10.5px] leading-tight font-semibold tracking-[0.08em] text-ink-grey uppercase">{label}</p>
    </div>
  );
}

/** "You rank #16 of 20 by review count — the leader has 9.6× your reviews." Falls back to the plain market sentence. */
function marketLine(market: MarketCard, disciplineWord: string) {
  if (market.rank !== undefined && market.total !== undefined && market.reviewGap !== undefined) {
    return <>You rank <b className="text-primary">#{market.rank} of {market.total}</b> by review count — the leader has <b className="text-primary">{market.reviewGap}× your reviews</b>.</>;
  }
  if (market.rank === 1 && market.total) return <>You lead your local market by review count.</>;
  return market.leaderReviewCount
    ? fill(copy.onboarding.marketCard, { nearby: String(market.nearby), discipline: disciplineWord, leader: n(market.leaderReviewCount) })
    : fill(copy.onboarding.marketCardQuiet, { nearby: String(market.nearby), discipline: disciplineWord });
}

/** The live card on the right of step 1: fills in as the owner picks their listing. */
export function ListingCard({ place, services, market, disciplines = [] }: { place: Place | null; services: string[]; market?: MarketCard | null; disciplines?: Discipline[] }) {
  if (!place) {
    return (
      <Card className="flex min-h-64 items-center justify-center p-8 text-center text-sm text-muted">
        {copy.onboarding.previewEmpty}
      </Card>
    );
  }
  const disciplineWord = disciplines[0] ? DISCIPLINE_LABELS[disciplines[0]].toLowerCase() : "nearby";
  const site = cleanWebsite(place.website).replace(/^https?:\/\//, "");
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[20px] border border-[#ecedf5] bg-white p-[18px]" data-testid="listing-card">
        <div className="grid grid-cols-2 gap-3">
          {place.photoName ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl(place.photoName)} alt="" className="h-[110px] w-full rounded-xl object-cover" />
          ) : (
            <div className="h-[110px] w-full rounded-xl bg-primary-soft" aria-hidden />
          )}
          <LiveMap lat={place.lat} lng={place.lng} label={`Map of ${place.name}`} />
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <h2 className="text-[19px] leading-snug font-bold">{place.name}</h2>
          {place.website && <ClinicLogo site={websiteHost(place.website)} placeId={place.placeId} />}
        </div>
        {place.rating !== undefined && (
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-grey">
            <span className="font-bold text-ink tabular-nums">{place.rating.toFixed(1)}</span>
            <Stars rating={place.rating} />
            <span>({place.reviewCount} {copy.common.reviews})</span>
          </div>
        )}
        <ul className="mt-3 space-y-2 text-sm text-ink">
          <li className="flex gap-2.5"><MapPin size={16} aria-hidden className="mt-0.5 shrink-0 text-ink-grey" /> {place.address}</li>
          {site && <li className="flex gap-2.5"><Globe size={16} aria-hidden className="mt-0.5 shrink-0 text-ink-grey" /> <span className="truncate">{site}</span></li>}
          {place.phone && <li className="flex gap-2.5"><Phone size={16} aria-hidden className="mt-0.5 shrink-0 text-ink-grey" /> {place.phone}</li>}
        </ul>
        {services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {services.map((s) => <span key={s} className="rounded-full bg-[#eeefff] px-2.5 py-0.5 text-xs font-medium text-primary">{s}</span>)}
          </div>
        )}
      </div>

      {market && (
        <div className="rounded-[20px] border border-[#ecedf5] bg-white p-[18px]" data-testid="market-card">
          <p className="text-[11px] font-bold tracking-[0.16em] text-ink-grey uppercase">Your local market</p>
          {market.leaderReviewCount !== undefined && (
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <Stat value={String(market.nearby)} label={`Rivals within ${market.radiusKm ?? 5} km`} />
              <Stat value={n(market.leaderReviewCount)} label="Leader's reviews" />
              {market.reviewGap !== undefined ? <Stat value={`${market.reviewGap}×`} label="Review gap" /> : <Stat value={market.averageRating ? market.averageRating.toFixed(1) : "–"} label="Average rating" />}
            </div>
          )}
          <p className="mt-3 flex items-start gap-2.5 rounded-[14px] bg-[#f4f3ff] p-3 text-sm leading-snug text-ink">
            <Users size={16} aria-hidden className="mt-0.5 shrink-0 text-primary" /> <span>{marketLine(market, disciplineWord)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
