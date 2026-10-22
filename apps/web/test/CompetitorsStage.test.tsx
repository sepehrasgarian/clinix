import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Analysis, CompetitorCandidate } from "@clinix/contracts";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import { CompetitorsStage } from "@/components/onboarding/CompetitorsStage";

vi.mock("@/components/onboarding/CompetitorMap", () => ({ CompetitorMap: () => <div role="img" aria-label="map" /> }));

const cand = (i: number, over: Partial<CompetitorCandidate> = {}): CompetitorCandidate => ({
  place: { placeId: `p${i}`, name: `Clinic ${i}`, address: `${i} Rue Test`, lat: 0, lng: 0, rating: 4.5, reviewCount: 100, types: ["dentist"], sampleReviews: [] },
  distanceKm: i + 1, ring: "local", relevance: 90 - i, flag: "strong", reason: `reason ${i}`, disciplines: ["dentistry"], ...over,
});
const analysis: Analysis = { ...fixtureAnalysis, status: "awaiting_competitors", discovery: { candidates: Array.from({ length: 7 }, (_, i) => cand(i)), selectedPlaceIds: ["p0", "p1", "p2", "p3", "p4"] } };
const box = (name: RegExp | string) => screen.getByRole("checkbox", { name });

describe("CompetitorsStage", () => {
  it("refuses a sixth competitor in one discipline, says so, and allows swapping", () => {
    render(<CompetitorsStage analysis={analysis} disciplines={["dentistry"]} onConfirm={vi.fn()} />);
    expect(screen.getByText("5 selected / 5 maximum")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/maximum of 5/);
    fireEvent.click(box("Select Clinic 5"));
    expect(box("Select Clinic 5")).toHaveAttribute("aria-checked", "false");
    fireEvent.click(box("Select Clinic 0"));
    fireEvent.click(box("Select Clinic 5"));
    expect(box("Select Clinic 5")).toHaveAttribute("aria-checked", "true");
  });

  it("continues with the real count and reports every change in the selection", () => {
    const onConfirm = vi.fn();
    const onSelectionChange = vi.fn();
    render(<CompetitorsStage analysis={analysis} disciplines={["dentistry"]} onConfirm={onConfirm} onSelectionChange={onSelectionChange} />);
    fireEvent.click(box("Select Clinic 4"));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["p0", "p1", "p2", "p3"]);
    fireEvent.click(screen.getByRole("button", { name: "Continue with 4 competitors" }));
    expect(onConfirm).toHaveBeenCalledWith(["p0", "p1", "p2", "p3"]);
  });

  it("restores choices made before leaving, and ignores ids that no longer exist", () => {
    render(<CompetitorsStage analysis={analysis} disciplines={["dentistry"]} onConfirm={vi.fn()} initialSelected={["p6", "gone"]} />);
    expect(box("Select Clinic 6")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Continue with 1 competitor" })).toBeInTheDocument();
  });

  it("never lists the owner's own clinic or a listing repeated under another id", () => {
    const ownId = analysis.scan!.place.placeId;
    const own = cand(8, { place: { ...cand(8).place, placeId: ownId } });
    const twin = cand(9, { place: { ...cand(0).place, placeId: "p_twin" } });
    const a: Analysis = { ...analysis, discovery: { candidates: [own, twin, ...analysis.discovery!.candidates], selectedPlaceIds: [] } };
    render(<CompetitorsStage analysis={a} disciplines={["dentistry"]} onConfirm={vi.fn()} />);
    expect(screen.queryByRole("checkbox", { name: "Select Clinic 8" })).toBeNull();
    expect(screen.getAllByRole("checkbox", { name: "Select Clinic 0" })).toHaveLength(1);
    expect(screen.getByText("7 clinics found for Dentistry")).toBeInTheDocument();
  });

  it("keeps each discipline's choices when switching tabs, and shows each tab's own count", () => {
    const multi = cand(9, { disciplines: ["dentistry", "dental_hygiene"] });
    const hyg = cand(10, { disciplines: ["dental_hygiene"] });
    const a: Analysis = { ...analysis, discovery: { candidates: [multi, hyg], selectedPlaceIds: ["p9"] } };
    render(<CompetitorsStage analysis={a} disciplines={["dentistry", "dental_hygiene"]} onConfirm={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([expect.stringMatching(/Dentistry.*1\/5/), expect.stringMatching(/Dental hygiene.*0\/5/)]);
    expect(screen.queryByRole("checkbox", { name: "Select Clinic 10" })).toBeNull();
    fireEvent.click(tabs[1]);
    fireEvent.click(box("Select Clinic 10"));
    fireEvent.click(tabs[0]);
    expect(box("Select Clinic 9")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Continue with 2 competitors" })).toBeInTheDocument();
  });

  it("searching or filtering never changes what is chosen, and an empty result offers a way back", () => {
    render(<CompetitorsStage analysis={analysis} disciplines={["dentistry"]} onConfirm={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Search clinics/), { target: { value: "zzz" } });
    expect(screen.getByText("No clinics match your search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue with 5 competitors/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
    expect(box("Select Clinic 0")).toBeInTheDocument();
  });

  it("opens details, lets the owner remove from there, and removes from the summary", () => {
    render(<CompetitorsStage analysis={analysis} disciplines={["dentistry"]} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "View details for Clinic 0" }));
    const dialog = screen.getByRole("dialog", { name: "Clinic 0" });
    expect(dialog).toHaveTextContent("reason 0");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove from selection" }));
    expect(box("Select Clinic 0")).toHaveAttribute("aria-checked", "false");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove Clinic 1" }));
    expect(box("Select Clinic 1")).toHaveAttribute("aria-checked", "false");
  });

  it("will not continue with nothing chosen", () => {
    const empty: Analysis = { ...analysis, discovery: { ...analysis.discovery!, selectedPlaceIds: [] } };
    render(<CompetitorsStage analysis={empty} disciplines={["dentistry"]} onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Continue with 0 competitors/ })).toBeDisabled();
  });
});
