import { isNewClinic, medianStats, reviewRank, type NearbyClinic, type ScanResult } from "@clinix/contracts";

export type Insight = { label: string; value: string; note: string; icon: "trophy" | "users" | "bars" | "pin" };

const POSTAL_CODE = /\s*\b(?:[A-Z]\d[A-Z] ?\d[A-Z]\d|\d{5}(?:-\d{4})?)$/i;

/** "Côte Saint-Luc, QC" from a full Google address: drops the street, the postal code and, when there is one, the country. */
export function cityFromAddress(address: string): string {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return (parts.length >= 4 ? parts.slice(1, -1) : parts.slice(1)).join(", ").replace(POSTAL_CODE, "");
}

const km = (n: number) => `${n.toLocaleString("en-CA", { maximumFractionDigits: 1 })} km`;
const reviews = (n: number) => `${n.toLocaleString("en-CA")} ${n === 1 ? "review" : "reviews"}`;

/** What the nearby clinics are: from the scan, or from the per-service counts of scans made before the list was kept. */
export const nearbyCount = (scan: ScanResult): number => (scan.nearby.length > 0 ? scan.nearby.length : Math.max(0, ...scan.competitorCountsPerService.map((c) => c.count)));

/**
 * The three tiles under "Key insights". A clinic under two years old is not ranked by review count (a young clinic
 * having fewer reviews is not a weakness), so the first tile then shows the nearest competitor instead.
 */
export function insightTiles(scan: ScanResult, opened?: string): Insight[] {
  const { place, nearby } = scan;
  const stats = medianStats(nearby);
  const rank = reviewRank(place.reviewCount, nearby);
  const first: Insight = isNewClinic(opened)
    ? nearestTile(nearby[0])
    : { label: "Your position", icon: "trophy", value: rank ? `#${rank.rank} of ${rank.total}` : "—", note: rank ? "by Google reviews among the clinics nearest you" : "Measured in your full analysis" };

  const count = nearbyCount(scan);
  const second: Insight = { label: "Local competition", icon: "users", value: count > 0 ? `${count}${scan.nearbyCapped ? "+" : ""}` : "—", note: count > 0 ? `clinics within ${scan.radiusKm} km after the same patients` : "Measured in your full analysis" };

  let note: string;
  if (place.rating !== undefined && stats.medianRating !== undefined) {
    const diff = place.rating - stats.medianRating;
    note = `${diff > 0.05 ? "Higher than" : diff < -0.05 ? "Below" : "In line with"} the local median (${stats.medianRating.toFixed(1)}★)`;
  } else {
    note = place.reviewCount ? `${place.reviewCount.toLocaleString("en-CA")} Google reviews` : "No Google reviews yet";
  }
  const third: Insight = { label: "Your rating", icon: "bars", value: place.rating !== undefined ? `${place.rating.toFixed(1)}★` : "—", note };
  return [first, second, third];
}

function nearestTile(c: NearbyClinic | undefined): Insight {
  if (!c) return { label: "Nearest competitor", icon: "pin", value: "—", note: "Measured in your full analysis" };
  const bits = [`${km(c.distanceKm)} away`];
  if (c.rating !== undefined) bits.push(`${c.rating.toFixed(1)}★${c.reviewCount !== undefined ? ` (${reviews(c.reviewCount)})` : ""}`);
  return { label: "Nearest competitor", icon: "pin", value: c.name, note: bits.join(" · ") };
}

export const distanceLabel = km;
export const reviewsLabel = reviews;
