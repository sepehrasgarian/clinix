import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DISCIPLINE_LABELS, DISCIPLINES, type Discipline } from "@clinix/contracts";

const here = dirname(fileURLToPath(import.meta.url));
const load = (name: string) => readFileSync(resolve(here, "text", name), "utf8").trim();

export type RankCandidateInput = {
  id: string;
  name: string;
  address: string;
  types: string[];
  distanceKm: number;
  rating?: number;
  reviewCount?: number;
  foundBy: string[];
};

export function rankSystem(disciplines: Discipline[], city: string): string {
  return load("rank_competitors.txt")
    .replace("{discipline}", disciplines.map((d) => DISCIPLINE_LABELS[d]).join(" / "))
    .replace("{city}", city)
    .replace("{discipline_ids}", DISCIPLINES.map((d) => d.id).join(", "));
}

export function rankUser(clinicName: string, services: string[], candidates: RankCandidateInput[]): string {
  const lines = candidates.map(
    (c) =>
      `- id=${c.id} | ${c.name} | ${c.address} | types: ${c.types.join(", ") || "none"} | ${c.distanceKm.toFixed(1)} km | ` +
      `${c.rating ?? "?"}★ ${c.reviewCount ?? "?"} reviews | found by: ${c.foundBy.join(", ")}`,
  );
  return `Clinic: ${clinicName}\nServices: ${services.join(", ")}\n\nCandidates:\n${lines.join("\n")}`;
}
