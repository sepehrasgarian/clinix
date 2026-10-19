import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LedgerCounter } from "@/components/ui/LedgerCounter";

describe("LedgerCounter", () => {
  const ledger = { proposed: 8, kept: 6, rejected: 2, rejectedReasons: [] };

  it("shows kept and rejected counts and toggles", () => {
    const onToggle = vi.fn();
    render(<LedgerCounter ledger={ledger} showRejected={false} onToggle={onToggle} />);
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show set-aside/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("hides the toggle when nothing was rejected", () => {
    render(<LedgerCounter ledger={{ ...ledger, rejected: 0 }} showRejected={false} onToggle={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
