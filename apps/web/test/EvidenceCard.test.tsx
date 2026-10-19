import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { fixtureReviews } from "@clinix/contracts/fixtures";

describe("EvidenceCard", () => {
  const review = fixtureReviews.find((r) => r.id === "rev_ys_1")!;

  it("highlights the cited quote inside the review and names the source", () => {
    render(<EvidenceCard review={review} quote="Open Saturdays" sourceName="Yonge Smile Studio" />);
    expect(screen.getByText("Open Saturdays").tagName).toBe("MARK");
    expect(screen.getByText("Yonge Smile Studio")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /5 stars/ })).toBeInTheDocument();
  });

  it("shows the quote plainly when it is not found in the review text", () => {
    render(<EvidenceCard review={review} quote="not in the text" sourceName="X" />);
    expect(screen.queryByRole("mark")).toBeNull();
    expect(screen.getByText("not in the text")).toBeInTheDocument();
  });

  it("never renders reviewer identity", () => {
    const { container } = render(<EvidenceCard review={review} quote="Open Saturdays" sourceName="X" />);
    expect(container.textContent).not.toMatch(/author|by /i);
  });
});
