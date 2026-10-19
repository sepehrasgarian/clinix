import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/env.js";

describe("parseEnv", () => {
  it("applies defaults when nothing is set", () => {
    const env = parseEnv({});
    expect(env.PORT).toBe(8787);
    expect(env.SURREAL_URL).toBe("surrealkv://./data/clinix");
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it("treats empty .env lines as unset instead of empty strings", () => {
    const env = parseEnv({ ANTHROPIC_API_KEY: "", CLERK_SECRET_KEY: "" });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.CLERK_SECRET_KEY).toBeUndefined();
  });

  it("coerces PORT to a number and keeps provided keys", () => {
    const env = parseEnv({ PORT: "9000", APIFY_TOKEN: "abc" });
    expect(env.PORT).toBe(9000);
    expect(env.APIFY_TOKEN).toBe("abc");
  });

  it("rejects a non-numeric PORT", () => {
    expect(() => parseEnv({ PORT: "eighty" })).toThrow();
  });
});
