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
    const start = screen.getByRole("button", { name: "Continue" });
    expect(start).toBeDisabled();
    expect(screen.getByText(/pick your google listing/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/clinic name/i), { target: { value: "Finch East" } });
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
    fireEvent.change(screen.getByLabelText(/clinic name/i), { target: { value: "Finch" } });
    fireEvent.click(await screen.findByRole("button", { name: /Finch East Family Dental/ }));
    // the listing name says "Dental", so Dentistry is preselected even though Google typed it as a pharmacy
    expect(screen.getByText(/set from your google listing/i)).toBeInTheDocument();
    const start = screen.getByRole("button", { name: "Continue" });
    expect(start).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /yes, this is my clinic/i }));
    expect(start).toBeEnabled();
    fireEvent.click(start);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ businessTypeConfirmed: true }));
  });

  it("allows at most four disciplines", () => {
    render(<ClinicForm onSubmit={vi.fn()} search={vi.fn(async () => [])} marketCard={marketCard} />);
    const box = () => screen.getByRole("combobox", { name: /search services/i });
    for (const name of ["Dentistry", "Dental hygiene", "Physiotherapy", "Chiropractic"]) {
      fireEvent.change(box(), { target: { value: name } });
      fireEvent.click(within(screen.getByRole("listbox")).getAllByRole("option")[0].querySelector("button")!);
    }
    expect(screen.getAllByTestId("chosen-discipline")).toHaveLength(4);
    expect(screen.queryByRole("combobox", { name: /search services/i })).toBeNull();
    expect(screen.getByText(/maximum of 4 disciplines/i)).toBeInTheDocument();
  });

  const pickListing = async (tracked = place) => {
    render(<ClinicForm onSubmit={onSubmitSpy} search={vi.fn(async () => [tracked])} marketCard={marketCard} />);
    fireEvent.change(screen.getByLabelText(/clinic name/i), { target: { value: "Finch" } });
    fireEvent.click(await screen.findByRole("button", { name: /Finch East Family Dental/ }));
  };
  const onSubmitSpy = vi.fn();

  it("takes an Instagram handle or profile link, saves the clean handle, and blocks a wrong one", async () => {
    onSubmitSpy.mockClear();
    await pickListing();
    const go = screen.getByRole("button", { name: "Continue" });
    fireEvent.change(screen.getByLabelText(/^instagram/i), { target: { value: "https://www.instagram.com/finch.east/?hl=en" } });
    expect(go).toBeEnabled();
    fireEvent.click(go);
    expect(onSubmitSpy).toHaveBeenCalledWith(expect.objectContaining({ instagram: "finch.east" }));
    fireEvent.change(screen.getByLabelText(/^instagram/i), { target: { value: "https://facebook.com/finch" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/isn.t an instagram profile/i);
    expect(go).toBeDisabled();
    expect(screen.getByText(/check the instagram profile/i)).toBeInTheDocument();
  });

  it("blocks a website that is not an address and says how to write it", async () => {
    await pickListing();
    const go = screen.getByRole("button", { name: "Continue" });
    fireEvent.change(screen.getByLabelText(/^website/i), { target: { value: "not a site" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/enter it like yourclinic\.com/i);
    expect(screen.getByLabelText(/^website/i)).toHaveAttribute("aria-invalid", "true");
    expect(go).toBeDisabled();
    expect(screen.getByText(/check the website address/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^website/i), { target: { value: "finch-east.ca" } });
    expect(go).toBeEnabled();
  });

  it("suggests the listing that owns the website you typed, and uses it on request", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const owned = { ...place, website: "https://www.fincheast.ca/contact" };
    const search = vi.fn(async () => [owned]);
    render(<ClinicForm onSubmit={vi.fn()} search={search} marketCard={marketCard} />);
    fireEvent.change(screen.getByLabelText(/^website/i), { target: { value: "fincheast.ca" } });
    await vi.advanceTimersByTimeAsync(800);
    const card = await screen.findByRole("group", { name: /suggested listing/i });
    expect(card).toHaveTextContent(/we think this is you/i);
    expect(search).toHaveBeenCalledWith("fincheast.ca", "");
    fireEvent.click(within(card).getByRole("button", { name: "Use this" }));
    expect(screen.getByTestId("listing-card")).toHaveTextContent(owned.name);
    expect(screen.queryByRole("group", { name: /suggested listing/i })).toBeNull();
    vi.useRealTimers();
  });

  it("does not suggest a listing whose website is a different one, and 'Not me' sticks", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const other = { ...place, website: "https://someone-else.ca" };
    const { unmount } = render(<ClinicForm onSubmit={vi.fn()} search={vi.fn(async () => [other])} marketCard={marketCard} />);
    fireEvent.change(screen.getByLabelText(/^website/i), { target: { value: "fincheast.ca" } });
    await vi.advanceTimersByTimeAsync(800);
    expect(screen.queryByRole("group", { name: /suggested listing/i })).toBeNull();
    unmount();
    const mine = { ...place, website: "https://fincheast.ca" };
    render(<ClinicForm onSubmit={vi.fn()} search={vi.fn(async () => [mine])} marketCard={marketCard} />);
    fireEvent.change(screen.getByLabelText(/^website/i), { target: { value: "fincheast.ca" } });
    await vi.advanceTimersByTimeAsync(800);
    fireEvent.click(await screen.findByRole("button", { name: "Not me" }));
    await vi.advanceTimersByTimeAsync(1500);
    expect(screen.queryByRole("group", { name: /suggested listing/i })).toBeNull();
    vi.useRealTimers();
  });

  it("needs an address: Continue stays off while it is empty and the website loses its tracking parameters", async () => {
    const tracked = { ...place, website: "https://www.fincheastdental.ca/?utm_source=GoogleOrganic&utm_medium=GBP" };
    render(<ClinicForm onSubmit={vi.fn()} search={vi.fn(async () => [tracked])} marketCard={marketCard} />);
    fireEvent.change(screen.getByLabelText(/clinic name/i), { target: { value: "Finch" } });
    fireEvent.click(await screen.findByRole("button", { name: /Finch East Family Dental/ }));
    expect(screen.getByLabelText(/^website/i)).toHaveValue("www.fincheastdental.ca");
    const go = screen.getByRole("button", { name: "Continue" });
    expect(go).toBeEnabled();
    fireEvent.change(screen.getByLabelText(/^address/i), { target: { value: "" } });
    expect(go).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^address/i), { target: { value: "100 Main St, Toronto, ON" } });
    expect(go).toBeEnabled();
  });

  it("takes every discipline a clinic's name spells out, but only the first one Google's tags suggest", async () => {
    const multi = { ...place, name: "ALTERMED NDG | ostéo - physio - masso - acu", types: ["medical_clinic", "massage", "physiotherapist", "dentist"] };
    const { unmount } = render(<ClinicForm onSubmit={vi.fn()} search={vi.fn(async () => [multi])} marketCard={marketCard} />);
    fireEvent.change(screen.getByLabelText(/clinic name/i), { target: { value: "Altermed" } });
    fireEvent.click(await screen.findByRole("button", { name: /ALTERMED/ }));
    expect(screen.getAllByTestId("chosen-discipline").map((c) => c.textContent)).toEqual([expect.stringContaining("Osteopathy"), expect.stringContaining("Physiotherapy"), expect.stringContaining("Massage therapy"), expect.stringContaining("Acupuncture")]);
    unmount();
    const tagged = { ...place, name: "Réhabital", types: ["physiotherapist", "massage", "skin_care_clinic", "medical_spa"] };
    render(<ClinicForm onSubmit={vi.fn()} search={vi.fn(async () => [tagged])} marketCard={marketCard} />);
    fireEvent.change(screen.getByLabelText(/clinic name/i), { target: { value: "Reha" } });
    fireEvent.click(await screen.findByRole("button", { name: /Réhabital/ }));
    expect(screen.getAllByTestId("chosen-discipline")).toHaveLength(1);
    expect(screen.getByTestId("chosen-discipline")).toHaveTextContent("Primary");
  });
});
