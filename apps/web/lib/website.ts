/** Google gives listing websites with tracking (utm_*) parameters; drop those and keep the rest of the address. */
export function cleanWebsite(url: string | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].filter((k) => k.toLowerCase().startsWith("utm_")).forEach((k) => u.searchParams.delete(k));
    const search = u.searchParams.toString();
    return `${u.origin}${u.pathname === "/" && !search ? "" : u.pathname}${search ? `?${search}` : ""}`;
  } catch {
    return url;
  }
}

/** What an owner types for a website without the https://: a domain, optionally with a path. */
const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i;

/** Empty is fine (the field is optional); anything else must look like a domain. */
export const isValidWebsite = (typed: string): boolean => typed.trim() === "" || DOMAIN.test(typed.trim());

/** The host of a website, lowercase and without www., for comparing a typed address with a listing's. */
export function websiteHost(url: string): string {
  const typed = url.trim().replace(/^https?:\/\//i, "");
  return typed.split(/[/?#:]/)[0].toLowerCase().replace(/^www\./, "");
}
