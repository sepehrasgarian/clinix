import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalysisPreview } from "@/components/landing/AnalysisPreview";
import { CaseSnapshots } from "@/components/landing/CaseSnapshots";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Stats } from "@/components/landing/Stats";

describe("landing", () => {
  it("shows one promise, one main button and the three reassurances", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/growing your clinic/i);
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/start");
    expect(screen.getByText(/30-minute walkthrough/i)).toBeInTheDocument();
  });
  it("lists four steps in order", () => {
    render(<HowItWorks />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent(/tell us about your clinic/i);
    expect(items[3]).toHaveTextContent(/build your action plan/i);
  });
  it("labels the market overview as a sample preview", () => {
    render(<AnalysisPreview />);
    const card = screen.getByTestId("market-overview");
    expect(card).toHaveTextContent("Sample preview");
    expect(card).toHaveTextContent(/#4 of 7/);
    expect(card).toHaveTextContent(/Close the review gap/);
  });
  it("footnotes the industry figures as research, not a guarantee", () => {
    render(<Stats />);
    expect(screen.getByText(/not a guarantee of results/i)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });
  it("marks every case scenario as illustrative", () => {
    render(<CaseSnapshots />);
    expect(screen.getByText(/not individual client results/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Illustrative · 90 days/)).toHaveLength(3);
  });
  it("prices the plans from the monthly rate, annual being ten months", () => {
    render(<Pricing />);
    expect(screen.getByText("$124.17")).toBeInTheDocument();
    expect(screen.getByText("$290.83")).toBeInTheDocument();
    expect(screen.getByText("$665.83")).toBeInTheDocument();
    expect(screen.getByText(/\$3,490 \/ year, paid upfront · or \$349 month to month/)).toBeInTheDocument();
    const popular = screen.getByText(/most popular/i).closest("div");
    expect(within(popular as HTMLElement).getByText("Growth")).toBeInTheDocument();
  });
  it("never says AI or names a supplier", () => {
    const { container } = render(<><Hero /><AnalysisPreview /><HowItWorks /><Stats /><CaseSnapshots /><Pricing /></>);
    expect(container.textContent).not.toMatch(/\bAI\b|Anthropic|Apify|SurrealDB|Google Places/i);
  });
});
