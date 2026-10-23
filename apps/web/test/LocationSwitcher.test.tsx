import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureClinic } from "@clinix/contracts/fixtures";
import { LocationSwitcher } from "@/components/shell/LocationSwitcher";

vi.mock("@/lib/api", () => ({ logoUrl: ({ site }: { site?: string }) => `/logo/${site ?? "x"}` }));
const other = { ...fixtureClinic, id: "clinic_other", name: "Second Clinic" };

beforeEach(() => localStorage.clear());

describe("LocationSwitcher", () => {
  it("shows the clinic's logo from its website, and no list until opened", () => {
    render(<LocationSwitcher clinic={{ ...fixtureClinic, website: "https://www.rehabital.ca/en?utm_source=g" }} clinics={[fixtureClinic]} onSwitch={vi.fn()} />);
    expect(screen.getByTestId("clinic-logo")).toHaveAttribute("src", "/logo/rehabital.ca");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("opens the locations with the count the chosen plan allows, and a way to add one", async () => {
    localStorage.setItem("clinix.onboarding", JSON.stringify({ pending: { plan: "growth" } }));
    render(<LocationSwitcher clinic={fixtureClinic} clinics={[fixtureClinic]} onSwitch={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(fixtureClinic.name) }));
    expect(screen.getByRole("listbox", { name: "Your locations" })).toBeInTheDocument();
    expect(await screen.findByText("1 of 3 used")).toBeInTheDocument();
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(fixtureClinic.name);
    expect(screen.getByRole("link", { name: "Add a location" })).toHaveAttribute("href", "/onboarding");
  });
  it("does not invent a limit when the plan is unknown, and switches to another clinic", () => {
    const onSwitch = vi.fn();
    render(<LocationSwitcher clinic={fixtureClinic} clinics={[fixtureClinic, other]} onSwitch={onSwitch} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(fixtureClinic.name) }));
    expect(screen.getByText("2 locations")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Second Clinic/ }).querySelector("button")!);
    expect(onSwitch).toHaveBeenCalledWith("clinic_other");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("closes on Escape", () => {
    render(<LocationSwitcher clinic={fixtureClinic} clinics={[fixtureClinic]} onSwitch={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(fixtureClinic.name) }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
