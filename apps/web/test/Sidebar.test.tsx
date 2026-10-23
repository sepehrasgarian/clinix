import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureClinic } from "@clinix/contracts/fixtures";

const path = vi.hoisted(() => ({ current: "/app/clinics/clinic_demo" }));
const signOut = vi.fn();
const onOpenChat = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => path.current, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/auth/useAccount", () => ({ useAccount: () => ({ signedIn: true, email: "hasan@gmail.com", name: "Rouzbeh Ghasemi", signOut }) }));
vi.mock("@/components/onboarding/ClinicLogo", () => ({ ClinicLogo: () => null }));
import { Sidebar } from "@/components/shell/Sidebar";
import { SetupSidebar } from "@/components/shell/SetupSidebar";

const base = `/app/clinics/${fixtureClinic.id}`;

describe("Sidebar", () => {
  it("lists the seven screens in order and marks the current one", () => {
    path.current = `${base}/competitors`;
    render(<Sidebar clinic={fixtureClinic} onOpenChat={vi.fn()} />);
    const names = screen.getAllByRole("link", { name: /^(Dashboard|Competitors|Report|Findings|By discipline|Action plan|Since last time)$/ }).map((l) => l.textContent);
    expect(names).toEqual(["Dashboard", "Competitors", "Report", "Findings", "By discipline", "Action plan", "Since last time"]);
    expect(screen.getByRole("link", { name: "Competitors" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
  it("shows Analysis as the current page while an analysis is open, and not otherwise", () => {
    path.current = `${base}/run/analysis_1`;
    const { unmount } = render(<Sidebar clinic={fixtureClinic} onOpenChat={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Analysis" })).toHaveAttribute("href", `${base}/run/analysis_1`);
    unmount();
    path.current = base;
    render(<Sidebar clinic={fixtureClinic} onOpenChat={vi.fn()} />);
    expect(screen.queryByRole("link", { name: "Analysis" })).toBeNull();
  });
  it("opens the chat, links Settings, Billing and Help, and shows the account", () => {
    path.current = base;
    render(<Sidebar clinic={fixtureClinic} onOpenChat={onOpenChat} />);
    fireEvent.click(screen.getByRole("button", { name: /Ask ClinX/ }));
    expect(onOpenChat).toHaveBeenCalled();
    for (const name of ["Settings", "Billing", "Help & support", "Add a clinic"]) expect(screen.getByRole("link", { name })).toBeInTheDocument();
    expect(screen.getByText("RG")).toBeInTheDocument();
    expect(screen.getByText("Rouzbeh Ghasemi")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalled();
  });
});

describe("SetupSidebar", () => {
  it("keeps the dashboard open and closes the analysis screens with a lock, without links to them", () => {
    path.current = base;
    render(<SetupSidebar clinic={fixtureClinic} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    for (const name of ["Competitors", "Reports", "Recommendations", "Ask Clinx"]) expect(screen.queryByRole("link", { name: new RegExp(name) })).toBeNull();
    expect(screen.getAllByText("Locked until setup is finished")).toHaveLength(4);
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });
  it("offers adding a location, the account links, who is signed in, sign out and help", () => {
    path.current = base;
    render(<SetupSidebar clinic={fixtureClinic} />);
    expect(screen.getByRole("link", { name: /Add a location/ })).toHaveAttribute("href", "/onboarding");
    for (const name of ["Locations", "Settings", "Billing"]) expect(screen.getByRole("link", { name })).toBeInTheDocument();
    expect(screen.getByText("hasan@gmail.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Need help/ })).toHaveAttribute("href", "/contact");
  });
});
