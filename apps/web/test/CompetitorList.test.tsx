import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureReport } from "@clinix/contracts/fixtures";
import { CompetitorList } from "@/components/competitors/CompetitorList";

vi.mock("@/lib/api", () => ({ logoUrl: () => "/logo.png" }));
const props = { report: fixtureReport, disciplines: ["dentistry" as const, "dental_hygiene" as const], you: { reviews: 90, rating: 5, services: 4 }, findingsHref: "/f" };
const first = fixtureReport.competitors[0];

describe("CompetitorList", () => {
  it("shows one table with the columns, a count on the all pill, and one View details per competitor", () => {
    render(<CompetitorList {...props} />);
    const table = screen.getByRole("table");
    for (const h of ["Clinic", "Distance", "Google rating", "Key services", "Comparison with you"]) expect(within(table).getByRole("columnheader", { name: h })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All clinics/ })).toHaveTextContent(String(fixtureReport.competitors.length));
    expect(screen.getAllByRole("button", { name: /^View details, / }).length).toBeGreaterThanOrEqual(fixtureReport.competitors.length);
  });
  it("narrows the rows by search and says so when nothing matches", () => {
    render(<CompetitorList {...props} />);
    fireEvent.change(screen.getByLabelText("Search by clinic name or service"), { target: { value: "zzzzzz" } });
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(/No clinic matches/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export list/ })).toBeDisabled();
  });
  it("re-orders the rows when the sort changes", () => {
    render(<CompetitorList {...props} />);
    const names = () => within(screen.getByRole("table")).getAllByRole("rowheader").map((r) => r.textContent ?? "");
    const byName = fixtureReport.competitors.map((x) => x.name).sort((x, y) => x.localeCompare(y));
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "name" } });
    expect(names()).toHaveLength(byName.length);
    expect(names()[0]).toContain(byName[0]);
  });
  it("opens the drawer for the chosen competitor and closes it again", () => {
    render(<CompetitorList {...props} />);
    fireEvent.click(screen.getAllByRole("button", { name: `View details, ${first.name}` })[0]);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByRole("heading", { name: first.name })).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "View complete analysis" })).toHaveAttribute("href", "/f");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
