import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClinicCard } from "@/components/onboarding/ClinicCard";

const base = { placeId: "", name: "Réhabital", address: "5800 Boul. Cavendish D4, Côte Saint-Luc, QC H4W 2T5, Canada" };

describe("ClinicCard", () => {
  it("shows the website's logo in the photo tile from the typed domain, before any listing is known", () => {
    render(<ClinicCard place={{ ...base, website: "https://www.rehabital.ca/?utm_source=x" }} />);
    expect((screen.getByTestId("clinic-logo") as HTMLImageElement).src).toContain("/api/logo/site/rehabital.ca");
  });
  it("falls back to the clinic's initials when the site has no logo", () => {
    render(<ClinicCard place={{ ...base, website: "https://rehabital.ca" }} />);
    fireEvent.error(screen.getByTestId("clinic-logo"));
    expect(screen.queryByTestId("clinic-logo")).toBeNull();
    expect(screen.getByTestId("clinic-card")).toHaveTextContent("R");
  });
  it("asks for no logo when there is no website", () => {
    render(<ClinicCard place={base} />);
    expect(screen.queryByTestId("clinic-logo")).toBeNull();
  });
});
