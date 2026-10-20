import { DISCIPLINE_LABELS, type Discipline, type Place } from "@clinix/contracts";
import { Globe, MapPin, Phone, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { copy, fill } from "@/lib/copy";
import { photoUrl, type MarketCard } from "@/lib/api";

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
  const marketText = market
    ? market.leaderReviewCount
      ? fill(copy.onboarding.marketCard, { nearby: String(market.nearby), discipline: disciplineWord, leader: market.leaderReviewCount.toLocaleString("en-CA") })
      : fill(copy.onboarding.marketCardQuiet, { nearby: String(market.nearby), discipline: disciplineWord })
    : null;
  return (
    <Card className="overflow-hidden border-line/70 bg-surface/40" data-testid="listing-card">
      {place.photoName ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl(place.photoName)} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-24 w-full bg-primary-soft" aria-hidden />
      )}
      <div className="p-5">
        <h2 className="text-lg font-semibold leading-snug">{place.name}</h2>
        {place.rating !== undefined && (
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Stars rating={place.rating} />
            <span className="font-mono tabular-nums">{place.rating.toFixed(1)}</span>
            <span>· {place.reviewCount} {copy.common.reviews}</span>
          </div>
        )}
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          <li className="flex gap-2"><MapPin size={16} aria-hidden className="mt-0.5 shrink-0" /> {place.address}</li>
          {place.website && <li className="flex gap-2"><Globe size={16} aria-hidden className="mt-0.5 shrink-0" /> <span className="truncate">{place.website.replace(/^https?:\/\//, "")}</span></li>}
          {place.phone && <li className="flex gap-2"><Phone size={16} aria-hidden className="mt-0.5 shrink-0" /> {place.phone}</li>}
        </ul>
        {services.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {services.map((s) => <span key={s} className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">{s}</span>)}
          </div>
        )}
        {marketText && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-primary-soft p-3 text-sm text-primary" data-testid="market-card">
            <Users size={16} aria-hidden className="mt-0.5 shrink-0" /> {marketText}
          </p>
        )}
      </div>
    </Card>
  );
}
