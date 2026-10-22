import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import { ListingCard } from "@/components/onboarding/ListingCard";

vi.mock("@/components/onboarding/LiveMap", () => ({ LiveMap: ({ label }: { label: string }) => <div role="img" aria-label={label} /> }));
const place = { ...fixtureAnalysis.scan!.place, website: "https://www.finch.ca/?utm_source=GoogleOrganic", phone: "(289) 796-8503" };

describe("ListingCard", () => {
  it("shows the clinic with a map, rating, address, a clean website and phone", () => {
    render(<ListingCard place={place} services={["Invisalign"]} />);
    const card = screen.getByTestId("listing-card");
    expect(card).toHaveTextContent(place.name);
    expect(screen.getByRole("img", { name: `Map of ${place.name}` })).toBeInTheDocument();
    expect(card).toHaveTextContent(String(place.rating!.toFixed(1)));
    expect(card).toHaveTextContent("www.finch.ca");
    expect(card).not.toHaveTextContent("utm_");
    expect(card).toHaveTextContent("(289) 796-8503");
    expect(card).toHaveTextContent("Invisalign");
  });
  it("shows the clinic's logo from its website, and drops the tile when the site has none", () => {
    render(<ListingCard place={place} services={[]} />);
    const logo = screen.getByTestId("clinic-logo") as HTMLImageElement;
    expect(logo.src).toContain("/api/logo/site/finch.ca");
    fireEvent.error(logo);
    expect(screen.queryByTestId("clinic-logo")).toBeNull();
  });
  it("asks for no logo when the listing has no website", () => {
    render(<ListingCard place={{ ...place, website: undefined }} services={[]} />);
    expect(screen.queryByTestId("clinic-logo")).toBeNull();
  });
  it("shows the local market as three numbers and the clinic's rank", () => {
    render(<ListingCard place={place} services={[]} disciplines={["dentistry"]} market={{ nearby: 19, radiusKm: 5, leaderReviewCount: 862, reviewGap: 9.6, rank: 16, total: 20 }} />);
    const market = screen.getByTestId("market-card");
    expect(market).toHaveTextContent(/your local market/i);
    expect(market).toHaveTextContent(/19\s*rivals within 5 km/i);
    expect(market).toHaveTextContent(/862\s*leader's reviews/i);
    expect(market).toHaveTextContent(/9\.6×\s*review gap/i);
    expect(market).toHaveTextContent("You rank #16 of 20 by review count — the leader has 9.6× your reviews.");
  });
  it("says the clinic leads when it is first, and falls back to the plain sentence without a rank", () => {
    const { rerender } = render(<ListingCard place={place} services={[]} disciplines={["dentistry"]} market={{ nearby: 5, leaderReviewCount: 200, rank: 1, total: 6 }} />);
    expect(screen.getByTestId("market-card")).toHaveTextContent(/you lead your local market/i);
    rerender(<ListingCard place={place} services={[]} disciplines={["dentistry"]} market={{ nearby: 19, leaderReviewCount: 1026 }} />);
    expect(screen.getByTestId("market-card")).toHaveTextContent(/19 dentistry clinics within 5 km; the local leader has 1,026 reviews/);
  });
});
