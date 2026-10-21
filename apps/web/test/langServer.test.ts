import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const cookies = vi.fn();
vi.mock("next/headers", () => ({ cookies: () => cookies() }));

import { getLang, getLanding } from "@/lib/i18n/server";

describe("language from the request", () => {
  beforeEach(() => { get.mockReset(); cookies.mockReset(); cookies.mockResolvedValue({ get }); });
  it("reads the clinx_lang cookie", async () => {
    get.mockReturnValue({ value: "fr" });
    expect(await getLang()).toBe("fr");
    expect(get).toHaveBeenCalledWith("clinx_lang");
    expect((await getLanding()).hero.cta).toBe("Commencer");
  });
  it("is English with no cookie, an unknown value, or no request at all", async () => {
    get.mockReturnValue(undefined);
    expect(await getLang()).toBe("en");
    get.mockReturnValue({ value: "fa" });
    expect(await getLang()).toBe("en");
    cookies.mockRejectedValue(new Error("outside a request"));
    expect(await getLang()).toBe("en");
  });
});
