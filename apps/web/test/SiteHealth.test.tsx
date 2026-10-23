import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fixtureReport } from "@clinix/contracts/fixtures";
import { DigitalPerformance } from "@/components/report/DigitalPerformance";
import { siteHealthGroups } from "@/lib/siteHealth";

const audit = fixtureReport.siteHealth!;

describe("siteHealthGroups", () => {
  it("sorts the fixture audit into four groups with problems and passes", () => {
    const groups = siteHealthGroups(audit);
    expect(groups.map((g) => g.key)).toEqual(["website_technical", "google_profile", "reviews_reputation", "content_visibility"]);
    const tech = groups[0];
    expect(tech.toFix.map((c) => c.id)).toEqual(["speed_mobile", "alt"]);
    expect(tech.passed.map((c) => c.id)).toEqual(["https", "speed_desktop", "robots", "sitemap", "viewport"]);
    const gbp = groups[1];
    expect(gbp.toFix.map((c) => c.id)).toEqual(["phone_match", "gbp_category"]);
    expect(groups[2].toFix).toHaveLength(2); // fewer recent reviews and replies than rivals
    expect(groups[3].toFix.map((c) => c.id)).toEqual(["sitemap_fresh", "descriptions", "service_pages", "keywords"]);
    expect(groups[3].toFix.find((c) => c.id === "service_pages")?.title).toContain("emergency dentistry, whitening");
    for (const g of groups) for (const c of g.toFix) expect(c.action).toBeTruthy();
  });

  it("keeps only the Google profile checks when there is no website", () => {
    const groups = siteHealthGroups({ ...audit, website: null, pages: [], robots: null, sitemap: null, schemaMarkup: null, serviceCoverage: [], keywordGaps: [], pagespeedMobile: null, pagespeedDesktop: null });
    expect(groups[0].toFix.length + groups[0].passed.length).toBe(0);
    expect(groups[3].toFix.length + groups[3].passed.length).toBe(0);
    expect(groups[1].toFix.map((c) => c.id)).toEqual(["gbp_category"]);
  });
});

describe("DigitalPerformance", () => {
  it("shows problems first with actions, folds passed checks, and opens them on request", () => {
    render(<DigitalPerformance audit={audit} />);
    const tech = screen.getByText("Website and technical").closest("div")!.parentElement!;
    expect(within(tech).getByText("2 to fix")).toBeInTheDocument();
    expect(within(tech).getByText(/Mobile performance 41\/100, main content in 4.8 s/)).toBeInTheDocument();
    expect(within(tech).getAllByText("Recommended action").length).toBe(2);
    expect(within(tech).queryByText("Site served over HTTPS")).toBeNull();
    fireEvent.click(within(tech).getByRole("button", { name: /All 5 passed checks/ }));
    expect(within(tech).getByText("Site served over HTTPS")).toBeInTheDocument();
  });

  it("explains a missing website and a missing audit", () => {
    render(<DigitalPerformance audit={{ ...audit, website: null, pages: [], robots: null, sitemap: null, schemaMarkup: null, serviceCoverage: [], keywordGaps: [], pagespeedMobile: null, pagespeedDesktop: null }} />);
    expect(screen.getByText("No website on file.")).toBeInTheDocument();
    expect(screen.queryByText("Website and technical")).toBeNull();
    render(<DigitalPerformance audit={null} />);
    expect(screen.getByText(/not available this time/)).toBeInTheDocument();
  });
});
