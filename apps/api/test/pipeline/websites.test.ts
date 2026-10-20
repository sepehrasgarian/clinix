import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Competitor } from "@clinix/contracts";
import { fixtureClinic, fixtureReport } from "@clinix/contracts/fixtures";
import { resetDbForTests } from "../../src/db/connection.js";
import { cachedSites, saveSite } from "../../src/db/sites.js";
import { readCompetitorSites, servicesGap, siteSummaryLines } from "../../src/pipeline/websites.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { testGuides } from "../helpers.js";

const profile = { ...fixtureReport.competitors[0].site! };

function deps(fail = false): PipelineDeps {
  return {
    places: {} as PipelineDeps["places"],
    guides: testGuides(),
    reviews: {} as PipelineDeps["reviews"],
    ai: {
      readWeb: vi.fn(async ({ urls }: { urls: string[] }) => {
        if (fail || urls[0].includes("broken")) throw new Error("fetch failed");
        return urls[0].includes("empty") ? "Notes about empty.example: the page shows only a logo." : "Services: implants, whitening. Online booking: yes.";
      }),
      structured: vi.fn(async ({ user }: { user: string }) => (user.includes("empty.example") ? { ...profile, services: [], booking: undefined, hours: undefined, team: [] } : profile)),
    } as unknown as PipelineDeps["ai"],
  };
}

const rival = (placeId: string, website?: string): Pick<Competitor, "placeId" | "name" | "website" | "disciplines"> => ({ placeId, name: placeId, website, disciplines: ["dentistry"] });

describe("servicesGap", () => {
  it("lists rival services the owner's site does not mention, ignoring case, accents, plurals and filler words", () => {
    expect(servicesGap(["Teeth cleaning", "Invisalign", "Emergency dentistry"], ["cleaning", "invisalign treatment", "Dental implants", "Implants", "Sedation dentistry", "emergency dental care"])).toEqual(["Dental implants", "Sedation dentistry"]);
    expect(servicesGap([], ["x"])).toEqual(["x"]);
    expect(servicesGap(["x"], [])).toEqual([]);
  });
});

describe("readCompetitorSites", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });

  it("reads sites with a website, marks the rest, survives a broken site, and caches results", async () => {
    const d = deps();
    const rivals = [rival("p_site", "https://a.example"), rival("p_none"), rival("p_broken", "https://broken.example"), rival("p_empty", "https://empty.example")];
    const first = await readCompetitorSites(fixtureClinic, rivals, d);
    expect(first.get("p_site")).toMatchObject({ status: "read", site: { services: profile.services } });
    expect(first.get("p_none")).toEqual({ status: "no_website" });
    expect(first.get("p_broken")).toEqual({ status: "unreadable" });
    expect(first.get("p_empty")).toEqual({ status: "unreadable" }); // loaded, but said nothing usable
    expect(d.ai.readWeb).toHaveBeenCalledTimes(3);

    const cached = await cachedSites(["p_site", "p_broken", "p_none"]);
    expect(cached.get("p_site")?.status).toBe("read");
    expect(cached.get("p_broken")?.status).toBe("unreadable");

    const again = await readCompetitorSites(fixtureClinic, rivals, d);
    expect(again.get("p_site")?.status).toBe("read");
    expect(d.ai.readWeb).toHaveBeenCalledTimes(3); // nothing fetched twice
  });

  it("refetches when the website changed and ignores stale cache entries", async () => {
    await saveSite("p_site", "https://old.example", "read", profile);
    const d = deps();
    await readCompetitorSites(fixtureClinic, [rival("p_site", "https://new.example")], d);
    expect(d.ai.readWeb).toHaveBeenCalledTimes(1);
    expect((await cachedSites(["p_site"], 0)).size).toBe(0);
  });
});

describe("siteSummaryLines", () => {
  it("summarises read sites for the model and says so when none could be read", () => {
    const lines = siteSummaryLines(fixtureReport.competitors);
    expect(lines).toContain("Yonge Smile Studio: services: cleaning, whitening");
    expect(lines).toContain("not on the owner's site: dental implants, sedation dentistry");
    expect(lines).toContain("booking: online (Dentally)");
    expect(lines).toContain("new-patient offer: Free whitening kit");
    expect(lines).not.toContain("Sheppard");
    expect(siteSummaryLines([])).toMatch(/No competitor website/);
  });
});
