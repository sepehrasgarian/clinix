import { describe, expect, it } from "vitest";
import { disciplinesFromListing, disciplinesFromName, disciplinesFromTypes, primaryDiscipline } from "../src/disciplines";

describe("disciplinesFromTypes", () => {
  it("maps specific Google types and ignores generic ones", () => {
    expect(disciplinesFromTypes(["dentist", "point_of_interest"])).toEqual(["dentistry"]);
    expect(disciplinesFromTypes(["medical_clinic", "doctor", "health"])).toEqual([]);
    expect(disciplinesFromTypes(["walk_in_clinic"])).toEqual(["family_medicine"]);
  });
});

describe("disciplinesFromName", () => {
  it("reads the discipline from the listing name in English or French, in order of appearance", () => {
    expect(disciplinesFromName("Dena Sports Physio Côte St-Luc / NDG")).toEqual(["physiotherapy"]);
    expect(disciplinesFromName("ALTERMED NDG | ostéo - physio - masso - acu")).toEqual(["osteopathy", "physiotherapy", "massage", "acupuncture"]);
    expect(disciplinesFromName("Clinique Dentaire Côte-des-Neiges")).toEqual(["dentistry"]);
    expect(disciplinesFromName("Réhabital")).toEqual([]);
  });
});

describe("disciplinesFromListing", () => {
  it("leads with the name, then adds specific types, never generic ones", () => {
    expect(disciplinesFromListing("Dena Sports Physio Côte St-Luc / NDG", ["medical_clinic", "massage", "health"])).toEqual(["physiotherapy", "massage"]);
    expect(disciplinesFromListing("Réhabital", ["medical_clinic", "massage"])).toEqual(["massage"]);
    expect(disciplinesFromListing("Yonge Finch Dental Centre", ["dentist", "dental_clinic"])).toEqual(["dentistry"]);
  });
});

describe("primaryDiscipline", () => {
  it("picks the first of the owner's disciplines the competitor shares", () => {
    expect(primaryDiscipline(["massage", "physiotherapy"], ["physiotherapy", "massage"])).toBe("physiotherapy");
  });
});
