import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import { FoundStage } from "@/components/onboarding/FoundStage";

vi.mock("@/components/onboarding/MarketMap", () => ({ MarketMap: ({ clinics, name }: { clinics: unknown[]; name: string }) => <div role="img" aria-label={`Map near ${name}`} data-dots={clinics.length} /> }));

const analysis = { ...fixtureAnalysis, status: "awaiting_services" as const };
const scan = analysis.scan!;
const N = scan.nearby.length;

describe("FoundStage: the overview", () => {
  it("opens with the market overview, the clinic, and three measured tiles", () => {
    render(<FoundStage analysis={analysis} onContinue={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Here's your market overview");
    expect(screen.getByTestId("clinic-card")).toHaveTextContent(scan.place.name);
    expect(screen.getByTestId("clinic-card")).toHaveTextContent("North York, ON");
    expect(screen.getByRole("heading", { name: "Key insights" })).toBeInTheDocument();
    for (const label of ["Your position", "Local competition", "Your rating"]) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("4.6★")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(screen.getByText(/your overview is ready\. check your services, then choose your plan/i)).toBeInTheDocument();
  });
  it("shows the nearest competitor instead of a rank for a clinic under two years old", () => {
    render(<FoundStage analysis={analysis} clinicOpened={`${new Date().getFullYear()}`} onContinue={vi.fn()} />);
    expect(screen.getByText("Nearest competitor")).toBeInTheDocument();
    expect(screen.queryByText("Your position")).toBeNull();
  });
  it("lists what stands out with why it matters, tinted by kind, and always the full action plan row", () => {
    render(<FoundStage analysis={analysis} onContinue={vi.fn()} />);
    const section = screen.getByRole("region", { name: /what stands out/i });
    expect(within(section).getByText("Your 128 reviews against a nearby median of 310")).toBeInTheDocument();
    expect(within(section).getByText(/review counts before they book/i)).toBeInTheDocument();
    expect(within(section).getByText("To improve:")).toBeInTheDocument();
    expect(within(section).getByText("Strength:")).toBeInTheDocument();
    expect(within(section).getByText("Full report after your plan")).toBeInTheDocument();
    expect(within(section).getByText("Your full action plan")).toBeInTheDocument();
  });
  it("still shows the full action plan row when no hint was measured", () => {
    render(<FoundStage analysis={{ ...analysis, scan: { ...scan, hints: [] } }} onContinue={vi.fn()} />);
    expect(screen.getByText("Your full action plan")).toBeInTheDocument();
  });
});

describe("FoundStage: the market beside it", () => {
  it("shows the count, the radius, a map with a dot per competitor and the nearest three", () => {
    render(<FoundStage analysis={analysis} onContinue={vi.fn()} />);
    const market = screen.getByRole("region", { name: /your local market/i });
    expect(market).toHaveTextContent(new RegExp(`we found ${N} clinics within 5 km`, "i"));
    expect(within(market).getByText("5 km radius")).toBeInTheDocument();
    expect(within(market).getByRole("img", { name: /map near/i })).toHaveAttribute("data-dots", String(scan.nearby.length));
    const rows = within(market).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(/km · .*★ \(.* reviews\)/);
  });
  it("opens the whole list on View all and closes it again", () => {
    render(<FoundStage analysis={analysis} onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`view all \\(${N}\\)`, "i") }));
    expect(within(screen.getByRole("region", { name: /your local market/i })).getAllByRole("listitem")).toHaveLength(N);
    fireEvent.click(screen.getByRole("button", { name: /show less/i }));
    expect(within(screen.getByRole("region", { name: /your local market/i })).getAllByRole("listitem")).toHaveLength(3);
  });
  it("says it is measured later when nothing nearby was found, and marks a capped count", () => {
    const { rerender } = render(<FoundStage analysis={{ ...analysis, scan: { ...scan, nearby: [], competitorCountsPerService: [] } }} onContinue={vi.fn()} />);
    expect(screen.getByText(/nearby clinics are measured in your full analysis/i)).toBeInTheDocument();
    rerender(<FoundStage analysis={{ ...analysis, scan: { ...scan, nearbyCapped: true } }} onContinue={vi.fn()} />);
    expect(screen.getByRole("region", { name: /your local market/i })).toHaveTextContent(new RegExp(`we found ${N}\\+ clinics`, "i"));
  });
  it("closes with what comes next", () => {
    render(<FoundStage analysis={analysis} onContinue={vi.fn()} />);
    expect(screen.getByText("This is just the beginning")).toBeInTheDocument();
  });
});

describe("FoundStage: services and the way on", () => {
  it("lets a signed-in owner edit the services and continue with the change", () => {
    const onContinue = vi.fn();
    render(<FoundStage analysis={analysis} onContinue={onContinue} />);
    expect(screen.getByText("5 services to analyze")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /remove cleaning/i }));
    fireEvent.change(screen.getByLabelText("Add a missing service"), { target: { value: "Botox" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    fireEvent.change(screen.getByLabelText("Add a missing service"), { target: { value: "botox" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(screen.getByText("5 services to analyze")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledWith(["fillings", "whitening", "Invisalign", "emergency dentistry", "Botox"]);
  });
  it("cannot continue with no services, and says what to do", () => {
    render(<FoundStage analysis={{ ...analysis, scan: { ...scan, understanding: { ...scan.understanding, services: [] } } }} onContinue={vi.fn()} />);
    expect(screen.getByText(/none yet — add some below/i)).toBeInTheDocument();
    expect(screen.getByText("0 services to analyze")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
  it("shows the account gate to guests and calls onCreateAccount", () => {
    const onCreateAccount = vi.fn();
    render(<FoundStage analysis={analysis} guest onCreateAccount={onCreateAccount} onContinue={vi.fn()} />);
    expect(screen.getByText(/create a free account to choose competitors/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /create a free account/i }));
    expect(onCreateAccount).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
  });
  it("goes back to the first step", () => {
    const onBack = vi.fn();
    render(<FoundStage analysis={analysis} onContinue={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /back to your clinic/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
