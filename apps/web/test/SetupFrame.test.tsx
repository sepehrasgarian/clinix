import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetupFrame } from "@/components/onboarding/SetupFrame";

const account = { signedIn: false, email: null as string | null, signOut: vi.fn() };
vi.mock("@/components/auth/useAccount", () => ({ useAccount: () => account }));

const frame = (step: number, extra: Partial<Parameters<typeof SetupFrame>[0]> = {}) =>
  render(<SetupFrame step={step} title="Tell us about your clinic" {...extra}><p>content</p></SetupFrame>);

beforeEach(() => { Object.assign(account, { signedIn: false, email: null }); account.signOut.mockClear(); });

describe("setup rail", () => {
  it("marks the current step, ticks the finished ones and fills the ring by step over total", () => {
    const { container } = frame(2);
    const steps = screen.getByRole("list", { name: /setup steps/i });
    expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent("What we found");
    expect(steps.querySelectorAll('[aria-label="done"]')).toHaveLength(1);
    expect(steps.querySelectorAll("li")).toHaveLength(5);
    expect(screen.getAllByText("Step 2 of 5").length).toBeGreaterThan(0);
    const arc = container.querySelectorAll("svg circle")[1];
    const [filled, whole] = arc.getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(filled / whole).toBeCloseTo(2 / 5, 3);
  });
  it("shows the step note and the title", () => {
    frame(1);
    expect(screen.getByText(/a few minutes to set up your clinic/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tell us about your clinic");
  });
});

describe("leaving setup", () => {
  it("offers Exit setup to a guest and no account or log out", () => {
    frame(1);
    expect(screen.getAllByRole("link", { name: /exit setup/i })[0]).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button", { name: /log out/i })).toBeNull();
  });
  it("shows who is signed in, saves on exit once the clinic exists, and logs out", () => {
    Object.assign(account, { signedIn: true, email: "hasan@gmail.com" });
    frame(2);
    expect(screen.getByText("hasan@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("h")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /save and exit/i })).toHaveAttribute("href", "/app");
    fireEvent.click(screen.getAllByRole("button", { name: /log out/i })[0]);
    expect(account.signOut).toHaveBeenCalledOnce();
  });
  it("sends a signed-in owner with no clinic yet home, not to an empty app", () => {
    Object.assign(account, { signedIn: true, email: "a@b.ca" });
    frame(1);
    expect(screen.getAllByRole("link", { name: /exit setup/i })[0]).toHaveAttribute("href", "/");
  });
});
