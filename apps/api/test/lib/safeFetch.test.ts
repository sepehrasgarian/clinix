import { describe, expect, it, vi } from "vitest";
import { MAX_REDIRECTS, USER_AGENT, safeGet, safeGetText } from "../../src/lib/safeFetch.js";

const publicHost = async () => ["93.184.216.34"];
const reply = (body: string, init: ResponseInit = {}) => new Response(body, { status: 200, headers: { "content-type": "text/html" }, ...init });

describe("safeGet", () => {
  it("returns the body, type and final url of a public page, sending the bot user agent", async () => {
    const fetchImpl = vi.fn(async () => reply("<p>hi</p>"));
    const got = await safeGet("https://clinic.ca/", { max: 1000, fetchImpl, resolveHost: publicHost });
    expect(new TextDecoder().decode(got!.bytes)).toBe("<p>hi</p>");
    expect(got!.finalUrl.href).toBe("https://clinic.ca/");
    const [, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect((init.headers as Record<string, string>)["user-agent"]).toBe(USER_AGENT);
    expect(init.redirect).toBe("manual");
  });
  it("follows redirects while re-checking each host, and gives up after the cap", async () => {
    const redirect = (to: string) => reply("", { status: 302, headers: { location: to } });
    const fetchImpl = vi.fn(async (url: URL) => (url.pathname === "/final" ? reply("done") : redirect("/final")));
    const got = await safeGet("https://clinic.ca/start", { max: 1000, fetchImpl, resolveHost: publicHost });
    expect(got!.finalUrl.pathname).toBe("/final");

    const forever = vi.fn(async () => redirect("/again"));
    expect(await safeGet("https://clinic.ca/", { max: 1000, fetchImpl: forever, resolveHost: publicHost })).toBeNull();
    expect(forever).toHaveBeenCalledTimes(MAX_REDIRECTS + 1);
  });
  it("refuses a redirect into a private address", async () => {
    const fetchImpl = vi.fn(async () => reply("", { status: 302, headers: { location: "http://169.254.169.254/latest" } }));
    await expect(safeGet("https://clinic.ca/", { max: 1000, fetchImpl, resolveHost: publicHost })).rejects.toThrow();
  });
  it("returns null for a non-http url, a malformed url and an oversized body", async () => {
    const fetchImpl = vi.fn(async () => reply("x".repeat(50)));
    expect(await safeGet("ftp://clinic.ca/", { max: 1000, fetchImpl, resolveHost: publicHost })).toBeNull();
    expect(await safeGet("not a url", { max: 1000, fetchImpl, resolveHost: publicHost })).toBeNull();
    expect(await safeGet("https://clinic.ca/", { max: 10, fetchImpl, resolveHost: publicHost })).toBeNull();
    const declared = vi.fn(async () => reply("tiny", { headers: { "content-length": "99999" } }));
    expect(await safeGet("https://clinic.ca/", { max: 10, fetchImpl: declared, resolveHost: publicHost })).toBeNull();
  });
  it("reports a non-2xx status with an empty body instead of throwing", async () => {
    const fetchImpl = vi.fn(async () => reply("gone", { status: 404 }));
    const got = await safeGet("https://clinic.ca/old", { max: 1000, fetchImpl, resolveHost: publicHost });
    expect(got!.status).toBe(404);
    expect(got!.bytes.byteLength).toBe(0);
  });
});

describe("safeGetText", () => {
  it("decodes a 2xx body and returns null for anything else", async () => {
    const ok = vi.fn(async () => reply("<title>Clinic</title>"));
    expect((await safeGetText("https://clinic.ca/", { max: 1000, fetchImpl: ok, resolveHost: publicHost }))!.text).toContain("Clinic");
    const missing = vi.fn(async () => reply("", { status: 500 }));
    expect(await safeGetText("https://clinic.ca/", { max: 1000, fetchImpl: missing, resolveHost: publicHost })).toBeNull();
  });
});
