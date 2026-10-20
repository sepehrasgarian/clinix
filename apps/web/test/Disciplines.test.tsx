import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { disciplinesFromTypes } from "@/lib/disciplines";
import { DisciplinePicker } from "@/components/onboarding/DisciplinePicker";

describe("disciplinesFromTypes", () => {
  it("maps Google listing types to disciplines", () => {
    expect(disciplinesFromTypes(["dentist", "health", "point_of_interest"])).toEqual(["dentistry"]);
    expect(disciplinesFromTypes(["physiotherapist"])).toEqual(["physiotherapy"]);
    expect(disciplinesFromTypes(["spa", "massage"])).toEqual(["massage", "day_spa"]);
    expect(disciplinesFromTypes(["optometrist"])).toEqual(["optometry"]);
    expect(disciplinesFromTypes(["pharmacy"])).toEqual([]);
  });
});

describe("DisciplinePicker", () => {
  it("shows chosen stickers inline with the lead badge and the auto-fill note", () => {
    render(<DisciplinePicker value={["dentistry", "optometry"]} onChange={vi.fn()} autoFilled />);
    const chosen = screen.getAllByTestId("chosen-discipline");
    expect(chosen).toHaveLength(2);
    expect(chosen[0]).toHaveTextContent("Lead");
    expect(screen.getByText(/set from your google listing/i)).toBeInTheDocument();
  });

  it("opens the grid in place, searches the long tail, selects up to four, and closes", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DisciplinePicker value={[]} onChange={onChange} />);
    expect(screen.queryByRole("region", { name: /choose disciplines/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /choose disciplines/i }));
    const panel = screen.getByRole("region", { name: /choose disciplines/i });
    expect(within(panel).queryByRole("button", { name: /Midwifery/ })).toBeNull();
    fireEvent.change(within(panel).getByLabelText(/search disciplines/i), { target: { value: "midw" } });
    fireEvent.click(within(panel).getByRole("button", { name: /Midwifery/ }));
    expect(onChange).toHaveBeenCalledWith(["midwifery"]);

    rerender(<DisciplinePicker value={["dentistry", "dental_hygiene", "physiotherapy", "chiropractic"]} onChange={onChange} />);
    fireEvent.change(within(panel).getByLabelText(/search disciplines/i), { target: { value: "" } });
    expect(within(panel).getByRole("button", { name: /Massage therapy/ })).toBeDisabled();
    fireEvent.click(within(panel).getByRole("button", { name: /^Done$/ }));
    expect(screen.queryByRole("region", { name: /choose disciplines/i })).toBeNull();
  });

  it("removes a chosen discipline from the inline field", () => {
    const onChange = vi.fn();
    render(<DisciplinePicker value={["dentistry", "optometry"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /remove optometry/i }));
    expect(onChange).toHaveBeenCalledWith(["dentistry"]);
  });
});
