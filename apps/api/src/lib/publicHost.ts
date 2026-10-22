import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** True for loopback, private, link-local and other addresses a public website should never resolve to. */
export function isPrivateAddress(ip: string): boolean {
  const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    return v === "::" || v === "::1" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
  }
  return true;
}

export type HostResolver = (hostname: string) => Promise<string[]>;
const resolveAll: HostResolver = async (hostname) => (await lookup(hostname, { all: true })).map((a) => a.address);

/** Throws unless every address the host resolves to is public. Guards server-side fetches of third-party sites. */
export async function assertPublicHost(hostname: string, resolve: HostResolver = resolveAll): Promise<void> {
  const addresses = isIP(hostname) ? [hostname] : await resolve(hostname);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) throw new Error("host is not public");
}
