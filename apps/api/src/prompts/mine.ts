import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Discipline, Review } from "@clinix/contracts";
import type { GuideLibrary } from "./guides.js";

const here = dirname(fileURLToPath(import.meta.url));
const load = (dir: string, name: string) => readFileSync(resolve(here, dir, name), "utf8").trim();

/** The system prompt for reading one business's reviews: its reading guide plus the fixed output contract. */
export async function miningSystem(discipline: Discipline, guides: GuideLibrary): Promise<string> {
  const { text } = await guides.guide(discipline);
  return `${text}\n\n${load("text", "output_contract.txt")}`;
}

export function miningUser(input: { businessName: string; isOwnClinic: boolean; ownerClinicName: string; services: string[]; reviews: Review[] }): string {
  const who = input.isOwnClinic
    ? `These are reviews of the owner's OWN clinic, ${input.ownerClinicName}. Findings describe the owner's clinic (competitorPlaceId is null).`
    : `These are reviews of a COMPETITOR, ${input.businessName}, of the owner's clinic ${input.ownerClinicName}. Findings describe the competitor.`;
  const lines = input.reviews.map(
    (r) => `[id=${r.id}] ${r.rating}/5 · ${r.publishedAt.slice(0, 10)}\n${r.text}${r.ownerReply ? `\n(owner replied: ${r.ownerReply.slice(0, 240)})` : ""}`,
  );
  return `${who}\nThe owner's services: ${input.services.join(", ") || "not specified"}.\n\nREVIEWS (${input.reviews.length}):\n\n${lines.join("\n\n")}`;
}

export const synthesizeSystem = (guides: GuideLibrary): Promise<string> => guides.prompt("synthesize_system.txt");
