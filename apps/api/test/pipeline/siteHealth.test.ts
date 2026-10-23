import { describe, expect, it, vi } from "vitest";
import type { Competitor, Place, Review, Understanding } from "@clinix/contracts";
import { auditSite, googleProfile, pickServicePages, siteHealthLines } from "../../src/pipeline/siteHealth.js";
import { safeGet } from "../../src/lib/safeFetch.js";

const publicHost = async () => ["93.184.216.34"];
const now = new Date("2026-10-22T00:00:00Z");
const understanding: Understanding = { services: ["Invisalign", "Emergency dentistry"], specializations: [], languages: ["English"], positioning: "x", nicheTermsByService: { Invisalign: ["clear aligners"], "Emergency dentistry": ["same day dentist"] }, team: [], accessibility: [], socialLinks: [], trustSignals: [] };
const place: Place = { placeId: "p_own", name: "Finch East Family Dental", address: "77 Finch Ave E", lat: 43.78, lng: -79.41, website: "https://clinic.example", phone: "+1 416-555-0100", types: ["dentist"], hours: ["Mon 9-5"], sampleReviews: [] };
const rival = (placeId: string): Competitor => ({ placeId, name: placeId, distanceKm: 1, disciplines: ["dentistry"], reviewsAnalyzed: 3, siteStatus: "no_website", servicesNotOnYourSite: [] });
const review = (placeId: string, daysAgo: number, reply = false): Review => ({ id: `r_${placeId}_${daysAgo}`, placeId, rating: 5, text: "ok", publishedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(), source: "places", ...(reply ? { ownerReply: "thanks" } : {}) });

const site: Record<string, string> = {
  "https://clinic.example/robots.txt": "User-agent: *\nDisallow: /admin\nSitemap: https://clinic.example/sitemap.xml",
  "https://clinic.example/sitemap.xml": `<urlset><url><loc>https://clinic.example/</loc><lastmod>2026-02-01</lastmod></url><url><loc>https://clinic.example/invisalign</loc></url><url><loc>https://clinic.example/about</loc></url></urlset>`,
  "https://clinic.example/": `<html><head><title>Finch East Family Dental</title><meta name="viewport" content="w"><script type="application/ld+json">{"@type":"Dentist","name":"Finch East Family Dental","telephone":"4165550100"}</script></head><body><h1>Hi</h1><img src="a.png"></body></html>`,
  "https://clinic.example/invisalign": `<html><head><title>Invisalign in North York</title><meta name="description" content="x"></head><body><h1>Clear aligners</h1></body></html>`,
};
const fetchImpl = vi.fn(async (u: URL | string) => {
  const body = site[String(u)];
  return body === undefined ? new Response("nope", { status: 404 }) : new Response(body, { headers: { "content-type": String(u).endsWith(".xml") ? "application/xml" : "text/html" } });
});

describe("safeGet guard", () => {
  it("refuses non-http schemes and private hosts, and follows at most three redirects", async () => {
    expect(await safeGet("file:///etc/passwd", { max: 1000 })).toBeNull();
    for (const host of ["127.0.0.1", "10.0.0.5", "169.254.169.254"]) {
      await expect(safeGet(`http://${host}/`, { max: 1000, resolveHost: async () => [host] })).rejects.toThrow(/not public/);
    }
    const loop = vi.fn(async () => new Response(null, { status: 302, headers: { location: "/again" } }));
    expect(await safeGet("https://clinic.example/", { max: 1000, fetchImpl: loop as unknown as typeof fetch, resolveHost: publicHost })).toBeNull();
    expect(loop).toHaveBeenCalledTimes(4);
  });
});

describe("auditSite", () => {
  it("audits robots, sitemap, pages, coverage, schema, gaps and the Google profile without PageSpeed", async () => {
    const reviewsByPlace = new Map<string, Review[]>([
      ["p_own", [review("p_own", 10, true), review("p_own", 200)]],
      ["a", [review("a", 5), review("a", 20, true), review("a", 30, true)]],
      ["b", [review("b", 15, true)]],
      ["c", [review("c", 400)]],
    ]);
    const audit = await auditSite({ place, understanding, disciplines: ["dentistry", "dental_hygiene"], competitors: [rival("a"), rival("b"), rival("c")], reviewsByPlace }, { fetchImpl: fetchImpl as unknown as typeof fetch, resolveHost: publicHost, now });
    expect(audit).not.toBeNull();
    expect(audit!.website).toBe("https://clinic.example/");
    expect(audit!.robots).toEqual({ exists: true, fetchOk: true, disallowsEverything: false, sitemapUrls: ["https://clinic.example/sitemap.xml"] });
    expect(audit!.sitemap).toEqual({ exists: true, urlCount: 3, isStale: true });
    expect(audit!.pagespeedMobile).toBeNull();
    expect(audit!.pages.map((p) => p.url)).toEqual(["https://clinic.example/", "https://clinic.example/invisalign"]);
    expect(audit!.pages[0]).toMatchObject({ hasTitle: true, hasMetaDescription: false, hasCanonical: false, h1Count: 1, hasViewportMeta: true, isHttps: true, imagesMissingAlt: 1 });
    expect(audit!.serviceCoverage).toEqual([{ service: "Invisalign", covered: true, matchedUrl: "https://clinic.example/invisalign" }, { service: "Emergency dentistry", covered: false }]);
    expect(audit!.schemaMarkup).toEqual({ present: true, types: ["Dentist"], nameMatches: true, phoneMatches: true });
    expect(audit!.keywordGaps).toEqual(["same day dentist"]);
    expect(audit!.gbp).toEqual({ hasWebsite: true, hasHours: true, missingCategory: "Dental hygiene", reviews90d: { yours: 1, median: 1 }, responseRate: { yours: 0.5, median: 0.67 } });
  });

  it("with no website keeps only the Google profile checks, and never throws when fetches fail", async () => {
    const none = await auditSite({ place: { ...place, website: undefined, hours: undefined }, understanding, disciplines: ["dentistry"], competitors: [], reviewsByPlace: new Map() }, { now });
    expect(none).toMatchObject({ website: null, robots: null, sitemap: null, pages: [], serviceCoverage: [], schemaMarkup: null, keywordGaps: [], gbp: { hasWebsite: false, hasHours: false, missingCategory: null, reviews90d: null, responseRate: null } });
    const broken = vi.fn(async () => { throw new Error("network down"); });
    const audit = await auditSite({ place, understanding, disciplines: ["dentistry"], competitors: [], reviewsByPlace: new Map() }, { fetchImpl: broken as unknown as typeof fetch, resolveHost: publicHost, now });
    expect(audit).toMatchObject({ website: "https://clinic.example/", robots: { exists: false }, sitemap: { exists: false }, pages: [], schemaMarkup: null, keywordGaps: [] });
  });

  it("picks service pages by slug from the sitemap and homepage links, five at most", () => {
    const base = new URL("https://clinic.example/");
    const urls = ["https://clinic.example/", "https://clinic.example/invisalign", "https://clinic.example/about", "https://other.example/invisalign", "https://clinic.example/services/emergency-dentistry"];
    expect(pickServicePages(["Invisalign", "Emergency dentistry"], urls, ["https://clinic.example/blog/invisalign-tips"], base)).toEqual(["https://clinic.example/invisalign", "https://clinic.example/services/emergency-dentistry", "https://clinic.example/blog/invisalign-tips"]);
    const many = Array.from({ length: 9 }, (_, i) => `https://clinic.example/invisalign-${i}`);
    expect(pickServicePages(["Invisalign"], many, [], base)).toHaveLength(5);
  });

  it("writes only the gaps into the prompt lines", () => {
    const gbp = googleProfile({ place, understanding, disciplines: ["dentistry"], competitors: [], reviewsByPlace: new Map() }, now);
    expect(siteHealthLines(null)).toBe("");
    expect(siteHealthLines({ website: null, robots: null, sitemap: null, pagespeedMobile: null, pagespeedDesktop: null, pages: [], serviceCoverage: [], schemaMarkup: null, keywordGaps: [], gbp, fetchedAt: now.toISOString() })).toMatch(/No website on file/);
    const lines = siteHealthLines({ website: "https://clinic.example/", robots: { exists: true, fetchOk: true, disallowsEverything: false, sitemapUrls: [] }, sitemap: { exists: false, urlCount: 0, isStale: null }, pagespeedMobile: { performanceScore: 41, lcpMs: 4800, cls: 0.2, inpMs: 300 }, pagespeedDesktop: null, pages: [{ url: "https://clinic.example/", hasTitle: true, titleLength: 10, hasMetaDescription: true, hasCanonical: true, h1Count: 1, hasViewportMeta: true, isHttps: true, imagesMissingAlt: 0 }], serviceCoverage: [{ service: "Botox", covered: false }, { service: "Invisalign", covered: true }], schemaMarkup: { present: true, types: ["Dentist"], nameMatches: true, phoneMatches: true }, keywordGaps: [], gbp, fetchedAt: now.toISOString() });
    expect(lines).toContain("Mobile performance 41/100 (largest content paint 4.8 s)");
    expect(lines).toContain("No sitemap found");
    expect(lines).toContain("No dedicated page for: Botox");
    expect(lines).not.toContain("meta description");
  });
});
