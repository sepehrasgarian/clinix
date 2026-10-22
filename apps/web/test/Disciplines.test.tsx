import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { disciplinesFromTypes, searchDisciplines } from "@/lib/disciplines";
import { ServiceSearch } from "@/components/onboarding/ServiceSearch";

describe("disciplinesFromTypes", () => {
  it("maps Google listing types to disciplines", () => {
    expect(disciplinesFromTypes(["dentist", "health", "point_of_interest"])).toEqual(["dentistry"]);
    expect(disciplinesFromTypes(["physiotherapist"])).toEqual(["physiotherapy"]);
    expect(disciplinesFromTypes(["spa", "massage"])).toEqual(["massage", "day_spa"]);
    expect(disciplinesFromTypes(["optometrist"])).toEqual(["optometry"]);
    expect(disciplinesFromTypes(["pharmacy"])).toEqual([]);
  });
});

describe("searchDisciplines", () => {
  it("lists popular ones first when nothing is typed, and never 'other' or chosen ones", () => {
    const all = searchDisciplines("", ["dentistry"]);
    expect(all[0]).toBe("dental_hygiene");
    expect(all).not.toContain("dentistry");
    expect(all).not.toContain("other");
    expect(all.length).toBeGreaterThan(40);
  });
  it("finds a discipline by its name, by a short form and without accents", () => {
    expect(searchDisciplines("physio")[0]).toBe("physiotherapy");
    expect(searchDisciplines("chiro")).toContain("chiropractic");
    expect(searchDisciplines("osteo")).toContain("osteopathy");
    expect(searchDisciplines("ostéo")).toContain("osteopathy");
    expect(searchDisciplines("zzzz")).toEqual([]);
  });
  it("puts a name that starts with the query before one that only contains it", () => {
    const hits = searchDisciplines("dental");
    expect(hits[0]).toBe("dental_hygiene");
    expect(hits).toContain("dentistry");
  });
});

describe("ServiceSearch", () => {
  const open = () => fireEvent.focus(screen.getByRole("combobox", { name: /search services/i }));

  it("shows the chosen ones as chips, the first marked primary, with the auto-fill note", () => {
    render(<ServiceSearch value={["dentistry", "optometry"]} onChange={vi.fn()} autoFilled />);
    const chosen = screen.getAllByTestId("chosen-discipline");
    expect(chosen).toHaveLength(2);
    expect(chosen[0]).toHaveTextContent("Primary");
    expect(chosen[1]).not.toHaveTextContent("Primary");
    expect(screen.getByText(/set from your google listing/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/add another discipline/i)).toBeInTheDocument();
  });
  it("lists everything on focus, marks the popular ones, and chooses with a click", () => {
    const onChange = vi.fn();
    render(<ServiceSearch value={[]} onChange={onChange} />);
    open();
    const list = screen.getByRole("listbox", { name: /services/i });
    const dentistry = within(list).getByRole("option", { name: /Dentistry/ });
    expect(dentistry).toHaveTextContent(/popular/i);
    expect(within(list).getByRole("option", { name: /Midwifery/ })).not.toHaveTextContent(/popular/i);
    fireEvent.click(within(dentistry).getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(["dentistry"]);
  });
  it("filters by what is typed and works from the keyboard", () => {
    const onChange = vi.fn();
    render(<ServiceSearch value={[]} onChange={onChange} />);
    const box = screen.getByRole("combobox", { name: /search services/i });
    fireEvent.change(box, { target: { value: "physio" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["physiotherapy"]);
    fireEvent.change(box, { target: { value: "chiro" } });
    fireEvent.keyDown(box, { key: "ArrowDown" });
    fireEvent.keyDown(box, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("offers Other when nothing matches", () => {
    const onChange = vi.fn();
    render(<ServiceSearch value={[]} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox", { name: /search services/i }), { target: { value: "zzzz" } });
    expect(screen.getByText(/no markets matched/i)).toHaveTextContent("zzzz");
    fireEvent.click(screen.getByRole("button", { name: "Other" }));
    expect(onChange).toHaveBeenCalledWith(["other"]);
  });
  it("stops at four, says so, and lets one be swapped out", () => {
    const onChange = vi.fn();
    render(<ServiceSearch value={["dentistry", "dental_hygiene", "physiotherapy", "chiropractic"]} onChange={onChange} />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText(/maximum of 4 disciplines/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /remove chiropractic/i }));
    expect(onChange).toHaveBeenCalledWith(["dentistry", "dental_hygiene", "physiotherapy"]);
  });
  it("adds another from the chip row", () => {
    render(<ServiceSearch value={["dentistry"]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add another/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
