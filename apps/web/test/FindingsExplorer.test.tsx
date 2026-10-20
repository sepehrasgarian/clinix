import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FindingsExplorer } from "@/components/findings/FindingsExplorer";
import { fixtureReport, fixtureReviews } from "@clinix/contracts/fixtures";
import type { Report } from "@clinix/contracts";

const render_ = () => render(<FindingsExplorer report={fixtureReport} reviews={fixtureReviews} clinicName="Finch East Family Dental" disciplines={["dentistry"]} />);

describe("FindingsExplorer", () => {
  it("groups kept findings by who they are about, your clinic first and open", () => {
    render_();
    const nav = screen.getByRole("navigation", { name: "Findings" });
    const groups = within(nav).getAllByRole("button", { expanded: true });
    expect(groups[0]).toHaveTextContent(/Finch East Family Dental \(you\)/);
    expect(within(groups[0]).getByText(/^1 findings$/)).toBeInTheDocument();
    const cards = screen.getAllByTestId("evidence-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    const names = ["Finch East Family Dental", ...fixtureReport.competitors.map((c) => c.name)];
    for (const card of cards) expect(names.some((n) => card.textContent?.includes(n))).toBe(true);
    expect(screen.queryByText(/^Competitor$/)).toBeNull();
  });

  it("opens a competitor group and selects a finding there", () => {
    render_();
    const nav = screen.getByRole("navigation", { name: "Findings" });
    fireEvent.click(within(nav).getByRole("button", { name: /Willowdale Dental Care/ }));
    fireEvent.click(within(nav).getByRole("button", { name: /Korean and Mandarin/ }));
    expect(screen.getByRole("heading", { level: 2, name: /Korean and Mandarin/ })).toBeInTheDocument();
  });

  it("filters by kind and reveals set-aside findings with their reason", () => {
    render_();
    fireEvent.click(screen.getByRole("button", { name: /Why patients switch/ }));
    const nav = screen.getByRole("navigation", { name: "Findings" });
    expect(within(nav).queryByRole("button", { name: /Willowdale/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /All kinds/ }));
    fireEvent.click(screen.getByRole("button", { name: /show set-aside/i }));
    fireEvent.click(within(nav).getByRole("button", { name: /Bayview Village Dental/ }));
    fireEvent.click(within(nav).getByRole("button", { name: /no parking/i }));
    expect(screen.getByText(/was not found in any stored review/i)).toBeInTheDocument();
  });

  it("shows six findings per clinic and the rest behind Show more", () => {
    const own = fixtureReport.findings.find((f) => f.competitorPlaceId === null && f.status === "kept")!;
    const many: Report = { ...fixtureReport, findings: Array.from({ length: 10 }, (_, i) => ({ ...own, id: `f_many_${i}`, claim: `Claim number ${i}` })) };
    render(<FindingsExplorer report={many} reviews={fixtureReviews} clinicName="Finch East Family Dental" disciplines={["dentistry"]} />);
    const nav = screen.getByRole("navigation", { name: "Findings" });
    expect(within(nav).getAllByText(/^Claim number/)).toHaveLength(6);
    fireEvent.click(within(nav).getByRole("button", { name: "Show 4 more" }));
    expect(within(nav).getAllByText(/^Claim number/)).toHaveLength(10);
    fireEvent.click(within(nav).getByRole("button", { name: "Show fewer" }));
    expect(within(nav).getAllByText(/^Claim number/)).toHaveLength(6);
  });
});
