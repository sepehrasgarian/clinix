import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ScanHint } from "@clinix/contracts";
import { HintList, hintHeadline } from "@/components/onboarding/HintList";

const gap: ScanHint = { kind: "review_gap", tone: "problem", yours: 12, nearby: 87, nearbyCount: 9, text: "You have 12 Google reviews. The 9 clinics nearest you have a median of 87.", why: "Patients compare review counts before they book." };

describe("hintHeadline", () => {
  it("words each hint from its numbers", () => {
    expect(hintHeadline(gap)).toBe("Your 12 reviews against a nearby median of 87");
    expect(hintHeadline({ kind: "rating_gap", yours: 4.1, nearby: 4.5, text: "" })).toBe("Your 4.1★ rating against a nearby median of 4.5★");
    expect(hintHeadline({ kind: "rating_strength", yours: 5, nearby: 4.5, text: "" })).toBe("Your 5.0★ rating is at or above the nearby median of 4.5★");
    expect(hintHeadline({ kind: "crowded_market", nearbyCount: 26, atLeast: true, text: "" })).toBe("26+ clinics within 5 km");
    expect(hintHeadline({ kind: "no_website", text: "There's no website on your Google profile." })).toBe("No website on your Google profile");
  });
  it("falls back to the saved sentence for an older scan without numbers", () => {
    expect(hintHeadline({ kind: "review_gap", text: "You have 20 Google reviews. The 28 clinics nearest you have a median of 310." })).toBe("You have 20 Google reviews. The 28 clinics nearest you have a median of 310.");
    expect(hintHeadline({ kind: "crowded_market", text: "28 clinics within 5 km are after the same patients." })).toBe("28 clinics within 5 km are after the same patients.");
  });
});

describe("HintList", () => {
  it("shows the headline, the tone label, why it matters and how many clinics it was measured over", () => {
    render(<HintList hints={[gap, { kind: "rating_strength", yours: 4.8, nearby: 4.5, nearbyCount: 9, text: "" }]} />);
    expect(screen.getByText("Your 12 reviews against a nearby median of 87")).toBeInTheDocument();
    expect(screen.getByText("To improve:")).toBeInTheDocument();
    expect(screen.getByText("Strength:")).toBeInTheDocument();
    expect(screen.getByText(/compare review counts before they book\. Measured over the 9 clinics nearest you\./)).toBeInTheDocument();
    expect(screen.getByText("Your full action plan")).toBeInTheDocument();
  });
  it("derives the tone from the kind when an older scan has none", () => {
    render(<HintList hints={[{ kind: "no_website", text: "There's no website on your Google profile." }]} />);
    expect(screen.getByText("To improve:")).toBeInTheDocument();
    expect(screen.getByText("No website on your Google profile")).toBeInTheDocument();
  });
  it("says so in one line when nothing was measured, and still offers the full plan", () => {
    render(<HintList hints={[]} />);
    expect(screen.getByText(/nothing stood out from the measurements/i)).toBeInTheDocument();
    expect(screen.getByText("Your full action plan")).toBeInTheDocument();
  });
});
