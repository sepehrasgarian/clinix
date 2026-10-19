import { describe, expect, it } from "vitest";
import { distanceKm, ringFor } from "../../src/lib/geo.js";

describe("geo", () => {
  it("measures Finch station to Sheppard-Yonge at roughly 2.3 km", () => {
    const d = distanceKm({ lat: 43.7805, lng: -79.4147 }, { lat: 43.7615, lng: -79.4111 });
    expect(d).toBeGreaterThan(2.0);
    expect(d).toBeLessThan(2.4);
  });
  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 43.7, lng: -79.4 }, { lat: 43.7, lng: -79.4 })).toBe(0);
  });
  it("assigns rings at the 2 km and 5 km boundaries", () => {
    expect(ringFor(1.9)).toBe("hyperlocal");
    expect(ringFor(2)).toBe("hyperlocal");
    expect(ringFor(4.9)).toBe("local");
    expect(ringFor(5.1)).toBe("city");
  });
});
