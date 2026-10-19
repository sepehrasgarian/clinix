import { describe, expect, it, vi } from "vitest";
import { PlacesClient, classifyBusiness, toPlace } from "../../src/clients/places.js";

const rawPlace = {
  id: "ChIJabc",
  displayName: { text: "Yonge Smile Studio" },
  formattedAddress: "5000 Yonge St, North York, ON",
  location: { latitude: 43.77, longitude: -79.41 },
  rating: 4.8,
  userRatingCount: 310,
  websiteUri: "https://yongesmile.example",
  types: ["dentist", "health", "point_of_interest"],
  primaryType: "dentist",
  regularOpeningHours: { weekdayDescriptions: ["Monday: 9 AM – 6 PM"] },
  reviews: [
    { rating: 5, text: { text: "Booked online, open Saturdays." }, publishTime: "2026-09-14T03:12:00Z", authorAttribution: { displayName: "Jane Doe", photoUri: "x" } },
    { rating: 4, text: {}, publishTime: "2026-09-01T00:00:00Z" },
  ],
};

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("toPlace", () => {
  it("maps the Places payload to the contract and strips reviewer identity", () => {
    const place = toPlace(rawPlace);
    expect(place).toMatchObject({ placeId: "ChIJabc", name: "Yonge Smile Studio", rating: 4.8, reviewCount: 310, lat: 43.77 });
    expect(place.types[0]).toBe("dentist");
    expect(place.sampleReviews).toHaveLength(1);
    expect(JSON.stringify(place)).not.toContain("Jane Doe");
    expect(place.sampleReviews[0]).toMatchObject({ source: "places", rating: 5, placeId: "ChIJabc" });
  });
});

describe("PlacesClient", () => {
  it("sends a text search with a location bias and the field mask", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ places: [rawPlace] }));
    const client = new PlacesClient("key", fetchImpl as unknown as typeof fetch);
    const results = await client.searchText("dentist near Finch", { near: { lat: 43.78, lng: -79.41 }, radiusM: 2000, max: 5 });
    expect(results).toHaveLength(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("places:searchText");
    expect((init.headers as Record<string, string>)["X-Goog-Api-Key"]).toBe("key");
    expect((init.headers as Record<string, string>)["X-Goog-FieldMask"]).toContain("places.rating");
    expect(JSON.parse(init.body as string)).toMatchObject({ textQuery: "dentist near Finch", maxResultCount: 5, locationBias: { circle: { radius: 2000 } } });
  });

  it("geocodes an address", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ results: [{ geometry: { location: { lat: 43.78, lng: -79.41 } }, formatted_address: "77 Finch Ave E" }] }));
    const client = new PlacesClient("key", fetchImpl as unknown as typeof fetch);
    expect(await client.geocode("77 Finch Ave E Toronto")).toEqual({ location: { lat: 43.78, lng: -79.41 }, formattedAddress: "77 Finch Ave E" });
  });

  it("returns null for an unknown place id and throws on other errors", async () => {
    const notFound = new PlacesClient("key", (async () => jsonResponse({}, 404)) as unknown as typeof fetch);
    expect(await notFound.details("nope")).toBeNull();
    const broken = new PlacesClient("key", (async () => jsonResponse({}, 500)) as unknown as typeof fetch);
    await expect(broken.searchText("x")).rejects.toThrow(/500/);
  });
});

describe("classifyBusiness", () => {
  it("recognises clinics, non-clinics and unknowns", () => {
    expect(classifyBusiness(["dentist", "health"])).toBe("clinic");
    expect(classifyBusiness(["pharmacy", "store"])).toBe("non_clinic");
    expect(classifyBusiness(["point_of_interest"])).toBe("unknown");
  });
});
