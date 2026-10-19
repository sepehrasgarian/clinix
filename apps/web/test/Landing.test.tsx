import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SampleMarket } from "@/components/landing/SampleMarket";

describe("landing", () => {
  it("shows one promise, one main button and the trust line", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/clinic down the street/i);
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/start");
    expect(screen.getByText(/no account needed/i)).toBeInTheDocument();
  });
  it("lists four steps in order", () => {
    render(<HowItWorks />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent(/find your clinic/i);
    expect(items[3]).toHaveTextContent(/get your plan/i);
  });
  it("never says AI or names a supplier", () => {
    const { container } = render(<><Hero /><HowItWorks /><SampleMarket /></>);
    expect(container.textContent).not.toMatch(/\bAI\b|Anthropic|Apify|SurrealDB|Google Places/);
  });
});
