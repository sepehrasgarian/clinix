import { describe, expect, it, vi } from "vitest";
import { fetchSiteLogo, iconCandidates, logoCandidates } from "../../src/clients/siteLogo.js";

const png = new Uint8Array(200).fill(7).buffer;
const publicHost = async () => ["93.184.216.34"];
const html = (body: string) => new Response(`<html><head>${body}</head></html>`, { headers: { "content-type": "text/html" } });
const image = (type = "image/png", bytes: ArrayBuffer = png) => new Response(bytes, { headers: { "content-type": type } });

describe("iconCandidates", () => {
  it("puts touch icons first, larger before smaller, and always ends with /favicon.ico", () => {
    const list = iconCandidates(`<link rel="icon" sizes="16x16" href="/s.png"><link rel="apple-touch-icon" sizes="180x180" href="/t.png"><link rel='shortcut icon' href=/f.ico><link rel="mask-icon" href="/m.svg"><link rel="stylesheet" href="/a.css">`, new URL("https://clinic.ca/en/"));
    expect(list).toEqual(["https://clinic.ca/t.png", "https://clinic.ca/s.png", "https://clinic.ca/f.ico", "https://clinic.ca/favicon.ico"]);
  });
  it("falls back to /favicon.ico alone when the page names no icon", () => {
    expect(iconCandidates("<p>hi</p>", new URL("https://clinic.ca"))).toEqual(["https://clinic.ca/favicon.ico"]);
  });
});

describe("fetchSiteLogo", () => {
  it("returns the page's best icon as an image", async () => {
    const fetchImpl = vi.fn(async (u: URL | string) => (String(u).endsWith("/t.png") ? image() : html('<link rel="apple-touch-icon" href="/t.png">')));
    const logo = await fetchSiteLogo("clinic.ca", { fetchImpl: fetchImpl as unknown as typeof fetch, resolveHost: publicHost });
    expect(logo?.contentType).toBe("image/png");
    expect(logo?.bytes.byteLength).toBe(200);
    expect(String(fetchImpl.mock.calls[0][0])).toBe("https://clinic.ca/");
  });
  it("tries /favicon.ico when the page cannot be read", async () => {
    const fetchImpl = vi.fn(async (u: URL | string) => (String(u).endsWith("/favicon.ico") ? image("image/x-icon") : new Response("", { status: 500 })));
    expect((await fetchSiteLogo("https://clinic.ca", { fetchImpl: fetchImpl as unknown as typeof fetch, resolveHost: publicHost }))?.contentType).toBe("image/x-icon");
  });
  it("never fetches a host that resolves to a private address", async () => {
    const fetchImpl = vi.fn();
    expect(await fetchSiteLogo("https://intranet.example", { fetchImpl: fetchImpl as unknown as typeof fetch, resolveHost: async () => ["10.0.0.9"] })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("does not follow a redirect to an internal address", async () => {
    const resolveHost = async (h: string) => (h === "internal.example" ? ["127.0.0.1"] : ["93.184.216.34"]);
    const fetchImpl = vi.fn(async (u: URL | string) => (String(u).startsWith("https://clinic.ca") ? new Response(null, { status: 302, headers: { location: "https://internal.example/x" } }) : image()));
    expect(await fetchSiteLogo("https://clinic.ca", { fetchImpl: fetchImpl as unknown as typeof fetch, resolveHost })).toBeNull();
    expect(fetchImpl.mock.calls.some((c) => String(c[0]).includes("internal.example"))).toBe(false);
  });
  it("refuses something that is not an image, or is too big, and handles junk input", async () => {
    const notImage = vi.fn(async () => html('<link rel="icon" href="/x.png">'));
    expect(await fetchSiteLogo("https://clinic.ca", { fetchImpl: notImage as unknown as typeof fetch, resolveHost: publicHost })).toBeNull();
    const big = vi.fn(async (u: URL | string) => (String(u).endsWith(".png") ? image("image/png", new ArrayBuffer(700_000)) : html('<link rel="icon" href="/x.png">')));
    expect(await fetchSiteLogo("https://clinic.ca", { fetchImpl: big as unknown as typeof fetch, resolveHost: publicHost })).toBeNull();
    expect(await fetchSiteLogo("http://", { resolveHost: publicHost })).toBeNull();
  });
});

describe("logoCandidates", () => {
  const base = new URL("https://clinic.ca");
  it("prefers the logo declared in JSON-LD, then a logo image, then the icons", () => {
    const page = `<link rel="apple-touch-icon" href="/t.png"><script type="application/ld+json">{"@graph":[{"@type":"MedicalBusiness","logo":{"url":"/brand/logo.jpg"}}]}</script><img class="site-logo" src="/img/header.svg"><img src="/hero.jpg">`;
    expect(logoCandidates(page, base)).toEqual(["https://clinic.ca/brand/logo.jpg", "https://clinic.ca/img/header.svg", "https://clinic.ca/t.png", "https://clinic.ca/favicon.ico"]);
  });
  it("accepts a plain logo URL and ignores broken JSON-LD", () => {
    expect(logoCandidates(`<script type="application/ld+json">{"logo":"https://cdn.x/l.png"}</script><script type="application/ld+json">{oops</script>`, base)[0]).toBe("https://cdn.x/l.png");
  });
  it("falls back to the icons when the page declares no logo", () => {
    expect(logoCandidates("<p>hi</p>", base)).toEqual(["https://clinic.ca/favicon.ico"]);
  });
});
