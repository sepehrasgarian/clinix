import { Hono } from "hono";
import { fetchSiteLogo, type LogoImage } from "../clients/siteLogo.js";
import type { PipelineDeps } from "../pipeline/deps.js";

const TTL_MS = 24 * 3600 * 1000;
const DOMAIN = /^(?=.{4,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/i;
const MAX_ENTRIES = 500;

/**
 * Public, like the photo route: a browser <img> cannot send identity headers. It looks the website up from the Google
 * listing (never from the request), so callers cannot point the server at an address of their choosing.
 */
export function logoRoutes(deps: PipelineDeps, fetchLogo: (website: string) => Promise<LogoImage | null> = fetchSiteLogo) {
  const cache = new Map<string, { at: number; logo: LogoImage | null }>();
  const remembered = async (key: string, find: () => Promise<LogoImage | null>) => {
    let entry = cache.get(key);
    if (!entry || Date.now() - entry.at > TTL_MS) {
      const logo = await find().catch(() => null);
      if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
      entry = { at: Date.now(), logo };
      cache.set(key, entry);
    }
    if (!entry.logo) return Response.json({ error: "no logo" }, { status: 404 });
    return new Response(entry.logo.bytes, {
      headers: { "Content-Type": entry.logo.contentType, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" },
    });
  };
  return new Hono()
    // The owner's own site, typed in step 1 or read from the listing, before a listing is confirmed. Only a bare domain is accepted.
    .get("/site/:domain", (c) => {
      const domain = c.req.param("domain").toLowerCase();
      if (!DOMAIN.test(domain)) return c.json({ error: "invalid domain" }, 400);
      return remembered(`site:${domain}`, () => fetchLogo(`https://${domain}`));
    })
    .get("/:placeId", (c) => {
      const placeId = c.req.param("placeId");
      if (!/^[\w-]{8,200}$/.test(placeId)) return c.json({ error: "invalid place id" }, 400);
      return remembered(placeId, async () => {
        const place = await deps.places.details(placeId);
        return place?.website ? fetchLogo(place.website) : null;
      });
    });
}
