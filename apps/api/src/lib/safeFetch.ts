import { assertPublicHost, type HostResolver } from "./publicHost.js";

/**
 * Fetches a public http(s) URL with a timeout, a size cap and every redirect checked, so a
 * server-side fetch of a third-party site can never be steered at loopback, private or
 * metadata addresses. Returns null for anything that is not a usable public response.
 */
export type FetchDeps = { fetchImpl?: typeof fetch; resolveHost?: HostResolver };
export type Fetched = { bytes: ArrayBuffer; contentType: string; finalUrl: URL; status: number };

export const MAX_REDIRECTS = 3;
export const USER_AGENT = "ClinxBot/1.0 (+https://clinx.app)";

export async function safeGet(
  url: string,
  { max, timeoutMs = 5000, accept = "text/html,image/*;q=0.9", fetchImpl = fetch, resolveHost }: FetchDeps & { max: number; timeoutMs?: number; accept?: string },
): Promise<Fetched | null> {
  let current: URL;
  try {
    current = new URL(url);
  } catch {
    return null;
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (current.protocol !== "http:" && current.protocol !== "https:") return null;
    await assertPublicHost(current.hostname, resolveHost);
    const res = await fetchImpl(current, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": USER_AGENT, accept } });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) return null;
      current = new URL(next, current);
      continue;
    }
    if (!res.ok) return { bytes: new ArrayBuffer(0), contentType: res.headers.get("content-type") ?? "", finalUrl: current, status: res.status };
    if (Number(res.headers.get("content-length") ?? 0) > max) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > max) return null;
    return { bytes, contentType: res.headers.get("content-type") ?? "", finalUrl: current, status: res.status };
  }
  return null;
}

/** `safeGet` for text: the decoded body, or null when missing, too large or not a 2xx. */
export async function safeGetText(url: string, opts: FetchDeps & { max: number; timeoutMs?: number; accept?: string }): Promise<{ text: string; finalUrl: URL; contentType: string } | null> {
  const got = await safeGet(url, opts);
  if (!got || got.status < 200 || got.status >= 300) return null;
  return { text: new TextDecoder().decode(got.bytes), finalUrl: got.finalUrl, contentType: got.contentType };
}
