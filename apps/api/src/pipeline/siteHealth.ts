import { DISCIPLINE_LABELS, disciplineInfo, median, type Competitor, type Discipline, type Place, type Review, type SeoAudit, type Understanding } from "@clinix/contracts";
import { runPageSpeed } from "../clients/pagespeed.js";
import { nowIso } from "../lib/ids.js";
import { log } from "../lib/log.js";
import { safeGetText, type FetchDeps } from "../lib/safeFetch.js";
import { isStale, keywordGaps, parsePage, parseRobots, parseSitemap, schemaMatch, serviceCoverage, slugOf, type FetchedPage } from "../lib/seoParse.js";

/**
 * Phase: a deterministic check of the clinic's own website and Google profile. Best effort:
 * every fetch is guarded and capped, and any failure leaves that check empty rather than
 * failing the run. Returns null only when the whole audit throws.
 */
export const HTML_MAX = 400_000;
export const FETCH_TIMEOUT_MS = 20_000;
export const MAX_SERVICE_PAGES = 5;
export const MAX_CHILD_SITEMAPS = 3;
const REVIEW_WINDOW_DAYS = 90;
const GENERIC_TYPES = new Set(["medical_clinic", "doctor", "health", "clinic", "point_of_interest", "establishment"]);

export type SiteHealthInput = {
  place: Place;
  understanding: Understanding;
  disciplines: Discipline[];
  competitors: Competitor[];
  reviewsByPlace: Map<string, Review[]>;
};
export type SiteHealthDeps = FetchDeps & { pagespeedKey?: string; now?: Date };

export async function auditSite(input: SiteHealthInput, deps: SiteHealthDeps = {}): Promise<SeoAudit | null> {
  const t0 = Date.now();
  try {
    const gbp = googleProfile(input, deps.now ?? new Date());
    const website = input.place.website ? normalizeSite(input.place.website) : null;
    if (!website) {
      return { website: null, robots: null, sitemap: null, pagespeedMobile: null, pagespeedDesktop: null, pages: [], serviceCoverage: [], schemaMarkup: null, keywordGaps: [], gbp, fetchedAt: nowIso() };
    }
    const base = new URL(website);
    const fetchOpts = { ...deps, max: HTML_MAX, timeoutMs: FETCH_TIMEOUT_MS, accept: "text/html,application/xml;q=0.9,text/plain;q=0.8" };
    const text = (url: string) => safeGetText(url, fetchOpts).catch(() => null);

    const [robotsRes, home, pagespeedMobile, pagespeedDesktop] = await Promise.all([
      text(new URL("/robots.txt", base).toString()),
      text(base.toString()),
      runPageSpeed(base.toString(), "mobile", deps.pagespeedKey, deps.fetchImpl),
      runPageSpeed(base.toString(), "desktop", deps.pagespeedKey, deps.fetchImpl),
    ]);
    const robotsParsed = robotsRes ? parseRobots(robotsRes.text, base) : null;
    const robots = { exists: !!robotsRes, fetchOk: !!robotsRes, disallowsEverything: robotsParsed?.disallowsEverything ?? false, sitemapUrls: robotsParsed?.sitemapUrls ?? [] };

    const sitemapUrls = [...new Set([...robots.sitemapUrls, new URL("/sitemap.xml", base).toString()])];
    const sitemap = await readSitemap(sitemapUrls, text, deps.now ?? new Date());

    const homePage = home ? parsePage(home.text, home.finalUrl) : null;
    const services = input.understanding.services.slice(0, 12);
    const serviceUrls = pickServicePages(services, sitemap.urls, homePage?.links ?? [], base);
    const fetchedServicePages = (await Promise.all(serviceUrls.map(async (u) => ({ u, got: await text(u) })))).filter((x) => x.got);

    const pages = [
      ...(home ? [{ url: home.finalUrl.toString(), parsed: homePage!, https: home.finalUrl.protocol === "https:" }] : []),
      ...fetchedServicePages.map((x) => ({ url: x.got!.finalUrl.toString(), parsed: parsePage(x.got!.text, x.got!.finalUrl), https: x.got!.finalUrl.protocol === "https:" })),
    ];
    const fetched: FetchedPage[] = pages.map((p) => ({ url: p.url, title: p.parsed.title, headings: p.parsed.headings }));
    const nicheTerms = Object.values(input.understanding.nicheTermsByService).flat();

    const audit: SeoAudit = {
      website,
      robots,
      sitemap: { exists: sitemap.exists, urlCount: sitemap.urls.length, isStale: sitemap.exists ? isStale(sitemap.newestLastmod, deps.now ?? new Date()) : null },
      pagespeedMobile,
      pagespeedDesktop,
      pages: pages.map((p) => ({
        url: p.url,
        hasTitle: !!p.parsed.title,
        titleLength: p.parsed.title?.length ?? 0,
        hasMetaDescription: !!p.parsed.metaDescription,
        hasCanonical: !!p.parsed.canonical,
        h1Count: p.parsed.h1Count,
        hasViewportMeta: p.parsed.hasViewportMeta,
        isHttps: p.https,
        imagesMissingAlt: p.parsed.imagesMissingAlt,
      })),
      serviceCoverage: serviceCoverage(services, fetched, sitemap.urls),
      schemaMarkup: homePage ? schemaMatch(homePage.jsonLd, { name: input.place.name, phone: input.place.phone }) : null,
      keywordGaps: keywordGaps(nicheTerms, fetched),
      gbp,
      fetchedAt: nowIso(),
    };
    log.info({ website, pages: audit.pages.length, sitemapUrls: sitemap.urls.length, pagespeed: !!pagespeedMobile, ms: Date.now() - t0 }, "site health audited");
    return audit;
  } catch (err) {
    log.warn({ ms: Date.now() - t0, err: err instanceof Error ? { message: err.message } : String(err) }, "site health skipped");
    return null;
  }
}

const normalizeSite = (website: string): string | null => {
  try {
    return new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`).toString();
  } catch {
    return null;
  }
};

type TextFetch = (url: string) => Promise<{ text: string; finalUrl: URL } | null>;

/** The first sitemap that answers, with up to three child sitemaps of an index merged in. */
async function readSitemap(candidates: string[], text: TextFetch, now: Date): Promise<{ exists: boolean; urls: string[]; newestLastmod: string | null }> {
  for (const url of candidates) {
    const got = await text(url);
    if (!got || !/<(urlset|sitemapindex)\b/i.test(got.text)) continue;
    const parsed = parseSitemap(got.text);
    if (!parsed.isIndex) return { exists: true, urls: parsed.urls, newestLastmod: parsed.newestLastmod };
    const children = await Promise.all(parsed.urls.slice(0, MAX_CHILD_SITEMAPS).map(text));
    const merged = children.filter((c): c is NonNullable<typeof c> => !!c).map((c) => parseSitemap(c.text));
    const dates = [parsed.newestLastmod, ...merged.map((m) => m.newestLastmod)].filter((d): d is string => !!d);
    return { exists: true, urls: merged.flatMap((m) => m.urls), newestLastmod: dates.length ? dates.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b)) : null };
  }
  void now;
  return { exists: false, urls: [], newestLastmod: null };
}

/** Up to five pages that look like service pages: sitemap paths first, then homepage links, matched on service slugs. */
export function pickServicePages(services: string[], sitemapUrls: string[], links: string[], base: URL): string[] {
  const slugs = services.map(slugOf).filter(Boolean);
  const words = [...new Set(slugs.flatMap((s) => s.split("-")))].filter((w) => w.length > 3);
  const candidates = [...new Set([...sitemapUrls, ...links])].filter((u) => {
    try {
      const url = new URL(u);
      if (url.hostname !== base.hostname || url.pathname === "/" ) return false;
      const path = url.pathname.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return slugs.some((s) => path.includes(s)) || words.some((w) => path.includes(w));
    } catch {
      return false;
    }
  });
  return candidates.slice(0, MAX_SERVICE_PAGES);
}

/** The Google profile checks need no fetch: everything comes from data already collected. */
export function googleProfile(input: SiteHealthInput, now: Date): SeoAudit["gbp"] {
  const since = now.getTime() - REVIEW_WINDOW_DAYS * 24 * 3600 * 1000;
  const recent = (reviews: Review[]) => reviews.filter((r) => Date.parse(r.publishedAt) >= since).length;
  const replyRate = (reviews: Review[]) => (reviews.length ? reviews.filter((r) => !!r.ownerReply).length / reviews.length : null);
  const own = input.reviewsByPlace.get(input.place.placeId) ?? [];
  const rivals = input.competitors.map((c) => input.reviewsByPlace.get(c.placeId) ?? []);
  const rivalRecent = rivals.filter((r) => r.length > 0).map(recent);
  const rivalRates = rivals.map(replyRate).filter((x): x is number => x !== null);
  const ownRate = replyRate(own);
  const missing = input.disciplines.find((d) => {
    const expected = (disciplineInfo(d).googleTypes ?? []).filter((t) => !GENERIC_TYPES.has(t));
    return expected.length > 0 && !expected.some((t) => input.place.types.includes(t));
  });
  return {
    hasWebsite: !!input.place.website,
    hasHours: (input.place.hours?.length ?? 0) > 0,
    missingCategory: missing ? DISCIPLINE_LABELS[missing] : null,
    reviews90d: rivalRecent.length >= 3 ? { yours: recent(own), median: median(rivalRecent) ?? 0 } : null,
    responseRate: rivalRates.length >= 3 && ownRate !== null ? { yours: Math.round(ownRate * 100) / 100, median: Math.round((median(rivalRates) ?? 0) * 100) / 100 } : null,
  };
}

/** Short lines for the report agent: the gaps that matter, nothing that passed. */
export function siteHealthLines(audit: SeoAudit | null): string {
  if (!audit) return "";
  if (!audit.website) return "SITE HEALTH\n- No website on file. Getting a site live is the highest-leverage fix available.";
  const lines: string[] = [];
  if (audit.pagespeedMobile) lines.push(`- Mobile performance ${audit.pagespeedMobile.performanceScore}/100${audit.pagespeedMobile.lcpMs ? ` (largest content paint ${Math.round(audit.pagespeedMobile.lcpMs / 100) / 10} s)` : ""}`);
  if (audit.robots?.disallowsEverything) lines.push("- robots.txt blocks all crawling");
  if (audit.sitemap && !audit.sitemap.exists) lines.push("- No sitemap found");
  if (audit.sitemap?.isStale) lines.push("- Sitemap not updated in over 90 days");
  const missing = audit.serviceCoverage.filter((s) => !s.covered).map((s) => s.service);
  if (missing.length) lines.push(`- No dedicated page for: ${missing.join(", ")}`);
  const noDesc = audit.pages.filter((p) => !p.hasMetaDescription).length;
  if (noDesc) lines.push(`- ${noDesc} of ${audit.pages.length} pages have no meta description`);
  if (audit.pages.some((p) => !p.isHttps)) lines.push("- Site served without HTTPS");
  if (audit.schemaMarkup && !audit.schemaMarkup.present) lines.push("- No local-business structured data on the homepage");
  if (audit.schemaMarkup?.phoneMatches === false) lines.push("- Phone number on the site differs from the Google listing");
  if (audit.keywordGaps.length) lines.push(`- Patient search terms absent from titles and headings: ${audit.keywordGaps.slice(0, 6).join(", ")}`);
  if (audit.gbp.missingCategory) lines.push(`- Google listing lacks the ${audit.gbp.missingCategory} category`);
  if (!audit.gbp.hasHours) lines.push("- Google listing has no opening hours");
  if (audit.gbp.reviews90d && audit.gbp.reviews90d.yours < audit.gbp.reviews90d.median) lines.push(`- ${audit.gbp.reviews90d.yours} reviews in the last 90 days vs a rival median of ${audit.gbp.reviews90d.median}`);
  if (audit.gbp.responseRate && audit.gbp.responseRate.yours < audit.gbp.responseRate.median) lines.push(`- Replies to ${Math.round(audit.gbp.responseRate.yours * 100)}% of reviews vs a rival median of ${Math.round(audit.gbp.responseRate.median * 100)}%`);
  return lines.length ? `SITE HEALTH (measured, not from reviews)\n${lines.join("\n")}` : "";
}
