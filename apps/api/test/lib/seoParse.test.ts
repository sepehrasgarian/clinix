import { describe, expect, it } from "vitest";
import { fold, isStale, keywordGaps, parsePage, parseRobots, parseSitemap, schemaMatch, serviceCoverage, slugOf } from "../../src/lib/seoParse.js";

const base = new URL("https://clinic.example/");

describe("parseRobots", () => {
  it("reads sitemap hints and a site-wide disallow for all agents only", () => {
    const r = parseRobots("User-agent: *\nDisallow: /\nSitemap: /sitemap.xml\nSitemap: https://cdn.example/map2.xml # note", base);
    expect(r).toEqual({ disallowsEverything: true, sitemapUrls: ["https://clinic.example/sitemap.xml", "https://cdn.example/map2.xml"] });
    expect(parseRobots("User-agent: Badbot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin", base).disallowsEverything).toBe(false);
    expect(parseRobots("", base)).toEqual({ disallowsEverything: false, sitemapUrls: [] });
  });
});

describe("parseSitemap and staleness", () => {
  it("collects urls, the newest lastmod, and recognises an index", () => {
    const s = parseSitemap(`<?xml version="1.0"?><urlset><url><loc>https://clinic.example/</loc><lastmod>2026-01-05</lastmod></url><url><loc> https://clinic.example/invisalign </loc><lastmod>2026-09-01T10:00:00Z</lastmod></url></urlset>`);
    expect(s).toEqual({ isIndex: false, urls: ["https://clinic.example/", "https://clinic.example/invisalign"], newestLastmod: "2026-09-01T10:00:00Z" });
    expect(parseSitemap(`<sitemapindex><sitemap><loc>https://clinic.example/a.xml</loc></sitemap></sitemapindex>`)).toEqual({ isIndex: true, urls: ["https://clinic.example/a.xml"], newestLastmod: null });
  });
  it("is stale after 90 days and unknown without dates", () => {
    const now = new Date("2026-10-22T00:00:00Z");
    expect(isStale("2026-09-01", now)).toBe(false);
    expect(isStale("2026-06-01", now)).toBe(true);
    expect(isStale(null, now)).toBeNull();
  });
});

describe("parsePage", () => {
  const html = `<html><head><title> Finch East Family Dental | Dentist in North York </title><meta name="viewport" content="width=device-width"><meta name="Description" content="Gentle family dentist."><link rel="canonical" href="https://clinic.example/"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Dentist","name":"Finch East Family Dental","telephone":"+1 (416) 555-0100"}]}</script></head><body><h1>Welcome</h1><h2>Invisalign in North York</h2><img src="a.png" alt="team"><img src="b.png"><a href="/invisalign">Invisalign</a><a href="https://other.example/x">x</a><a href="#top">top</a><a href="mailto:a@b.c">mail</a></body></html>`;
  it("extracts title, meta, canonical, headings, same-host links, images without alt and JSON-LD", () => {
    const p = parsePage(html, base);
    expect(p.title).toBe("Finch East Family Dental | Dentist in North York");
    expect(p.metaDescription).toBe("Gentle family dentist.");
    expect(p.canonical).toBe("https://clinic.example/");
    expect(p.h1Count).toBe(1);
    expect(p.hasViewportMeta).toBe(true);
    expect(p.imagesMissingAlt).toBe(1);
    expect(p.headings).toEqual(["Welcome", "Invisalign in North York"]);
    expect(p.links).toEqual(["https://clinic.example/invisalign"]);
    expect(p.jsonLd).toHaveLength(1);
  });
  it("copes with an empty or malformed page", () => {
    const p = parsePage(`<html><body><script type="application/ld+json">{not json</script></body></html>`, base);
    expect(p).toMatchObject({ title: null, metaDescription: null, canonical: null, h1Count: 0, hasViewportMeta: false, imagesMissingAlt: 0, headings: [], links: [], jsonLd: [] });
  });
});

describe("coverage, gaps and schema", () => {
  it("folds accents and case and matches by path slug or by heading phrase", () => {
    expect(fold("Montréal Physio")).toBe("montreal physio");
    expect(slugOf("Emergency dentistry")).toBe("emergency-dentistry");
    const pages = [
      { url: "https://clinic.example/", title: "Clinique à Montréal", headings: ["Blanchiment des dents"] },
      { url: "https://clinic.example/services/invisalign-montreal", title: null, headings: [] },
    ];
    const cov = serviceCoverage(["Invisalign", "blanchiment des dents", "Implants dentaires", "Clinique a Montreal"], pages, ["https://clinic.example/implants-dentaires/"]);
    expect(cov).toEqual([
      { service: "Invisalign", covered: true, matchedUrl: "https://clinic.example/services/invisalign-montreal" },
      { service: "blanchiment des dents", covered: true, matchedUrl: "https://clinic.example/" },
      { service: "Implants dentaires", covered: true, matchedUrl: "https://clinic.example/implants-dentaires/" },
      { service: "Clinique a Montreal", covered: true, matchedUrl: "https://clinic.example/" },
    ]);
    expect(serviceCoverage(["Botox"], pages)).toEqual([{ service: "Botox", covered: false }]);
  });
  it("reports keyword gaps only when pages were fetched", () => {
    const pages = [{ url: "https://clinic.example/", title: "Same day dentist in Toronto", headings: ["Cracked tooth?"] }];
    expect(keywordGaps(["same day dentist", "cracked tooth", "Invisible braces", "invisible braces"], pages)).toEqual(["Invisible braces"]);
    expect(keywordGaps(["anything"], [])).toEqual([]);
  });
  it("matches structured data name and phone against the listing", () => {
    const blocks = [{ "@graph": [{ "@type": ["Dentist", "LocalBusiness"], name: "Finch East Family Dental", telephone: "(416) 555-0100" }] }];
    expect(schemaMatch(blocks, { name: "Finch East Family Dental", phone: "+1 416-555-0100" })).toEqual({ present: true, types: ["Dentist", "LocalBusiness"], nameMatches: true, phoneMatches: true });
    expect(schemaMatch(blocks, { name: "Other Clinic", phone: "416 555 0199" })).toMatchObject({ nameMatches: false, phoneMatches: false });
    expect(schemaMatch([{ "@type": "WebSite", name: "x" }], { name: "x" })).toEqual({ present: false, types: [], nameMatches: null, phoneMatches: null });
    expect(schemaMatch([{ "@type": "Dentist" }], { name: "x" })).toMatchObject({ present: true, nameMatches: null, phoneMatches: null });
  });
});
