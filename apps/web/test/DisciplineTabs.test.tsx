import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureReport } from "@clinix/contracts/fixtures";
import { DisciplineTabs } from "@/components/report/DisciplineTabs";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("DisciplineTabs", () => {
  it("shows the leader, demand, statements linked to findings and the discipline's actions", () => {
    render(<DisciplineTabs report={fixtureReport} clinicId="clinic_demo" analysisId="analysis_demo_2" />);
    expect(screen.getByRole("heading", { level: 2, name: "Dentistry" })).toBeInTheDocument();
    expect(screen.getByText("Yonge Smile Studio")).toBeInTheDocument();
    expect(screen.getByText("Invisalign")).toBeInTheDocument();
    expect(screen.getByText(/wins patients on online booking/)).toBeInTheDocument();
    expect(screen.getByText("Open one Saturday a month and say so on Google")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).toBeNull(); // one discipline: no tabs needed
  });
  it("switches between disciplines when there are several", () => {
    const two = { ...fixtureReport, disciplines: [fixtureReport.disciplines[0], { ...fixtureReport.disciplines[0], discipline: "dental_hygiene" as const, summary: "Hygiene summary.", leader: undefined }] };
    render(<DisciplineTabs report={two} clinicId="c" analysisId="a" />);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    fireEvent.click(screen.getByRole("tab", { name: /Dental hygiene/ }));
    expect(screen.getByText("Hygiene summary.")).toBeInTheDocument();
    expect(screen.getByText(/no single rival leads/i)).toBeInTheDocument();
  });
});
