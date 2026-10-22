import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureClinic } from "@clinix/contracts/fixtures";

const path = vi.hoisted(() => ({ current: "/app/clinics/clinic_demo" }));
vi.mock("next/navigation", () => ({ usePathname: () => path.current, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/auth/AccountMenu", () => ({ AccountMenu: () => null }));
import { Sidebar } from "@/components/shell/Sidebar";

describe("Sidebar", () => {
  it("has no Analysis entry on the dashboard", () => {
    path.current = "/app/clinics/clinic_demo";
    render(<Sidebar clinic={fixtureClinic} onOpenChat={vi.fn()} />);
    expect(screen.queryByRole("link", { name: "Analysis" })).toBeNull();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  });
  it("shows Analysis as the current page while an analysis is open, linking to where the owner already is", () => {
    path.current = "/app/clinics/clinic_demo/run/analysis_1";
    render(<Sidebar clinic={fixtureClinic} onOpenChat={vi.fn()} />);
    const link = screen.getByRole("link", { name: "Analysis" });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveAttribute("href", "/app/clinics/clinic_demo/run/analysis_1");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
});
