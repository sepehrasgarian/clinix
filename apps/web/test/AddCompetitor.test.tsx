import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddCompetitor } from "@/components/onboarding/AddCompetitor";

const search = vi.fn();
const failing = { on: false };
vi.mock("@/lib/api", () => ({ searchClinics: async (...a: unknown[]) => { if (failing.on) throw new Error("offline"); return search(...a); } }));
const place = (id: string, name: string) => ({ placeId: id, name, address: "1 Rue Test", lat: 0, lng: 0, rating: 4.4, reviewCount: 12, types: [], sampleReviews: [] });

describe("AddCompetitor", () => {
  beforeEach(() => { search.mockReset(); failing.on = false; });
  const setup = (over = {}) => {
    const props = { city: "Montréal", ownPlaceId: "own", knownIds: ["known"], onAdd: vi.fn(async () => {}), onExisting: vi.fn(), ...over };
    render(<AddCompetitor {...props} />);
    fireEvent.change(screen.getByLabelText("Clinic name"), { target: { value: "physio" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    return props;
  };

  it("previews the verified match and only adds after confirmation", async () => {
    search.mockResolvedValue([place("new", "Nova Physio")]);
    const props = setup();
    fireEvent.click(await screen.findByRole("button", { name: /Nova Physio/ }));
    expect(screen.getByTestId("add-preview")).toHaveTextContent("Verified on Google");
    expect(props.onAdd).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Add as competitor" }));
    await waitFor(() => expect(props.onAdd).toHaveBeenCalledWith({ placeId: "new" }));
    expect(search).toHaveBeenCalledWith("physio", "Montréal");
  });

  it("will not add the owner's own clinic, and points to a clinic already in the list", async () => {
    search.mockResolvedValue([place("own", "My Clinic"), place("known", "Known Physio")]);
    const props = setup();
    const mine = await screen.findByRole("button", { name: /My Clinic/ });
    expect(mine).toBeDisabled();
    expect(mine).toHaveTextContent("This is your own clinic");
    fireEvent.click(screen.getByRole("button", { name: /Known Physio/ }));
    expect(props.onExisting).toHaveBeenCalledWith("known");
    expect(props.onAdd).not.toHaveBeenCalled();
  });

  it("says plainly when nothing can be verified", async () => {
    search.mockResolvedValue([]);
    setup();
    expect(await screen.findByText(/couldn.t verify a clinic/)).toBeInTheDocument();
  });

  it("says plainly when the search fails", async () => {
    failing.on = true;
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t search/);
  });
});
