import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TopBar } from "@/components/shell/TopBar";

vi.mock("@/components/auth/AccountMenu", () => ({ AccountMenu: () => <span>menu</span> }));

describe("TopBar", () => {
  it("links the bell to what changed and marks it only when there are changes", () => {
    const { rerender } = render(<TopBar changesHref="/app/clinics/c/compare" hasChanges={false} />);
    expect(screen.getByRole("link", { name: "Changes since your last analysis" })).toHaveAttribute("href", "/app/clinics/c/compare");
    rerender(<TopBar changesHref="/app/clinics/c/compare" hasChanges />);
    expect(screen.getByRole("link", { name: /\(new\)/ })).toBeInTheDocument();
  });
  it("offers the three date ranges", () => {
    render(<TopBar changesHref="/x" hasChanges={false} />);
    expect(screen.getByRole("combobox", { name: "Date range" })).toHaveDisplayValue("Last 30 days");
  });
});
