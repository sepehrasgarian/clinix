import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPanel } from "@/components/auth/LoginPanel";

describe("login page", () => {
  beforeEach(() => { window.localStorage.clear(); vi.mocked(useRouter().push).mockClear(); });
  it("says sign-in is coming and points to the free analysis", () => {
    render(<LoginPanel />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome back");
    expect(screen.getByText(/sign-in is opening soon/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start a free analysis/i })).toHaveAttribute("href", "/start");
  });
  it("lets a developer continue as the test user, which signs them in and opens the app", () => {
    render(<LoginPanel />);
    fireEvent.click(screen.getByRole("button", { name: /continue as the test user/i }));
    expect(window.localStorage.getItem("clinix.user")).toBe("dev");
    expect(useRouter().push).toHaveBeenCalledWith("/app");
  });
  it("hides the test-user shortcut in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<LoginPanel />);
    expect(screen.queryByRole("button", { name: /test user/i })).toBeNull();
    vi.unstubAllEnvs();
  });
});
