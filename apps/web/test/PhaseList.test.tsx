import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhaseList } from "@/components/onboarding/PhaseList";

describe("PhaseList", () => {
  it("renders plain-language labels with real states and the failure message", () => {
    render(
      <PhaseList
        phases={[
          { phase: "validate", status: "done" },
          { phase: "enrich", status: "failed", error: "We could not find your clinic's Google listing." },
          { phase: "understand", status: "pending" },
        ]}
      />,
    );
    expect(screen.getByText("Finding your clinic on Google")).toBeInTheDocument();
    expect(screen.getByText(/could not find your clinic/)).toBeInTheDocument();
    expect(screen.getByLabelText("done")).toBeInTheDocument();
    expect(screen.getByLabelText("pending")).toBeInTheDocument();
  });
});
