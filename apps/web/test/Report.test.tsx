import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureAnalysis, fixtureClinic, fixtureReport } from "@clinix/contracts/fixtures";
import { ActionPlan } from "@/components/report/ActionPlan";
import { CompetitorsSection } from "@/components/report/CompetitorsSection";
import { Dashboard } from "@/components/report/Dashboard";
import { Overview } from "@/components/report/Overview";
import { nextMoves, positionOf, rankByReviews } from "@/lib/report";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("report helpers", () => {
  it("ranks the clinic among its competitors by reviews and picks the next three open moves", () => {
    const ranked = rankByReviews(fixtureReport, fixtureAnalysis, "Finch East Family Dental");
    expect(ranked[0].name).toBe("Yonge Smile Studio");
    expect(positionOf(ranked)).toEqual({ rank: 5, of: 5 });
    expect(nextMoves(fixtureReport).map((r) => r.status)).not.toContain("done");
    expect(nextMoves(fixtureReport)).toHaveLength(3);
  });
});

describe("Overview", () => {
  it("states the position, shows four tiles, the next moves and the benchmark table", () => {
    render(<Overview report={fixtureReport} analysis={fixtureAnalysis} clinicId="c" clinicName="Finch East Family Dental" />);
    expect(screen.getByText(/Yonge Smile Studio leads with 310 reviews; you rank #5 of 5/)).toBeInTheDocument();
    expect(screen.getByText("Competitors analyzed")).toBeInTheDocument();
    expect(screen.getByText("Your next 3 moves")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.getByRole("table")).toHaveTextContent(/Google rating/);
  });
});

describe("ActionPlan", () => {
  it("groups actions by week, month and quarter with a tick and an expander", () => {
    render(<ActionPlan report={fixtureReport} clinicId="c" analysisId="a" clinicName="Finch East Family Dental" />);
    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
    expect(screen.getByText(/1 of 7 actions done/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /how to do it/i })[0]);
    const cards = screen.getAllByTestId("evidence-card");
    expect(cards.length).toBeGreaterThan(0);
    // each quote is attributed to the clinic whose review it is, never to the clinic the finding is about
    const byPlace = new Map(fixtureReport.reviews.map((r) => [r.id, r.placeId]));
    const nameOf = (placeId: string) => fixtureReport.competitors.find((c) => c.placeId === placeId)?.name ?? "Finch East Family Dental";
    for (const card of cards) {
      const review = fixtureReport.reviews.find((r) => card.textContent?.includes(r.text.slice(0, 30)));
      if (review) expect(card).toHaveTextContent(nameOf(byPlace.get(review.id)!));
    }
    expect(screen.getByRole("checkbox", { name: /Done: Text patients/ })).toBeChecked();
  });
});

describe("CompetitorsSection", () => {
  it("filters, searches, sorts and opens a card", () => {
    render(<CompetitorsSection report={fixtureReport} disciplines={["dentistry", "dental_hygiene"]} />);
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(4);
    fireEvent.change(screen.getByLabelText(/search by clinic name/i), { target: { value: "sheppard" } });
    const cards = screen.getAllByRole("button", { expanded: false });
    expect(cards).toHaveLength(1);
    fireEvent.click(cards[0]);
    expect(screen.getByText(/What their patients say/)).toBeInTheDocument();
    expect(screen.getByText(/couldn't read their website/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /their website/i })).toHaveAttribute("href", "https://sheppardcentredentistry.example");
    fireEvent.change(screen.getByLabelText(/search by clinic name/i), { target: { value: "zzz" } });
    expect(screen.getByText(/no clinic matches/i)).toBeInTheDocument();
  });
});

describe("CompetitorsSection site facts", () => {
  it("shows the services gap badge, the rival's services with gaps highlighted, and its site facts", () => {
    render(<CompetitorsSection report={fixtureReport} disciplines={["dentistry", "dental_hygiene"]} />);
    expect(screen.getByText("+2 not on your site")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Yonge Smile Studio/ }));
    const services = screen.getByRole("list", { name: /services on their site/i });
    expect(within(services).getByText(/dental implants · not on your site/)).toBeInTheDocument();
    expect(within(services).getByText(/^cleaning$/)).toBeInTheDocument();
    expect(screen.getByText(/Books online with Dentally/)).toBeInTheDocument();
    expect(screen.getByText(/New patients: Free whitening kit/)).toBeInTheDocument();
    expect(screen.getByText(/3 practitioners named/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Willowdale Dental Care/ }));
    expect(screen.getByText(/No website on file/)).toBeInTheDocument();
  });
});

describe("Dashboard", () => {
  it("shows the scoreboard, three moves, where you stand and discipline tabs", () => {
    render(<Dashboard clinic={fixtureClinic} analysis={fixtureAnalysis} report={fixtureReport} />);
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.getByText("Your 3 moves")).toBeInTheDocument();
    expect(screen.getByText("Where you stand")).toBeInTheDocument();
    const tabs = screen.getByRole("tablist", { name: "Scope" });
    fireEvent.click(within(tabs).getByRole("tab", { name: /Dentistry/ }));
    expect(screen.getByText(/wins patients on online booking/)).toBeInTheDocument();
  });
});

describe("review goal and discipline ranking", () => {
  it("builds up to three rungs above the clinic with reviews needed and a pace", async () => {
    const { reviewGoal, rankWithin, isNewClinic } = await import("@/lib/report");
    const ranked = rankByReviews(fixtureReport, fixtureAnalysis, "Finch East Family Dental");
    const steps = reviewGoal(ranked);
    expect(steps).toHaveLength(3);
    expect(steps[0].rank).toBe(4);
    expect(steps[0].reviewsNeeded).toBeGreaterThan(0);
    expect(steps[0].months * steps[0].perMonth).toBeGreaterThanOrEqual(steps[0].reviewsNeeded);
    expect(reviewGoal(ranked.map((r) => ({ ...r, reviewCount: r.isYou ? 999 : r.reviewCount })))).toEqual([]);
    expect(rankWithin(ranked, [fixtureReport.competitors[0].placeId]).map((r) => r.isYou)).toContain(true);
    expect(rankWithin(ranked, [fixtureReport.competitors[0].placeId])).toHaveLength(2);
    expect(isNewClinic("2025-06", new Date("2026-10-19"))).toBe(true);
    expect(isNewClinic("2019", new Date("2026-10-19"))).toBe(false);
    expect(isNewClinic(undefined)).toBe(false);
  });

  it("renders the review goal and the ranked table inside a discipline tab", async () => {
    const { DisciplineTabs } = await import("@/components/report/DisciplineTabs");
    render(<DisciplineTabs report={fixtureReport} analysis={fixtureAnalysis} clinicName="Finch East Family Dental" clinicId="c" analysisId="a" />);
    expect(screen.getByText("Your position")).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent(/\(you\)/);
    expect(screen.getByText("Leader")).toBeInTheDocument();
    expect(screen.getByText("Offered by rivals, not by you")).toBeInTheDocument();
    expect(screen.getByText("sedation dentistry")).toBeInTheDocument();
    render(<Overview report={fixtureReport} analysis={fixtureAnalysis} clinicId="c" clinicName="Finch East Family Dental" opened="2026-01" />);
    expect(screen.getByText(/Build reviews steadily/)).toBeInTheDocument();
    expect(screen.getAllByText(/Reach #/).length).toBeGreaterThan(0);
  });
});
