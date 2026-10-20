import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { GuideLibrary, REFRESH_MS, directorySource, githubSource } from "../../src/prompts/guides.js";

function tempGuides(): string {
  const root = mkdtempSync(join(tmpdir(), "guides-"));
  mkdirSync(join(root, "Disciplines", "Dentistry"), { recursive: true });
  writeFileSync(join(root, "Disciplines", "Dentistry", "dentistry_recommendations.txt"), "PRIVATE DENTISTRY GUIDE\n");
  mkdirSync(join(root, "Disciplines", "Naturopathic Medicine"), { recursive: true });
  writeFileSync(join(root, "Disciplines", "Naturopathic Medicine", "naturopathy_recommendations.txt"), "PRIVATE NATUROPATHY GUIDE");
  writeFileSync(join(root, "synthesize_system.txt"), "PRIVATE PLAN PROMPT");
  return root;
}

describe("GuideLibrary with a folder source", () => {
  it("uses the private guide when present, resolves alias folders, and falls back to the general guide", async () => {
    const lib = new GuideLibrary(directorySource(tempGuides()));
    expect(await lib.guide("dentistry")).toEqual({ text: "PRIVATE DENTISTRY GUIDE", origin: "private" });
    expect((await lib.guide("naturopathy")).origin).toBe("private"); // folder "Naturopathic Medicine" is an alias
    const physio = await lib.guide("physiotherapy");
    expect(physio.origin).toBe("general");
    expect(physio.text).toMatch(/GENERAL HEALTH CLINIC/);
  });
  it("serves a top-level prompt from the private source, else the bundled one", async () => {
    const lib = new GuideLibrary(directorySource(tempGuides()));
    expect(await lib.prompt("synthesize_system.txt")).toBe("PRIVATE PLAN PROMPT");
    expect(await lib.prompt("output_contract.txt")).toMatch(/OUTPUT CONTRACT/);
  });
  it("with no source at all, everything is the bundled general guide", async () => {
    const lib = new GuideLibrary(null);
    expect((await lib.guide("dentistry")).origin).toBe("general");
  });
});

describe("GuideLibrary with the GitHub source", () => {
  const files: Record<string, string> = { "Disciplines/Chiropractic/chiropractic_recommendations.txt": "PRIVATE CHIRO GUIDE" };
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const path = decodeURIComponent(new URL(url).pathname.replace(/^\/repos\/[^/]+\/[^/]+\/contents\//, ""));
    const accept = (init?.headers as Record<string, string>).Accept;
    if (accept.includes("raw")) return files[path] ? new Response(files[path]) : new Response("", { status: 404 });
    const names = Object.keys(files).filter((f) => f.startsWith(path + "/")).map((f) => ({ name: f.slice(path.length + 1) }));
    return names.length ? new Response(JSON.stringify(names)) : new Response("", { status: 404 });
  });

  it("lists and reads through the contents API with a bearer token, and caches for ten minutes", async () => {
    let now = 0;
    const lib = new GuideLibrary(githubSource("sepehrasgarian/clinx-guides", "tok", fetchImpl as unknown as typeof fetch), () => now);
    expect(await lib.guide("chiropractic")).toEqual({ text: "PRIVATE CHIRO GUIDE", origin: "private" });
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const calls = fetchImpl.mock.calls.length;
    await lib.guide("chiropractic");
    expect(fetchImpl.mock.calls.length).toBe(calls); // cached
    now = REFRESH_MS + 1;
    await lib.guide("chiropractic");
    expect(fetchImpl.mock.calls.length).toBeGreaterThan(calls); // refreshed
    expect((await lib.guide("dentistry")).origin).toBe("general"); // missing folder -> fallback
  });

  it("falls back instead of failing when the source is unreachable", async () => {
    const broken = githubSource("x/y", "tok", (async () => new Response("", { status: 500 })) as unknown as typeof fetch);
    const lib = new GuideLibrary(broken);
    expect((await lib.guide("dentistry")).origin).toBe("general");
    expect(await lib.prompt("synthesize_system.txt")).toMatch(/You are ClinX/);
  });
});
