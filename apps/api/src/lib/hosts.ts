/** The host of a website URL with a leading `www.` removed, lower-cased; null when the value is not a URL. */
export function websiteHost(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/** Two websites belong to the same clinic when their hosts match. Unknown on either side is not a match. */
export const sameWebsite = (a: string | undefined | null, b: string | undefined | null): boolean => {
  const ha = websiteHost(a);
  return ha !== null && ha === websiteHost(b);
};
