import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlanStage, emptyDraft, type Billing, type PlanDraft } from "@/components/onboarding/PlanStage";
import type { PlanId } from "@/lib/pricing";

const clinic = { name: "Réhabital", address: "5800 Boul. Cavendish D4, Côte Saint-Luc" };

/** Keeps the draft and the chosen plan the way the flow does, so the questions behave as they do on screen. */
function Harness({ disciplines = ["physiotherapy" as const], onChange, onEdit, onBack, onContinue, start = emptyDraft }: { disciplines?: ("physiotherapy" | "massage_therapy" | "osteopathy")[]; onChange?: (n: { plan: PlanId; billing: Billing }) => void; onEdit?: () => void; onBack?: () => void; onContinue?: () => void; start?: PlanDraft }) {
  const [draft, setDraft] = useState(start);
  const [pick, setPick] = useState<{ plan: PlanId; billing: Billing }>({ plan: "essential", billing: "annual" });
  return <PlanStage clinic={clinic} disciplines={disciplines} plan={pick.plan} billing={pick.billing} draft={draft} onDraft={setDraft} onChange={(n) => { setPick(n); onChange?.(n); }} onBack={onBack ?? vi.fn()} onEditClinic={onEdit ?? vi.fn()} onContinue={onContinue ?? vi.fn()} />;
}
const next = (name = "Continue") => fireEvent.click(screen.getByRole("button", { name }));
const goal = (name: RegExp | string) => fireEvent.click(screen.getByRole("checkbox", { name }));

describe("Plan & pricing questions", () => {
  it("starts with the clinic, its disciplines and a locations stepper that stops at 1", () => {
    render(<Harness />);
    expect(screen.getByText("Step 3 of 5 — Plan & pricing")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Let's find the right plan for your clinic.");
    expect(screen.getByText("Réhabital")).toBeInTheDocument();
    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fewer locations" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "More locations" }));
    expect(screen.getByRole("status")).toHaveTextContent("2");
  });

  it("will not leave the goals until one is chosen, and skips the details when SEO is not a goal", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    next();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    goal(/Attract more local patients/);
    next();
    expect(screen.getByRole("heading", { name: "Clinx Essential" })).toBeInTheDocument();
    expect(screen.queryByText("A few details")).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith({ plan: "essential", billing: "annual" });
  });

  it("asks about analytics only for the SEO goal, and recommends Growth with the reasons the owner gave", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    next();
    goal(/Improve website SEO/);
    next();
    expect(screen.getByRole("heading", { level: 2, name: "A few details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See my recommendation" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    next("See my recommendation");
    expect(onChange).toHaveBeenLastCalledWith({ plan: "growth", billing: "annual" });
    expect(screen.getByRole("heading", { name: "Clinx Growth" })).toBeInTheDocument();
    expect(screen.getAllByText("$3,490").length).toBeGreaterThan(0);
    expect(screen.getByText(/Equivalent to \$290\.83 per month/)).toBeInTheDocument();
    expect(screen.getByText("You save $698 compared with monthly billing.")).toBeInTheDocument();
    expect(screen.getByText(/Based on your 1 location, 1 discipline and your focus on website seo audit and analytics, Growth is the best fit/)).toBeInTheDocument();
    expect(screen.getByText(/Website SEO audit, Google Analytics & Search Console are included/)).toBeInTheDocument();
  });

  it("explains why a plan doesn't fit, only lets the owner pick plans that do, and shows a manual choice as theirs", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    next();
    goal(/Improve website SEO/);
    next();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    next("See my recommendation");
    const table = screen.getByRole("table");
    expect(within(table).getByText(/Doesn't fit: it doesn't include Website SEO audit; it doesn't include Google Analytics/)).toBeInTheDocument();
    expect(within(table).getByRole("button", { name: "Select Essential" })).toBeDisabled();
    expect(within(table).getByText("Current recommendation")).toBeInTheDocument();
    fireEvent.click(within(table).getByRole("button", { name: "Select Scale" }));
    expect(onChange).toHaveBeenLastCalledWith({ plan: "scale", billing: "annual" });
    expect(screen.getByText("Your choice")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use Growth" }));
    expect(onChange).toHaveBeenLastCalledWith({ plan: "growth", billing: "annual" });
  });

  it("switches billing everywhere at once", () => {
    render(<Harness start={{ locations: 1, goals: ["growth"], analytics: null }} />);
    next();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getAllByText("$149").length).toBeGreaterThan(1);
    expect(screen.queryByText(/compared with monthly billing/)).toBeNull();
    expect(screen.getByText("Billed every month, no commitment.")).toBeInTheDocument();
  });

  it("recommends Scale for GEO, tells the owner when the setup is bigger than any plan, and continues", () => {
    const onContinue = vi.fn();
    render(<Harness onContinue={onContinue} start={{ locations: 9, goals: ["geo"], analytics: null }} />);
    next();
    next();
    expect(screen.getByRole("heading", { name: "Clinx Scale" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/larger than any plan covers/);
    fireEvent.click(screen.getByRole("button", { name: "Continue with this plan" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("leads back: Edit and Change locations go to the clinic and setup, Back goes up one question", () => {
    const onEdit = vi.fn();
    const onBack = vi.fn();
    render(<Harness onEdit={onEdit} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /Back to what we found/ }));
    expect(onBack).toHaveBeenCalledOnce();
    next();
    goal(/Track performance/);
    next();
    expect(screen.getByRole("heading", { level: 2, name: "Your clinic setup" })).toBeInTheDocument();
    expect(screen.getByText("Track performance over time")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { level: 2, name: "Your clinic setup" })).toBeInTheDocument();
    next();
    expect(screen.getByRole("checkbox", { name: /Track performance/ })).toHaveAttribute("aria-checked", "true");
    next();
    fireEvent.click(screen.getByRole("button", { name: "Adjust my needs" }));
    expect(screen.getByRole("checkbox", { name: /Track performance/ })).toHaveAttribute("aria-checked", "true");
  });
});
