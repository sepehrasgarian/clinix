import { Understanding, type Clinic, type Competitor } from "@clinix/contracts";
import { cachedSites, saveSite, type SiteStatus } from "../db/sites.js";
import { log } from "../lib/log.js";
import { understandCompetitorQuestion, understandExtractPrompt, understandSystem } from "../prompts/understand.js";
import type { PipelineDeps } from "./deps.js";

/**
 * Phase 6: what each competitor's website says. Read the same way as the owner's site, cached
 * 14 days per place, a few at a time. A site that cannot be read never fails the run; the
 * competitor is marked unreadable and the rest continues.
 */
export type SiteResult = { status: SiteStatus; site?: Understanding };

const CONCURRENCY = 4;

export async function readCompetitorSites(clinic: Clinic, competitors: Pick<Competitor, "placeId" | "name" | "website" | "disciplines">[], deps: PipelineDeps): Promise<Map<string, SiteResult>> {
  const results = new Map<string, SiteResult>();
  const cached = await cachedSites(competitors.map((c) => c.placeId));
  const queue = competitors.filter((c) => {
    const hit = cached.get(c.placeId);
    if (hit && hit.website === c.website) {
      results.set(c.placeId, { status: hit.status, site: hit.profile });
      return false;
    }
    return true;
  });

  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const result = await readOne(clinic, next, deps);
      results.set(next.placeId, result);
      await saveSite(next.placeId, next.website, result.status, result.site);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  log.info({ competitors: competitors.length, cached: cached.size, read: [...results.values()].filter((r) => r.status === "read").length }, "competitor websites read");
  return results;
}

async function readOne(clinic: Clinic, c: Pick<Competitor, "placeId" | "name" | "website" | "disciplines">, deps: PipelineDeps): Promise<SiteResult> {
  if (!c.website) return { status: "no_website" };
  const t0 = Date.now();
  try {
    const disciplines = c.disciplines.length ? c.disciplines : clinic.disciplines;
    const notes = await deps.ai.readWeb({ urls: [c.website], system: understandSystem(), question: understandCompetitorQuestion(c.name), tier: "light" });
    const site = await deps.ai.structured({ schema: Understanding, system: "You extract structured facts from notes.", user: understandExtractPrompt(disciplines, notes), tier: "light" });
    if (site.services.length === 0 && !site.booking && !site.hours && site.team.length === 0) {
      // The page loaded but said nothing usable (a script-only site, a parked domain, a splash page).
      log.warn({ placeId: c.placeId, ms: Date.now() - t0 }, "competitor website empty");
      return { status: "unreadable" };
    }
    log.info({ placeId: c.placeId, services: site.services.length, ms: Date.now() - t0 }, "competitor website read");
    return { status: "read", site };
  } catch (err) {
    log.warn({ placeId: c.placeId, ms: Date.now() - t0, err: err instanceof Error ? { message: err.message } : String(err) }, "competitor website unreadable");
    return { status: "unreadable" };
  }
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(the|and|of|for|a|an|services?|treatments?|therapy|therapies|care|clinic)\b/g, " ")
    .replace(/\b(dentistry|dentists?)\b/g, "dental")
    .replace(/\b(physiotherapy|physical)\b/g, "physio")
    .replace(/s\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Services on a rival's site that the owner's site does not mention, by a forgiving word match. */
export function servicesGap(ownServices: string[], theirServices: string[]): string[] {
  const own = ownServices.map(normalize).filter(Boolean);
  const overlaps = (a: string, b: string) => a === b || a.includes(b) || b.includes(a);
  const kept: string[] = [];
  const out: string[] = [];
  for (const t of theirServices) {
    const n = normalize(t);
    if (!n || own.some((o) => overlaps(o, n)) || kept.some((k) => overlaps(k, n))) continue;
    kept.push(n);
    out.push(t);
  }
  return out;
}

/** One line per competitor site for the model prompts: services, booking, hours, billing, offers. */
export function siteSummaryLines(competitors: Competitor[]): string {
  const read = competitors.filter((c) => c.siteStatus === "read" && c.site);
  if (read.length === 0) return "No competitor website could be read in this report.";
  return read
    .map((c) => {
      const s = c.site!;
      const bits = [
        `services: ${s.services.join(", ") || "none listed"}`,
        c.servicesNotOnYourSite.length ? `not on the owner's site: ${c.servicesNotOnYourSite.join(", ")}` : "",
        s.booking ? `booking: ${s.booking.online ? `online${s.booking.tool ? ` (${s.booking.tool})` : ""}` : "phone only"}` : "",
        s.hours ? `hours: ${s.hours}` : "",
        s.directBilling === true ? "direct billing" : "",
        s.newPatientOffer ? `new-patient offer: ${s.newPatientOffer}` : "",
        s.telehealth ? "telehealth" : "",
        s.languages.length ? `languages: ${s.languages.join(", ")}` : "",
        s.team.length ? `team: ${s.team.length} named (${[...new Set(s.team.map((t) => t.role))].join(", ")})` : "",
        s.accessibility.length ? `access: ${s.accessibility.join(", ")}` : "",
        s.locationsCount && s.locationsCount > 1 ? `${s.locationsCount} locations` : "",
        s.trustSignals.length ? `trust: ${s.trustSignals.join(", ")}` : "",
        s.freshness ? `latest content: ${s.freshness}` : "",
      ].filter(Boolean);
      return `- ${c.name}: ${bits.join(" | ")}`;
    })
    .join("\n");
}
