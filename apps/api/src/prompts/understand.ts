import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DISCIPLINE_LABELS, type Discipline } from "@clinix/contracts";

const here = dirname(fileURLToPath(import.meta.url));
const load = (name: string) => readFileSync(resolve(here, "text", name), "utf8").trim();

export const understandSystem = (): string => load("understand_system.txt");

export const understandExtractPrompt = (disciplines: Discipline[], notes: string): string =>
  `${load("understand_extract.txt").replace("{discipline}", disciplines.map((d) => DISCIPLINE_LABELS[d]).join(" / "))}\n\n<notes>\n${notes}\n</notes>`;

export const understandQuestion = (clinicName: string): string =>
  `Read the website of ${clinicName} and write structured notes for a competitive analysis.`;

export const understandCompetitorQuestion = (clinicName: string): string =>
  `Read the website of ${clinicName}, a competing clinic, and write structured notes for a competitive analysis. Follow its services, team, booking, hours, insurance, offers and contact pages when they exist.`;
