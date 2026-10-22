import { describe, expect, it } from "vitest";
import type { Clinic } from "@clinix/contracts";
import { fixtureClinic } from "@clinix/contracts/fixtures";
import { distinctClinics } from "@/lib/clinics";

const c = (id: string, createdAt: string, over: Partial<Clinic> = {}): Clinic => ({ ...fixtureClinic, id, createdAt, ...over });

describe("distinctClinics", () => {
  const list = [c("new", "2026-10-22T10:00:00.000Z", { name: "Réhabital" }), c("mid", "2026-10-21T10:00:00.000Z", { name: " réhabital " }), c("old", "2026-10-20T10:00:00.000Z", { name: "Réhabital" }), c("other", "2026-10-19T10:00:00.000Z", { name: "Finch", address: "1 Other St" })];
  it("lists a clinic saved several times once, as its newest copy, and keeps other clinics", () => {
    expect(distinctClinics(list).map((x) => x.id)).toEqual(["new", "other"]);
  });
  it("lets the clinic being viewed stand for its own group, so the switcher still shows it", () => {
    expect(distinctClinics(list, "old").map((x) => x.id)).toEqual(["old", "other"]);
  });
  it("leaves a list without duplicates alone", () => {
    expect(distinctClinics([list[0], list[3]])).toEqual([list[0], list[3]]);
    expect(distinctClinics([])).toEqual([]);
  });
});
