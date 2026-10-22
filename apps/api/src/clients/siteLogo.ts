import { assertPublicHost, type HostResolver } from "../lib/publicHost.js";

export type LogoImage = { bytes: ArrayBuffer; contentType: string };
type Deps = { fetchImpl?: typeof fetch; resolveHost?: HostResolver };

const MAX_HTML = 400_000;
const MAX_IMAGE = 600_000;
const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;
const IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif|svg\+xml|x-icon|vnd\.microsoft\.icon)$/i;

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(2).find((v) => v !== undefined);

/** Collects every `logo` value in the page's JSON-LD: a URL string or an ImageObject with a url. */
function jsonLdLogos(html: string, base: URL): string[] {
  const urls: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      const link = key === "logo" ? (typeof value === "string" ? value : (value as { url?: unknown } | null)?.url) : undefined;
      if (typeof link === "string") urls.push(link);
      else walk(value);
    }
  };
  for (const [, body] of html.matchAll(/<script\b[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(body)); } catch { /* malformed JSON-LD is ignored */ }
  }
  return urls.flatMap((u) => { try { return [new URL(u, base).toString()]; } catch { return []; } });
}

/** Images on the page that call themselves a logo (class, id, alt or file name), in page order. */
function logoImages(html: string, base: URL): string[] {
  const urls: string[] = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const src = attr(tag, "src");
    if (!src || !/logo/i.test(`${attr(tag, "class")} ${attr(tag, "id")} ${attr(tag, "alt")} ${src}`) || src.startsWith("data:")) continue;
    try { urls.push(new URL(src, base).toString()); } catch { /* unusable address */ }
  }
  return urls;
}

/** Where a site's logo may be, best first: its declared logo, a logo image in the page, then its icons. */
export function logoCandidates(html: string, base: URL): string[] {
  return [...new Set([...jsonLdLogos(html, base), ...logoImages(html, base), ...iconCandidates(html, base)])];
}

/** Icon links on a page, best first: touch icons by size, then other icons by size, and /favicon.ico last. */
export function iconCandidates(html: string, base: URL): string[] {
  const found: { url: string; score: number }[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    const href = attr(tag, "href");
    if (!href || !/\b(apple-touch-icon(-precomposed)?|icon|shortcut icon)\b/.test(rel) || /mask-icon/.test(rel)) continue;
    const size = Math.max(0, ...(attr(tag, "sizes") ?? "").split(/\s+/).map((s) => parseInt(s, 10) || 0));
    const vector = /\.svg(\?|$)/i.test(href) || /svg/i.test(attr(tag, "type") ?? "");
    let url: string;
    try { url = new URL(href, base).toString(); } catch { continue; }
    found.push({ url, score: (rel.includes("apple-touch-icon") ? 1000 : 0) + (vector ? 512 : size) });
  }
  found.sort((a, b) => b.score - a.score);
  const list = [...new Set(found.map((f) => f.url))];
  const fallback = new URL("/favicon.ico", base).toString();
  return list.includes(fallback) ? list : [...list, fallback];
}

/** Fetches a public http(s) URL with a timeout, a size cap and every redirect checked, so it cannot be steered inward. */
async function safeGet(url: string, max: number, { fetchImpl = fetch, resolveHost }: Deps): Promise<{ bytes: ArrayBuffer; contentType: string; finalUrl: URL } | null> {
  let current = new URL(url);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (current.protocol !== "http:" && current.protocol !== "https:") return null;
    await assertPublicHost(current.hostname, resolveHost);
    const res = await fetchImpl(current, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": "ClinxBot/1.0 (+https://clinx.app)", accept: "text/html,image/*;q=0.9" } });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) return null;
      current = new URL(next, current);
      continue;
    }
    if (!res.ok) return null;
    if (Number(res.headers.get("content-length") ?? 0) > max) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > max) return null;
    return { bytes, contentType: res.headers.get("content-type") ?? "", finalUrl: current };
  }
  return null;
}

/** The site's logo as an image: the logo it declares, or its touch icon or favicon, validated as a small real image. Null when there is none. */
export async function fetchSiteLogo(website: string, deps: Deps = {}): Promise<LogoImage | null> {
  let base: URL;
  try { base = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`); } catch { return null; }
  let candidates = [new URL("/favicon.ico", base).toString()];
  try {
    const page = await safeGet(base.toString(), MAX_HTML, deps);
    if (page && /html/i.test(page.contentType)) candidates = logoCandidates(new TextDecoder().decode(page.bytes), page.finalUrl);
  } catch { /* the page itself failing still leaves /favicon.ico to try */ }
  for (const url of candidates.slice(0, 5)) {
    try {
      const img = await safeGet(url, MAX_IMAGE, deps);
      const type = img?.contentType.split(";")[0].trim() ?? "";
      if (img && IMAGE_TYPES.test(type) && img.bytes.byteLength > 100) return { bytes: img.bytes, contentType: type };
    } catch { /* try the next candidate */ }
  }
  return null;
}
