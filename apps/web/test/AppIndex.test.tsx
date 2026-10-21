import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
const listClinics = vi.fn();
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));
vi.mock("@/lib/api", () => ({ listClinics: () => listClinics() }));

import AppIndex from "@/app/app/page";

describe("/app", () => {
  beforeEach(() => { redirect.mockClear(); });
  it("opens the most recently created clinic", async () => {
    listClinics.mockResolvedValue([{ id: "old", createdAt: "2026-10-01" }, { id: "new", createdAt: "2026-10-18" }]);
    await AppIndex();
    expect(redirect).toHaveBeenCalledWith("/app/clinics/new");
  });
  it("sends an owner with no clinic to setup instead of crashing", async () => {
    listClinics.mockResolvedValue([]);
    await AppIndex();
    expect(redirect).toHaveBeenCalledWith("/onboarding");
  });
});
