import { describe, expect, it } from "vitest";
import { humanizeError } from "../../src/lib/errors.js";

describe("humanizeError", () => {
  it("maps internal failures to owner-facing text", () => {
    expect(humanizeError(new Error("Geocoding returned no result"))).toMatch(/address/);
    expect(humanizeError(new Error("No Google listing matched"))).toMatch(/listing/);
    expect(humanizeError(new Error("The matched listing is not a clinic."))).toMatch(/does not look like a clinic/);
    expect(humanizeError(new Error("GOOGLE_PLACES_API_KEY is not set"))).toMatch(/not configured/);
  });
  it("never leaks supplier names", () => {
    for (const m of ["Anthropic rate limit", "Apify actor failed", "SurrealDB write error", "weird"]) {
      const out = humanizeError(new Error(m));
      expect(out).not.toMatch(/anthropic|apify|surreal/i);
    }
  });
});
