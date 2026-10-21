import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompareTable } from "@/components/pricing/CompareTable";
import { PlanFinder } from "@/components/pricing/PlanFinder";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { money, monthlyPrice, recommendPlan, whole, yearlyPerMonth, yearlyPrice } from "@/lib/pricing";

describe("pricing numbers", () => {
  it("bills a year as ten months and shows it per month", () => {
    expect(yearlyPrice("growth")).toBe(3490);
    expect(money(yearlyPerMonth("essential"))).toBe("$124.17");
    expect(money(yearlyPerMonth("growth"))).toBe("$290.83");
    expect(money(yearlyPerMonth("scale"))).toBe("$665.83");
    expect(whole(monthlyPrice.scale)).toBe("$799");
  });
});

describe("plan recommendation", () => {
  it("picks the smallest plan that covers every answer", () => {
    expect(recommendPlan({ locations: 0, disciplines: 0, seo: 0, strategy: 0 })).toEqual({ plan: "essential", extras: false });
    expect(recommendPlan({ locations: 0, disciplines: 0, seo: 1, strategy: 0 }).plan).toBe("growth");
    expect(recommendPlan({ locations: 1, disciplines: 1, seo: 0, strategy: 0 }).plan).toBe("growth");
    expect(recommendPlan({ locations: 0, disciplines: 0, seo: 0, strategy: 1 }).plan).toBe("scale");
    expect(recommendPlan({ locations: 2, disciplines: 0, seo: 0, strategy: 0 }).plan).toBe("scale");
  });
  it("flags answers that go past what Scale includes", () => {
    expect(recommendPlan({ locations: 3 })).toEqual({ plan: "scale", extras: true });
    expect(recommendPlan({ disciplines: 3 }).extras).toBe(true);
    expect(recommendPlan({}).plan).toBe("essential");
  });
});

describe("plans", () => {
  it("shows annual per-month prices first and switches to monthly prices", () => {
    render(<PricingPlans />);
    expect(screen.getByText("$124.17")).toBeInTheDocument();
    expect(screen.getByText("$3,490 billed yearly")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^monthly$/i }));
    expect(screen.getByText("$149")).toBeInTheDocument();
    expect(screen.getAllByText("billed monthly")).toHaveLength(3);
    expect(screen.getByRole("button", { name: /^monthly$/i })).toHaveAttribute("aria-pressed", "true");
  });
  it("marks Growth as the most popular plan", () => {
    render(<PricingPlans />);
    expect(screen.getByText("Most popular")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /get started/i })).toHaveLength(3);
  });
});

describe("plan finder", () => {
  const pick = (name: RegExp) => fireEvent.click(screen.getByRole("radio", { name }));
  it("asks four questions and recommends Growth for a small group wanting SEO", () => {
    render(<PlanFinder />);
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument();
    pick(/2–3 locations/);
    pick(/1 discipline/);
    pick(/yes, include it/i);
    expect(screen.getByText("Question 4 of 4")).toBeInTheDocument();
    pick(/not for now/i);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Growth");
    expect(screen.getByText("$290.83")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/start");
  });
  it("sends a very large group to a conversation instead of a price", () => {
    render(<PlanFinder />);
    pick(/7 or more/);
    pick(/1 discipline/);
    pick(/not for now/i);
    pick(/not for now/i);
    expect(screen.getByText(/go past what Scale includes/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /talk to us/i })).toHaveAttribute("href", "/demo");
  });
  it("goes back and starts over", () => {
    render(<PlanFinder />);
    pick(/1 location/);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument();
  });
});

describe("compare table", () => {
  it("opens and closes the feature table", () => {
    render(<CompareTable />);
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /see all features/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /GEO visibility tracking/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /hide features/i }));
    expect(screen.queryByRole("table")).toBeNull();
  });
});
