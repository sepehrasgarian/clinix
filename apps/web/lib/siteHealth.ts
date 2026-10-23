import type { SeoAudit } from "@clinix/contracts";

/** Pure: turns the audit into four groups of checks, each "to fix" (with an action) or "passed". */
export type Check = { id: string; title: string; why?: string; action?: string };
export type CheckGroup = { key: "website_technical" | "google_profile" | "reviews_reputation" | "content_visibility"; title: string; toFix: Check[]; passed: Check[] };

const pct = (n: number) => `${Math.round(n * 100)}%`;
const seconds = (ms: number) => `${Math.round(ms / 100) / 10} s`;

export function siteHealthGroups(audit: SeoAudit): CheckGroup[] {
  const tech: CheckGroup = { key: "website_technical", title: "Website and technical", toFix: [], passed: [] };
  const gbp: CheckGroup = { key: "google_profile", title: "Google Business Profile", toFix: [], passed: [] };
  const rep: CheckGroup = { key: "reviews_reputation", title: "Reviews and reputation", toFix: [], passed: [] };
  const content: CheckGroup = { key: "content_visibility", title: "Content and local visibility", toFix: [], passed: [] };
  const put = (g: CheckGroup, ok: boolean, c: Check) => (ok ? g.passed : g.toFix).push(c);

  if (audit.website) {
    const https = audit.pages.length === 0 || audit.pages.every((p) => p.isHttps);
    put(tech, https, { id: "https", title: https ? "Site served over HTTPS" : "Site not served over HTTPS", why: "Browsers mark plain HTTP pages as not secure.", action: "Turn on HTTPS at your host and redirect HTTP to it." });
    if (audit.pagespeedMobile) {
      const ok = audit.pagespeedMobile.performanceScore >= 50;
      put(tech, ok, { id: "speed_mobile", title: `Mobile performance ${audit.pagespeedMobile.performanceScore}/100${audit.pagespeedMobile.lcpMs ? `, main content in ${seconds(audit.pagespeedMobile.lcpMs)}` : ""}`, why: "Most patients open your site on a phone; slow pages lose them before they book.", action: "Compress images, remove unused scripts, and ask your web host about caching." });
    }
    if (audit.pagespeedDesktop) {
      const ok = audit.pagespeedDesktop.performanceScore >= 50;
      put(tech, ok, { id: "speed_desktop", title: `Desktop performance ${audit.pagespeedDesktop.performanceScore}/100`, action: "Compress images and remove unused scripts." });
    }
    if (audit.robots) {
      put(tech, !audit.robots.disallowsEverything, { id: "robots", title: audit.robots.disallowsEverything ? "robots.txt blocks search engines from the whole site" : "Search engines are allowed to crawl the site", why: "A blocked site cannot appear in search results.", action: "Remove the Disallow: / line from robots.txt." });
    }
    if (audit.sitemap) {
      put(tech, audit.sitemap.exists, { id: "sitemap", title: audit.sitemap.exists ? `Sitemap found with ${audit.sitemap.urlCount} pages` : "No sitemap found", why: "A sitemap tells search engines every page you want found.", action: "Publish a sitemap.xml and list it in robots.txt; most site builders do this with one setting." });
      if (audit.sitemap.exists && audit.sitemap.isStale !== null) put(content, !audit.sitemap.isStale, { id: "sitemap_fresh", title: audit.sitemap.isStale ? "Sitemap not updated in over 90 days" : "Sitemap updated in the last 90 days", why: "Search engines favour sites that change.", action: "Publish or update one page a month, even a short news item." });
    }
    const noViewport = audit.pages.filter((p) => !p.hasViewportMeta).length;
    if (audit.pages.length) put(tech, noViewport === 0, { id: "viewport", title: noViewport ? `${noViewport} of ${audit.pages.length} pages are not set up for phones` : "Pages are set up for phones", action: "Add the viewport meta tag; any modern site template includes it." });
    const noTitle = audit.pages.filter((p) => !p.hasTitle).length;
    if (audit.pages.length) put(content, noTitle === 0, { id: "titles", title: noTitle ? `${noTitle} of ${audit.pages.length} pages have no title` : "Every page has a title", action: "Give each page a title with the service and your city, under 60 characters." });
    const noDesc = audit.pages.filter((p) => !p.hasMetaDescription).length;
    if (audit.pages.length) put(content, noDesc === 0, { id: "descriptions", title: noDesc ? `${noDesc} of ${audit.pages.length} pages have no meta description` : "Every page has a meta description", why: "The description is the text under your link in search results.", action: "Write one or two sentences per page saying who it is for and what to do next." });
    const multiH1 = audit.pages.filter((p) => p.h1Count !== 1).length;
    if (audit.pages.length) put(content, multiH1 === 0, { id: "h1", title: multiH1 ? `${multiH1} of ${audit.pages.length} pages do not have exactly one main heading` : "Each page has one main heading", action: "Use one H1 per page that names the service." });
    const alt = audit.pages.reduce((n, p) => n + p.imagesMissingAlt, 0);
    if (audit.pages.length) put(tech, alt === 0, { id: "alt", title: alt ? `${alt} images have no alt text` : "All images have alt text", why: "Alt text helps patients using screen readers and helps search engines read images.", action: "Add a short description to each image in your site editor." });
    const uncovered = audit.serviceCoverage.filter((s) => !s.covered);
    if (audit.serviceCoverage.length) put(content, uncovered.length === 0, { id: "service_pages", title: uncovered.length ? `No dedicated page for ${uncovered.map((s) => s.service).join(", ")}` : "Every service has its own page", why: "Patients search for a service, not a clinic; a page per service is what ranks.", action: "Create one page per service with the service name in the address and the heading." });
    if (audit.schemaMarkup) {
      put(content, audit.schemaMarkup.present, { id: "schema", title: audit.schemaMarkup.present ? `Structured data found (${audit.schemaMarkup.types.join(", ")})` : "No local-business structured data", why: "Structured data lets search engines show your hours, phone and reviews directly.", action: "Add LocalBusiness or MedicalOrganization structured data to the homepage." });
      if (audit.schemaMarkup.phoneMatches !== null) put(gbp, audit.schemaMarkup.phoneMatches, { id: "phone_match", title: audit.schemaMarkup.phoneMatches ? "Phone number matches your Google listing" : "Phone number on the site differs from your Google listing", action: "Use one phone number everywhere." });
      if (audit.schemaMarkup.nameMatches !== null) put(gbp, audit.schemaMarkup.nameMatches, { id: "name_match", title: audit.schemaMarkup.nameMatches ? "Clinic name matches your Google listing" : "Clinic name on the site differs from your Google listing", action: "Use the same clinic name on the site and the listing." });
    }
    if (audit.pages.length) put(content, audit.keywordGaps.length === 0, { id: "keywords", title: audit.keywordGaps.length ? `Patient search terms missing from your headings: ${audit.keywordGaps.slice(0, 5).join(", ")}` : "Your headings use the terms patients search for", action: "Work these phrases into page titles and headings where they fit naturally." });
  }

  put(gbp, audit.gbp.hasWebsite, { id: "gbp_site", title: audit.gbp.hasWebsite ? "Website linked on your Google listing" : "No website on your Google listing", action: "Add your website to the listing in Google Business Profile." });
  put(gbp, audit.gbp.hasHours, { id: "gbp_hours", title: audit.gbp.hasHours ? "Opening hours set on your Google listing" : "No opening hours on your Google listing", why: "Patients check hours before they call.", action: "Add your hours in Google Business Profile." });
  put(gbp, !audit.gbp.missingCategory, { id: "gbp_category", title: audit.gbp.missingCategory ? `Your listing is not categorised as ${audit.gbp.missingCategory}` : "Listing categories match the disciplines you offer", why: "Google shows a clinic for a search only when its category matches.", action: "Add the category in Google Business Profile." });
  if (audit.gbp.reviews90d) {
    const r = audit.gbp.reviews90d;
    put(rep, r.yours >= r.median, { id: "reviews_90d", title: `${r.yours} reviews in the last 90 days, against a nearby median of ${r.median}`, why: "Recent reviews count more than old ones, for patients and for Google.", action: "Ask every happy patient for a review at checkout; a text with the link works best." });
  }
  if (audit.gbp.responseRate) {
    const r = audit.gbp.responseRate;
    put(rep, r.yours >= r.median, { id: "reply_rate", title: `You reply to ${pct(r.yours)} of reviews, against a nearby median of ${pct(r.median)}`, why: "Replies show future patients someone is listening.", action: "Reply to every review within a week, two sentences each." });
  }
  return [tech, gbp, rep, content];
}
