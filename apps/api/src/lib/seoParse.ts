/** Pure parsers for the site-health audit. Regex on HTML is enough for these checks; no DOM library. */

/** Lowercase, accents folded, so "Montréal" matches "montreal". */
export const fold = (s: string): string => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export const digits = (s: string): string => s.replace(/\D/g, "");

export type Robots = { disallowsEverything: boolean; sitemapUrls: string[] };

export function parseRobots(text: string, base: URL): Robots {
  const sitemapUrls: string[] = [];
  let agentAll = false;
  let disallowsEverything = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = [m[0], m[1].toLowerCase(), m[2].trim()];
    if (key === "user-agent") agentAll = value === "*";
    else if (key === "disallow" && agentAll && value === "/") disallowsEverything = true;
    else if (key === "sitemap" && value) {
      try {
        sitemapUrls.push(new URL(value, base).toString());
      } catch {
        /* unusable address */
      }
    }
  }
  return { disallowsEverything, sitemapUrls };
}

export type Sitemap = { isIndex: boolean; urls: string[]; newestLastmod: string | null };

/** Reads `<loc>` and `<lastmod>` from a sitemap or a sitemap index. */
export function parseSitemap(xml: string): Sitemap {
  const isIndex = /<sitemapindex\b/i.test(xml);
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
  const dates = [...xml.matchAll(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/gi)].map((m) => m[1]).filter((d) => !Number.isNaN(Date.parse(d)));
  const newestLastmod = dates.length ? dates.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b)) : null;
  return { isIndex, urls, newestLastmod };
}

export const STALE_DAYS = 90;
/** True when the newest lastmod is older than 90 days; null when the sitemap carries no dates. */
export const isStale = (newestLastmod: string | null, now = new Date()): boolean | null =>
  newestLastmod === null ? null : now.getTime() - Date.parse(newestLastmod) > STALE_DAYS * 24 * 3600 * 1000;

export type ParsedPage = {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  h1Count: number;
  hasViewportMeta: boolean;
  imagesMissingAlt: number;
  headings: string[];
  links: string[];
  jsonLd: unknown[];
};

const attr = (tag: string, name: string): string | undefined =>
  tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(2).find((v) => v !== undefined);

const stripTags = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export function parsePage(html: string, base: URL): ParsedPage {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html;
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const metas = head.match(/<meta\b[^>]*>/gi) ?? [];
  const metaDescription = metas.map((t) => ((attr(t, "name") ?? "").toLowerCase() === "description" ? attr(t, "content") : undefined)).find((v) => v !== undefined);
  const hasViewportMeta = metas.some((t) => (attr(t, "name") ?? "").toLowerCase() === "viewport");
  const canonical = (head.match(/<link\b[^>]*>/gi) ?? []).map((t) => (/\bcanonical\b/i.test(attr(t, "rel") ?? "") ? attr(t, "href") : undefined)).find((v) => v !== undefined);
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const imagesMissingAlt = (html.match(/<img\b[^>]*>/gi) ?? []).filter((t) => attr(t, "alt") === undefined).length;
  const headings = [...html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((m) => stripTags(m[1])).filter(Boolean);
  const links: string[] = [];
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = attr(tag, "href");
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
    try {
      const u = new URL(href, base);
      if (u.hostname === base.hostname) links.push(u.toString().split("#")[0]);
    } catch {
      /* unusable address */
    }
  }
  const jsonLd: unknown[] = [];
  for (const [, body] of html.matchAll(/<script\b[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(JSON.parse(body));
    } catch {
      /* malformed JSON-LD is ignored */
    }
  }
  return {
    title: title ? stripTags(title) || null : null,
    metaDescription: metaDescription?.trim() || null,
    canonical: canonical?.trim() || null,
    h1Count,
    hasViewportMeta,
    imagesMissingAlt,
    headings,
    links: [...new Set(links)],
    jsonLd,
  };
}

/** A service's search slug: the significant words, folded ("Emergency dentistry" → "emergency-dentistry"). */
export const slugOf = (service: string): string =>
  fold(service)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 2 && !["the", "and", "for", "our", "services", "service"].includes(w))
    .join("-");

export type FetchedPage = { url: string; title: string | null; headings: string[] };

/** A service is covered when its slug sits in a page path, or its phrase in a title or heading. */
export function serviceCoverage(services: string[], pages: FetchedPage[], sitemapUrls: string[] = []): { service: string; covered: boolean; matchedUrl?: string }[] {
  return services.map((service) => {
    const slug = slugOf(service);
    const phrase = fold(service).trim();
    const words = slug.split("-").filter(Boolean);
    const byPath = [...pages.map((p) => p.url), ...sitemapUrls].find((u) => {
      const path = fold(decodeURIComponent(new URL(u).pathname)).replace(/[^a-z0-9]+/g, "-");
      return slug ? path.includes(slug) || (words.length > 1 && words.every((w) => path.includes(w))) : false;
    });
    if (byPath) return { service, covered: true, matchedUrl: byPath };
    const byText = pages.find((p) => [p.title ?? "", ...p.headings].some((t) => fold(t).includes(phrase)));
    return byText ? { service, covered: true, matchedUrl: byText.url } : { service, covered: false };
  });
}

/** Niche terms that appear in no fetched title or heading. Empty when nothing was fetched. */
export function keywordGaps(terms: string[], pages: FetchedPage[]): string[] {
  if (pages.length === 0) return [];
  const haystack = fold(pages.flatMap((p) => [p.title ?? "", ...p.headings]).join(" | "));
  const seen = new Set<string>();
  return terms.filter((t) => {
    const key = fold(t).trim();
    if (!key || seen.has(key) || haystack.includes(key)) return false;
    seen.add(key);
    return true;
  });
}

const LOCAL_TYPES = /^(LocalBusiness|MedicalOrganization|MedicalClinic|MedicalBusiness|Dentist|Physiotherapy|Physician|HealthAndBeautyBusiness|DaySpa|Optician|ChiropracticClinic|Hospital)$/i;

/** Every JSON-LD node with a local-business type, flattened from arrays and @graph. */
function localNodes(blocks: unknown[]): { types: string[]; name?: string; telephone?: string }[] {
  const out: { types: string[]; name?: string; telephone?: string }[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    const types = ([] as unknown[]).concat(o["@type"] ?? []).filter((t): t is string => typeof t === "string");
    if (types.some((t) => LOCAL_TYPES.test(t))) out.push({ types, name: typeof o.name === "string" ? o.name : undefined, telephone: typeof o.telephone === "string" ? o.telephone : undefined });
    if (o["@graph"]) walk(o["@graph"]);
  };
  walk(blocks);
  return out;
}

/** Whether the homepage declares the business in JSON-LD, and whether its name and phone agree with the Google listing. */
export function schemaMatch(blocks: unknown[], listing: { name: string; phone?: string }): { present: boolean; types: string[]; nameMatches: boolean | null; phoneMatches: boolean | null } {
  const nodes = localNodes(blocks);
  if (nodes.length === 0) return { present: false, types: [], nameMatches: null, phoneMatches: null };
  const types = [...new Set(nodes.flatMap((n) => n.types))];
  const names = nodes.map((n) => n.name).filter((n): n is string => !!n);
  const phones = nodes.map((n) => n.telephone).filter((p): p is string => !!p);
  const nameMatches = names.length ? names.some((n) => fold(n).includes(fold(listing.name)) || fold(listing.name).includes(fold(n))) : null;
  const phoneMatches = phones.length && listing.phone ? phones.some((p) => digits(p).slice(-10) === digits(listing.phone!).slice(-10)) : null;
  return { present: true, types, nameMatches, phoneMatches };
}
