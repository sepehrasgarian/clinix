import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "../../src/db/connection.js";
import { createClinic, getClinic, listClinics, updateClinic } from "../../src/db/clinics.js";

const input = { name: "Test Dental", address: "1 Main St", city: "Toronto", province: "ON", disciplines: ["dentistry" as const], services: ["cleaning"] };

describe("clinic repository", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });

  it("creates and reads back a clinic with a plain string id", async () => {
    const c = await createClinic(input, "user_1");
    expect(c.id).toMatch(/^clinic_[0-9a-f]{12}$/);
    expect(await getClinic(c.id, "user_1")).toEqual(c);
  });

  it("hides a clinic from a different owner", async () => {
    const c = await createClinic(input, "user_1");
    expect(await getClinic(c.id, "user_2")).toBeNull();
  });

  it("lists only the owner's clinics", async () => {
    await createClinic(input, "user_1");
    await createClinic({ ...input, name: "Other" }, "user_2");
    const mine = await listClinics("user_1");
    expect(mine.map((c) => c.name)).toEqual(["Test Dental"]);
  });

  it("merges a partial update", async () => {
    const c = await createClinic(input, "user_1");
    const updated = await updateClinic(c.id, { placeId: "place_x", lat: 43.7, lng: -79.4 });
    expect(updated).toMatchObject({ placeId: "place_x", lat: 43.7, name: "Test Dental" });
  });
});
