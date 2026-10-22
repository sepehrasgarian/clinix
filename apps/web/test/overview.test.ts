import { describe, expect, it } from "vitest";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import type { NearbyClinic, ScanResult } from "@clinix/contracts";
import { cityFromAddress, insightTiles, nearbyCount } from "@/lib/overview";

const scan = fixtureAnalysis.scan!;
const clinic = (i: number, reviewCount: number, rating: number, distanceKm = i): NearbyClinic => ({ placeId: `p${i}`, name: `Clinic ${i}`, lat: 0, lng: 0, reviewCount, rating, distanceKm });
const withNearby = (nearby: NearbyClinic[], extra: Partial<ScanResult> = {}): ScanResult => ({ ...scan, place: { ...scan.place, reviewCount: 90, rating: 5.0 }, nearby, ...extra });

describe("cityFromAddress", () => {
  it("drops the street, the postal code and the country", () => {
    expect(cityFromAddress("5800 Boul. Cavendish D4, Côte Saint-Luc, QC H4W 2T5, Canada")).toBe("Côte Saint-Luc, QC");
    expect(cityFromAddress("77 Finch Ave E, North York, ON M2N 6H8")).toBe("North York, ON");
    expect(cityFromAddress("1 Main St, Springfield, IL 62704, USA")).toBe("Springfield, IL");
    expect(cityFromAddress("Somewhere")).toBe("");
  });
});

describe("insightTiles", () => {
  const near = [clinic(1, 862, 4.8), clinic(2, 300, 4.5), clinic(3, 90, 4.2), clinic(4, 10, 4.0)];

  it("ranks the clinic by reviews, counts the neighbours and compares the rating with their median", () => {
    const [position, competition, rating] = insightTiles(withNearby(near), "2018");
    expect(position).toMatchObject({ label: "Your position", value: "#3 of 5", note: "by Google reviews among the clinics nearest you" });
    expect(competition).toMatchObject({ value: "4", note: "clinics within 5 km after the same patients" });
    expect(rating).toMatchObject({ value: "5.0★", note: "Higher than the local median (4.4★)" });
  });
  it("adds a + when the search hit its limit, and says below or in line against the median", () => {
    expect(insightTiles(withNearby(near, { nearbyCapped: true }))[1].value).toBe("4+");
    const low = withNearby(near);
    low.place = { ...low.place, rating: 3.9 };
    expect(insightTiles(low)[2].note).toBe("Below the local median (4.4★)");
    low.place = { ...low.place, rating: 4.4 };
    expect(insightTiles(low)[2].note).toBe("In line with the local median (4.4★)");
  });
  it("shows the nearest competitor instead of a rank for a clinic under two years old", () => {
    const [first] = insightTiles(withNearby(near), `${new Date().getFullYear()}`);
    expect(first).toMatchObject({ label: "Nearest competitor", value: "Clinic 1", note: "1 km away · 4.8★ (862 reviews)" });
  });
  it("is honest when it measured nothing: dashes and where the numbers will come from", () => {
    const empty = withNearby([], { competitorCountsPerService: [], place: { ...scan.place, rating: undefined, reviewCount: undefined } });
    const [a, b, c] = insightTiles(empty);
    expect([a.value, b.value, c.value]).toEqual(["—", "—", "—"]);
    expect(a.note).toBe("Measured in your full analysis");
    expect(c.note).toBe("No Google reviews yet");
  });
  it("falls back to the review count for the rating note when there are fewer than three neighbours", () => {
    expect(insightTiles(withNearby([clinic(1, 5, 4.5), clinic(2, 6, 4.4)]))[2].note).toBe("90 Google reviews");
  });
});

describe("nearbyCount", () => {
  it("counts the list, or the busiest service for scans made before the list was kept", () => {
    expect(nearbyCount(withNearby([clinic(1, 1, 4)]))).toBe(1);
    expect(nearbyCount({ ...scan, nearby: [] })).toBe(14);
  });
});
