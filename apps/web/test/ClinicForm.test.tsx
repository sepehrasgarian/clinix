import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClinicForm } from "@/components/onboarding/ClinicForm";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";

const place = fixtureAnalysis.scan!.place;

describe("ClinicForm", () => {
  const marketCard = vi.fn(async () => ({ nearby: 19, leaderName: "North York Smile Centre", leaderReviewCount: 1026, averageRating: 4.8 }));

  it("keeps the start button disabled until a listing and a discipline are chosen, then shows the market card", async () => {
    const onSubmit = vi.fn();
    const search = vi.fn(async () => [place]);
    render(<ClinicForm onSubmit={onSubmit} search={search} marketCard={marketCard} />);
    expect(screen.getByText(/snapshot of your local market will appear here/i)).toBeInTheDocument();
    const start = screen.getByRole("button", { name: /start the quick scan/i });
    expect(start).toBeDisabled();
    expect(screen.getByText(/pick your google listing/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/find your clinic/i), { target: { value: "Finch East" } });
    await waitFor(() => expect(search).toHaveBeenCalledWith("Finch East", ""));
    fireEvent.click(await screen.findByRole("button", { name: /Finch East Family Dental/ }));
    expect(screen.getByTestId("listing-card")).toHaveTextContent("Finch East Family Dental");

    // The listing is typed "dentist", so Dentistry is preselected and the owner only confirms.
    expect(screen.getByText(/set from your google listing/i)).toBeInTheDocument();
    expect(screen.getByTestId("chosen-discipline")).toHaveTextContent("Dentistry");
    expect(start).toBeEnabled();
    expect(screen.getByText(/ready\./i)).toBeInTheDocument();
    expect(await screen.findByTestId("market-card")).toHaveTextContent(/19 dentistry clinics within 5 km; the local leader has 1,026 reviews/);

    fireEvent.click(start);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: place.name, disciplines: ["dentistry"], city: "North York", province: "ON" }));
  });

  it("asks for confirmation when the listing is not typed as a clinic", async () => {
    const pharmacy = { ...place, types: ["pharmacy", "store"] };
    const onSubmit = vi.fn();
    render(<ClinicForm onSubmit={onSubmit} search={vi.fn(async () => [pharmacy])} marketCard={marketCard} />);
    fireEvent.change(screen.getByLabelText(/find your clinic/i), { target: { value: "Finch" } });
    fireEvent.click(await screen.findByRole("button", { name: /Finch East Family Dental/ }));
    // the listing name says "Dental", so Dentistry is preselected even though Google typed it as a pharmacy
    expect(screen.getByText(/set from your google listing/i)).toBeInTheDocument();
    const start = screen.getByRole("button", { name: /start the quick scan/i });
    expect(start).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /yes, this is my clinic/i }));
    expect(start).toBeEnabled();
    fireEvent.click(start);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ businessTypeConfirmed: true }));
  });

  it("allows at most four disciplines", () => {
    render(<ClinicForm onSubmit={vi.fn()} search={vi.fn(async () => [])} marketCard={marketCard} />);
    fireEvent.click(screen.getByRole("button", { name: /choose disciplines/i }));
    const panel = screen.getByRole("region", { name: /choose disciplines/i });
    for (const name of [/Dentistry/, /Dental hygiene/, /Physiotherapy/, /Chiropractic/]) fireEvent.click(within(panel).getByRole("button", { name }));
    expect(within(panel).getByRole("button", { name: /Massage therapy/ })).toBeDisabled();
  });
});
