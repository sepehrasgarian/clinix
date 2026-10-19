import { Place, Review } from "@clinix/contracts";
import type { LatLng } from "../lib/geo.js";

/**
 * Google Places API (New) + Geocoding. Reviews come back with the author removed:
 * we never store reviewer names or photos.
 */
export type Fetcher = typeof fetch;

const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.types",
  "places.primaryType",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.photos.name",
].join(",");

const DETAIL_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "websiteUri",
  "nationalPhoneNumber",
  "types",
  "primaryType",
  "regularOpeningHours.weekdayDescriptions",
  "photos.name",
  "reviews",
].join(",");

type RawPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  types?: string[];
  primaryType?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: { name: string }[];
  reviews?: { rating?: number; text?: { text?: string }; publishTime?: string }[];
};

export class PlacesClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: Fetcher = fetch,
  ) {}

  async geocode(address: string): Promise<{ location: LatLng; formattedAddress: string } | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
    const res = await this.fetchImpl(url);
    if (!res.ok) throw new Error(`Geocoding failed with ${res.status}`);
    const body = (await res.json()) as { results?: { geometry: { location: LatLng }; formatted_address: string }[] };
    const first = body.results?.[0];
    return first ? { location: first.geometry.location, formattedAddress: first.formatted_address } : null;
  }

  async searchText(query: string, opts: { near?: LatLng; radiusM?: number; max?: number } = {}): Promise<Place[]> {
    const body: Record<string, unknown> = { textQuery: query, maxResultCount: Math.min(opts.max ?? 10, 20) };
    if (opts.near) {
      body.locationBias = { circle: { center: { latitude: opts.near.lat, longitude: opts.near.lng }, radius: opts.radiusM ?? 5000 } };
    }
    const res = await this.fetchImpl("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": this.apiKey, "X-Goog-FieldMask": SEARCH_FIELDS },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Places search failed with ${res.status}`);
    const data = (await res.json()) as { places?: RawPlace[] };
    return (data.places ?? []).map(toPlace);
  }

  /** Streams a listing photo. The browser never sees the API key; the API proxies the bytes. */
  async photo(photoName: string, maxWidthPx = 480): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${this.apiKey}`;
    const res = await this.fetchImpl(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Place photo failed with ${res.status}`);
    return { bytes: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "image/jpeg" };
  }

  async details(placeId: string): Promise<Place | null> {
    const res = await this.fetchImpl(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": this.apiKey, "X-Goog-FieldMask": DETAIL_FIELDS },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Place details failed with ${res.status}`);
    return toPlace((await res.json()) as RawPlace);
  }
}

export function toPlace(raw: RawPlace): Place {
  const sampleReviews: Review[] = (raw.reviews ?? [])
    .filter((r) => r.text?.text && r.rating && r.publishTime)
    .map((r, i) => ({
      id: `rev_${raw.id}_g${i}`,
      placeId: raw.id,
      rating: r.rating!,
      text: r.text!.text!,
      publishedAt: r.publishTime!,
      source: "places" as const,
    }));
  return Place.parse({
    placeId: raw.id,
    name: raw.displayName?.text ?? "Unknown",
    address: raw.formattedAddress ?? "",
    lat: raw.location?.latitude ?? 0,
    lng: raw.location?.longitude ?? 0,
    rating: raw.rating,
    reviewCount: raw.userRatingCount,
    website: raw.websiteUri,
    phone: raw.nationalPhoneNumber,
    types: [...new Set([raw.primaryType, ...(raw.types ?? [])].filter(Boolean))] as string[],
    hours: raw.regularOpeningHours?.weekdayDescriptions,
    photoName: raw.photos?.[0]?.name,
    sampleReviews,
  });
}

const CLINIC_TYPES = new Set(["dentist", "dental_clinic", "physiotherapist", "chiropractor", "doctor", "medical_clinic", "health", "spa", "massage", "wellness_center", "skin_care_clinic"]);
const NON_CLINIC_TYPES = new Set(["hospital", "pharmacy", "drugstore", "supermarket", "store", "insurance_agency", "school"]);

export function classifyBusiness(types: string[]): "clinic" | "non_clinic" | "unknown" {
  if (types.some((t) => CLINIC_TYPES.has(t))) return "clinic";
  if (types.some((t) => NON_CLINIC_TYPES.has(t))) return "non_clinic";
  return "unknown";
}
