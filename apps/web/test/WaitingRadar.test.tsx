import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WaitingRadar } from "@/components/onboarding/WaitingRadar";

describe("WaitingRadar", () => {
  it("shows what is being checked for the stage and rotates the line", () => {
    vi.useFakeTimers();
    render(<WaitingRadar stage="discovery" clinicName="Finch East Family Dental" />);
    expect(screen.getByText(/searching within 2 km/i)).toBeInTheDocument();
    expect(screen.getByText(/measured against Finch East Family Dental/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3300));
    expect(screen.getByText(/widening to 5 km/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
  it("describes the deep stage honestly, including the evidence check", () => {
    render(<WaitingRadar stage="deep" />);
    expect(screen.getByText(/collecting recent patient reviews/i)).toBeInTheDocument();
  });
});
