import type { Place, ScanHint } from "@clinix/contracts";

export type MarketStats = {
  /** Highest review count among nearby same-discipline clinics. */
  leaderReviewCount?: number;
  leaderName?: string;
  /** Average rating of nearby same-discipline clinics. */
  averageRating?: number;
  /** Number of nearby clinics offering the most crowded service. */
  crowdedService?: { service: string; count: number };
};

/** Up to three measured facts shown right after the quick scan. Never estimates, never "patients lost". */
export function buildScanHints(place: Place, market: MarketStats, opts: { clinicIsNew?: boolean } = {}): ScanHint[] {
  const hints: ScanHint[] = [];

  if (!opts.clinicIsNew && market.leaderReviewCount && place.reviewCount !== undefined && market.leaderReviewCount > place.reviewCount * 1.5) {
    hints.push({
      kind: "review_gap",
      text: `${market.leaderName ?? "The leading clinic nearby"} has ${market.leaderReviewCount} reviews; you have ${place.reviewCount}.`,
    });
  }

  if (place.rating !== undefined && market.averageRating !== undefined) {
    const diff = Math.round((place.rating - market.averageRating) * 10) / 10;
    if (diff <= -0.2) {
      hints.push({ kind: "rating_gap", text: `Your ${place.rating.toFixed(1)} rating is below the local average of ${market.averageRating.toFixed(1)}.` });
    } else if (diff >= 0.1) {
      hints.push({ kind: "rating_strength", text: `Your ${place.rating.toFixed(1)} rating is above the local average of ${market.averageRating.toFixed(1)}.` });
    }
  }

  if (!place.website) {
    hints.push({ kind: "no_website", text: "Your Google listing has no website. Patients comparing clinics cannot read about you." });
  }

  if (market.crowdedService && market.crowdedService.count >= 8) {
    hints.push({ kind: "crowded_market", text: `${market.crowdedService.count} clinics within 5 km offer ${market.crowdedService.service}.` });
  }

  return hints.slice(0, 3);
}

/** A clinic under two years old is "new": its review count is not yet a fair comparison. */
export function isNewClinic(opened: string | undefined, now = new Date()): boolean {
  if (!opened) return false;
  const [y, m = "01"] = opened.split("-");
  const openedDate = new Date(Number(y), Number(m) - 1, 1);
  const twoYears = 2 * 365.25 * 24 * 3600 * 1000;
  return now.getTime() - openedDate.getTime() < twoYears;
}
