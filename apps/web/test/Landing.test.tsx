import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AnalysisPreview } from "@/components/landing/AnalysisPreview";

describe("landing", () => {
  it("shows one promise, one main button and the trust line", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/growing your clinic/i);
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/start");
    expect(screen.getByText(/no account needed/i)).toBeInTheDocument();
  });
  it("lists four steps in order", () => {
    render(<HowItWorks />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent(/tell us about your clinic/i);
    expect(items[3]).toHaveTextContent(/build your action plan/i);
  });
  it("shows the market overview from the sample with the evidence ledger numbers", () => {
    render(<AnalysisPreview />);
    const card = screen.getByTestId("market-overview");
    expect(card).toHaveTextContent("Sample");
    expect(card).toHaveTextContent(/Verified findings/);
    expect(card).toHaveTextContent(/Set aside/);
  });
  it("never says AI, names a supplier, or sells a demo call", () => {
    const { container } = render(<><Hero /><AnalysisPreview /><HowItWorks /></>);
    expect(container.textContent).not.toMatch(/\bAI\b|Anthropic|Apify|SurrealDB|Google Places|demo|pitch deck|book a/i);
  });
});
