import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Analysis, CompetitorCandidate } from "@clinix/contracts";
import { fixtureAnalysis, fixtureClinic } from "@clinix/contracts/fixtures";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

const api = vi.hoisted(() => ({ getAnalysis: vi.fn(), confirmCompetitors: vi.fn(), createClinic: vi.fn(), updateClinic: vi.fn(), startAnalysis: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({ ...(await original<typeof import("@/lib/api")>()), getAnalysis: api.getAnalysis, confirmCompetitors: api.confirmCompetitors, createClinic: api.createClinic, updateClinic: api.updateClinic, startAnalysis: api.startAnalysis }));

const cand = (i: number): CompetitorCandidate => ({
  place: { placeId: `p${i}`, name: `Clinic ${i}`, address: "", lat: 0, lng: 0, rating: 4.5, reviewCount: 100, types: ["dentist"], sampleReviews: [] },
  distanceKm: i, ring: "local", relevance: 90 - i, flag: "strong", reason: "r", disciplines: ["dentistry"],
});
const analysis: Analysis = { ...fixtureAnalysis, stage: "discovery", status: "awaiting_competitors", discovery: { candidates: [cand(0), cand(1), cand(2)], selectedPlaceIds: ["p0", "p1"] } };
const KEY = "clinix.onboarding";
const save = (extra: object = {}) => localStorage.setItem(KEY, JSON.stringify({ clinic: fixtureClinic, analysisId: analysis.id, ...extra }));
const go = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
/** Fills the demo checkout with a test card and pays. */
const pay = () => {
  type(/Billing contact full name/, "Hasan A.");
  type(/Billing email/, "hasan@clinic.ca");
  type(/Postal code/, "M2N 5S3");
  type(/Name on card/, "Hasan A.");
  type(/Card number/, "4242424242424242");
  type(/Expiration date/, "1229");
  type(/Security code/, "123");
  go(/^Pay CAD/);
};

beforeEach(() => {
  localStorage.clear();
  api.getAnalysis.mockReset().mockResolvedValue(analysis);
  api.confirmCompetitors.mockReset().mockResolvedValue(undefined);
  api.createClinic.mockReset().mockResolvedValue(fixtureClinic);
  api.updateClinic.mockReset().mockResolvedValue(fixtureClinic);
  api.startAnalysis.mockReset().mockResolvedValue(analysis);
  vi.mocked(useRouter().push).mockClear();
});

describe("setup after the competitors", () => {
  it("goes plan, payment, connect, and only then starts the analysis with the competitors that were chosen", async () => {
    save();
    render(<OnboardingFlow />);
    await screen.findByRole("heading", { level: 1, name: "Choose your competitors" });
    fireEvent.click(screen.getByRole("button", { name: "Continue with 2 competitors" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Let's find the right plan for your clinic." })).toBeInTheDocument();
    expect(api.confirmCompetitors).not.toHaveBeenCalled();
    go("Continue");
    fireEvent.click(screen.getByRole("checkbox", { name: /Attract more local patients/ }));
    go("Continue");
    go("Continue with this plan");
    expect(await screen.findByRole("heading", { level: 1, name: "Complete your subscription" })).toBeInTheDocument();
    pay();
    expect(await screen.findByRole("heading", { level: 1, name: "Your clinic is ready for Clinx." }, { timeout: 3000 })).toBeInTheDocument();
    go(/start my first analysis/i);
    await waitFor(() => expect(api.confirmCompetitors).toHaveBeenCalledWith(fixtureClinic.id, analysis.id, ["p0", "p1"]));
    await waitFor(() => expect(useRouter().push).toHaveBeenCalledWith(`/app/clinics/${fixtureClinic.id}/run/${analysis.id}`));
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("keeps the owner's place: coming back mid-way resumes on the same step with the same choice", async () => {
    save({ pending: { placeIds: ["p0"], step: "payment", plan: "scale", billing: "monthly" } });
    render(<OnboardingFlow />);
    expect(await screen.findByRole("heading", { level: 1, name: "Complete your subscription" })).toBeInTheDocument();
    expect(screen.getByText("Clinx Scale")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Monthly/ })).toBeChecked();
  });

  it("Back from the plan returns to the competitors list", async () => {
    save({ pending: { placeIds: ["p0"], step: "plan", plan: "growth", billing: "annual" } });
    render(<OnboardingFlow />);
    fireEvent.click(await screen.findByRole("button", { name: /back to what we found/i }));
    expect(await screen.findByText(/clinics found for/i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(KEY)!).pending).toBeUndefined();
  });
});

describe("going back to change the clinic", () => {
  it("saves the changes to the same clinic instead of creating another one", async () => {
    save();
    render(<OnboardingFlow />);
    fireEvent.click(await screen.findByRole("button", { name: /back to what we found/i }));
    fireEvent.click(await screen.findByRole("button", { name: /back to your clinic/i }));
    fireEvent.click(await screen.findByRole("button", { name: /save and continue/i }));
    await waitFor(() => expect(api.updateClinic).toHaveBeenCalledWith(fixtureClinic.id, expect.objectContaining({ name: fixtureClinic.name })));
    expect(api.createClinic).not.toHaveBeenCalled();
  });
});
