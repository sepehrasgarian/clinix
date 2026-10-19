import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Analysis, CompetitorCandidate } from "@clinix/contracts";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import { CompetitorsStage, countPerDiscipline } from "@/components/onboarding/CompetitorsStage";

const cand = (i: number): CompetitorCandidate => ({
  place: { placeId: `p${i}`, name: `Clinic ${i}`, address: "", lat: 0, lng: 0, rating: 4.5, reviewCount: 100, types: ["dentist"], sampleReviews: [] },
  distanceKm: i, ring: "local", relevance: 90 - i, flag: "strong", reason: "r", disciplines: ["dentistry"],
});
const analysis: Analysis = { ...fixtureAnalysis, status: "awaiting_competitors", discovery: { candidates: Array.from({ length: 7 }, (_, i) => cand(i)), selectedPlaceIds: ["p0", "p1", "p2", "p3", "p4"] } };

describe("CompetitorsStage", () => {
  it("counts selections per discipline", () => {
    expect(countPerDiscipline(analysis.discovery!.candidates, ["p0", "p1"], "dentistry")).toBe(2);
  });

  it("refuses a sixth competitor in one discipline and allows swapping", () => {
    render(<CompetitorsStage analysis={analysis} disciplines={["dentistry"]} onConfirm={vi.fn()} />);
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Clinic 5/ }));
    expect(screen.getByRole("button", { name: /Clinic 5/ })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: /Clinic 0/ }));
    fireEvent.click(screen.getByRole("button", { name: /Clinic 5/ }));
    expect(screen.getByRole("button", { name: /Clinic 5/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("confirms the current selection", () => {
    const onConfirm = vi.fn();
    render(<CompetitorsStage analysis={analysis} disciplines={["dentistry"]} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /start the full analysis/i }));
    expect(onConfirm).toHaveBeenCalledWith(["p0", "p1", "p2", "p3", "p4"]);
  });
});
