/** Instagram's own rules: 1 to 30 letters, numbers, periods and underscores, no two periods in a row. */
export const INSTAGRAM_HANDLE = /^(?!.*\.\.)[A-Za-z0-9._]{1,30}$/;

/** Paths on instagram.com that are not profiles. */
const NOT_A_PROFILE = new Set(["p", "reel", "reels", "explore", "stories", "accounts", "direct", "tv", "about", "legal", "developer"]);

/**
 * Reads what an owner typed for Instagram: "@yourclinic", "yourclinic" or a profile link such as
 * "https://www.instagram.com/yourclinic/?hl=en". Returns the handle, `undefined` when the field is empty,
 * and `null` when it is not an Instagram profile.
 */
export function parseInstagram(raw: string): string | null | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  let candidate = text;
  const link = text.match(/^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/([^/?#\s]+)/i);
  if (link) candidate = link[1];
  else if (/[\s/]/.test(text) || /^(?:https?:)?\/\//i.test(text) || /\.(com|ca|net|org|io)\b/i.test(text)) return null;
  candidate = candidate.replace(/^@/, "");
  if (NOT_A_PROFILE.has(candidate.toLowerCase())) return null;
  return INSTAGRAM_HANDLE.test(candidate) ? candidate : null;
}
