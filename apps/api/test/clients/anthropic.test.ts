import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { AnthropicClient, DEFAULT_MODELS, modelsFromEnv } from "../../src/clients/anthropic.js";

describe("modelsFromEnv", () => {
  it("uses the defaults and lets each tier be overridden", () => {
    expect(modelsFromEnv({})).toEqual(DEFAULT_MODELS);
    expect(modelsFromEnv({ MODEL_LIGHT: "claude-sonnet-5-5" }).light).toBe("claude-sonnet-5-5");
    expect(modelsFromEnv({ MODEL_LIGHT: "claude-sonnet-5-5" }).strong).toBe("claude-opus-5-5");
  });
});

describe("AnthropicClient.structured", () => {
  const parse = vi.fn(async () => ({ stop_reason: "end_turn", parsed_output: { ok: true } }));
  const fake = { messages: { parse } } as unknown as Anthropic;
  const client = new AnthropicClient(undefined, { client: fake, models: DEFAULT_MODELS });

  it("picks the model by tier, marks the system prompt cacheable, and returns the parsed output", async () => {
    const out = await client.structured({ schema: z.object({ ok: z.boolean() }), system: "GUIDE", user: "reviews", tier: "light" });
    expect(out).toEqual({ ok: true });
    const params = parse.mock.calls[0][0] as unknown as { model: string; system: { text: string; cache_control?: { type: string } }[]; output_config: { effort: string } };
    expect(params.model).toBe("claude-haiku-5-5");
    expect(params.system[0]).toMatchObject({ text: "GUIDE", cache_control: { type: "ephemeral" } });
    expect(params.output_config.effort).toBe("low");
  });

  it("uses the strong model with high effort by default for mining-grade calls", async () => {
    await client.structured({ schema: z.object({ ok: z.boolean() }), system: "GUIDE", user: "reviews", tier: "strong" });
    const params = parse.mock.calls.at(-1)![0] as unknown as { model: string; output_config: { effort: string } };
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.output_config.effort).toBe("high");
  });

  it("surfaces a refusal and an unparsable answer as errors", async () => {
    parse.mockResolvedValueOnce({ stop_reason: "refusal", parsed_output: null });
    await expect(client.structured({ schema: z.object({}), system: "s", user: "u" })).rejects.toThrow(/declined/);
    parse.mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: null });
    await expect(client.structured({ schema: z.object({}), system: "s", user: "u" })).rejects.toThrow(/expected shape/);
  });
});
