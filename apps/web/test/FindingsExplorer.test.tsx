import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FindingsExplorer } from "@/components/findings/FindingsExplorer";
import { fixtureReport, fixtureReviews } from "@clinix/contracts/fixtures";

describe("FindingsExplorer", () => {
  it("lists only kept findings by default and selects the first one", () => {
    render(<FindingsExplorer report={fixtureReport} reviews={fixtureReviews} clinicName="Finch East Family Dental" />);
    const list = screen.getByRole("navigation", { name: "Findings" });
    expect(within(list).getAllByRole("button")).toHaveLength(6);
    expect(screen.getByRole("heading", { level: 2, name: fixtureReport.findings[0].claim })).toBeInTheDocument();
    expect(screen.getAllByTestId("evidence-card").length).toBeGreaterThanOrEqual(2);
  });

  it("reveals set-aside findings with their rejection reason", () => {
    render(<FindingsExplorer report={fixtureReport} reviews={fixtureReviews} clinicName="Finch East Family Dental" />);
    fireEvent.click(screen.getByRole("button", { name: /show set-aside/i }));
    const list = screen.getByRole("navigation", { name: "Findings" });
    expect(within(list).getAllByRole("button")).toHaveLength(8);
    fireEvent.click(within(list).getByRole("button", { name: /no parking/i }));
    expect(screen.getByText(/was not found in any stored review/i)).toBeInTheDocument();
  });

  it("filters by competitor", () => {
    render(<FindingsExplorer report={fixtureReport} reviews={fixtureReviews} clinicName="Finch East Family Dental" />);
    fireEvent.click(screen.getByRole("button", { name: "Willowdale Dental Care" }));
    const list = screen.getByRole("navigation", { name: "Findings" });
    expect(within(list).getAllByRole("button")).toHaveLength(2);
  });
});
