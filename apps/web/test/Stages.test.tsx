import { describe, expect, it } from "vitest";
import { planFor } from "@/components/onboarding/PlanStage";

describe("planFor", () => {
  it("covers one discipline with Essential, two to four with Growth, five or six with Scale", () => {
    expect([1, 2, 4, 5, 6].map(planFor)).toEqual(["essential", "growth", "growth", "scale", "scale"]);
  });
});
