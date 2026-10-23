import { z } from "zod";
import { IsoDate } from "./common";

/** A deterministic look at the clinic's own website and Google profile. No model involved. */
export const PageSpeed = z.object({
  performanceScore: z.number().min(0).max(100),
  lcpMs: z.number().nullable(),
  cls: z.number().nullable(),
  inpMs: z.number().nullable(),
});
export type PageSpeed = z.infer<typeof PageSpeed>;

export const PageCheck = z.object({
  url: z.string(),
  hasTitle: z.boolean(),
  titleLength: z.number().int().nonnegative(),
  hasMetaDescription: z.boolean(),
  hasCanonical: z.boolean(),
  h1Count: z.number().int().nonnegative(),
  hasViewportMeta: z.boolean(),
  isHttps: z.boolean(),
  imagesMissingAlt: z.number().int().nonnegative(),
});
export type PageCheck = z.infer<typeof PageCheck>;

export const SeoAudit = z.object({
  /** Null when the clinic has no website: only the Google profile checks apply. */
  website: z.string().nullable(),
  robots: z.object({ exists: z.boolean(), fetchOk: z.boolean(), disallowsEverything: z.boolean(), sitemapUrls: z.array(z.string()) }).nullable(),
  sitemap: z.object({ exists: z.boolean(), urlCount: z.number().int().nonnegative(), isStale: z.boolean().nullable() }).nullable(),
  pagespeedMobile: PageSpeed.nullable(),
  pagespeedDesktop: PageSpeed.nullable(),
  pages: z.array(PageCheck),
  serviceCoverage: z.array(z.object({ service: z.string(), covered: z.boolean(), matchedUrl: z.string().optional() })),
  schemaMarkup: z.object({ present: z.boolean(), types: z.array(z.string()), nameMatches: z.boolean().nullable(), phoneMatches: z.boolean().nullable() }).nullable(),
  /** Niche search terms from the site reading that appear in no fetched title or heading. */
  keywordGaps: z.array(z.string()),
  gbp: z.object({
    hasWebsite: z.boolean(),
    hasHours: z.boolean(),
    /** A declared discipline whose usual Google category is missing from the listing. */
    missingCategory: z.string().nullable(),
    reviews90d: z.object({ yours: z.number().int(), median: z.number() }).nullable(),
    responseRate: z.object({ yours: z.number(), median: z.number() }).nullable(),
  }),
  fetchedAt: IsoDate,
});
export type SeoAudit = z.infer<typeof SeoAudit>;
