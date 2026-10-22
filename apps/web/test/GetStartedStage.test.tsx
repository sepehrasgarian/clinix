import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GetStartedStage } from "@/components/onboarding/GetStartedStage";

const clinic = { name: "Dena Sports Physio Côte St-Luc / NDG", address: "5800 Boul. Cavendish D4, Côte Saint-Luc, QC H4W 2T5, Canada", disciplines: ["physiotherapy" as const, "massage" as const] };
const props = { clinic, locations: 1, competitors: 4, onBack: vi.fn(), onStart: vi.fn() };

describe("Get started", () => {
  it("celebrates the finished setup and shows what was actually saved", () => {
    render(<GetStartedStage {...props} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your clinic is ready for Clinx.");
    expect(screen.getAllByText("Step 5 of 5").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Setup complete").length).toBeGreaterThan(0);
    const summary = screen.getByTestId("clinic-summary");
    expect(summary).toHaveTextContent(clinic.name);
    expect(summary).toHaveTextContent("Confirmed");
    expect(summary).toHaveTextContent("Côte Saint-Luc, QC");
    expect(summary).not.toHaveTextContent("H4W");
    expect(summary).toHaveTextContent("clinic location");
    expect(summary).toHaveTextContent("Physiotherapy, Massage therapy");
    expect(summary).toHaveTextContent("selected for analysis");
  });

  it("shows the photo only when there is one, else the clinic's initials", () => {
    const { rerender } = render(<GetStartedStage {...props} />);
    const photo = () => screen.getByTestId("clinic-summary").querySelector("img");
    expect(photo()).toBeNull();
    expect(screen.getByTestId("clinic-summary")).toHaveTextContent("DS");
    rerender(<GetStartedStage {...props} place={{ photoName: "places/x/photos/y" }} />);
    expect(photo()?.getAttribute("src")).toContain("/api/photo/places/x/photos/y");
  });

  it("starts the analysis with one clear button, and a double press starts it once", () => {
    const onStart = vi.fn();
    render(<GetStartedStage {...props} onStart={onStart} />);
    const button = screen.getByRole("button", { name: /start my first analysis/i });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /go to my dashboard/i })).toBeNull();
  });

  it("is disabled while starting, and after a failure explains it and lets the owner try again", () => {
    const onStart = vi.fn();
    const { rerender } = render(<GetStartedStage {...props} busy onStart={onStart} />);
    expect(screen.getByRole("button", { name: /starting/i })).toBeDisabled();
    rerender(<GetStartedStage {...props} error="The analysis service is busy." onStart={onStart} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t start your analysis[\s\S]*busy[\s\S]*Nothing was lost/);
    fireEvent.click(screen.getByRole("button", { name: /start my first analysis/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("lists the integrations as coming soon, with nothing to press", () => {
    render(<GetStartedStage {...props} />);
    expect(screen.getByText("More insights coming soon")).toBeInTheDocument();
    expect(screen.getAllByText("Coming soon")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /connect/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /settings/i })).toBeNull();
  });

  it("reveals the listing's details on request and goes back to payment", () => {
    const onBack = vi.fn();
    render(<GetStartedStage {...props} onBack={onBack} place={{ website: "https://www.dena.ca/?utm_source=x", phone: "(438) 842-3550" }} />);
    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByText("(438) 842-3550")).toBeInTheDocument();
    expect(screen.getByText("www.dena.ca")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back to payment/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
