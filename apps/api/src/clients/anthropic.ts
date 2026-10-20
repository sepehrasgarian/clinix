import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { env } from "../env.js";

/**
 * Three model tiers, each a setting so cost and quality can be tuned without a code change:
 * strong for the judged output (review mining, the plan), fast for mid-weight work, light for
 * bulk extraction and ranking. Every system prompt is marked cacheable, so a discipline guide
 * sent once per business in a run is billed at a tenth of the price after the first use.
 */
export type ModelTier = "strong" | "fast" | "light";

export const DEFAULT_MODELS: Record<ModelTier, string> = {
  strong: "claude-opus-5-5",
  fast: "claude-sonnet-5-5",
  light: "claude-haiku-5-5",
};

export function modelsFromEnv(e: { MODEL_STRONG?: string; MODEL_FAST?: string; MODEL_LIGHT?: string } = env): Record<ModelTier, string> {
  return { strong: e.MODEL_STRONG ?? DEFAULT_MODELS.strong, fast: e.MODEL_FAST ?? DEFAULT_MODELS.fast, light: e.MODEL_LIGHT ?? DEFAULT_MODELS.light };
}

/** The surface the pipeline needs. Tests provide a fake; production uses AnthropicClient. */
export interface AiClient {
  /** Reads the given URLs with the web fetch tool and answers the question as text. */
  readWeb(input: { urls: string[]; system: string; question: string; tier?: ModelTier }): Promise<string>;
  /** Returns a value matching `schema`, extracted from the prompt. */
  structured<T extends z.ZodType>(input: { schema: T; system: string; user: string; tier?: ModelTier }): Promise<z.infer<T>>;
}

const EFFORT: Record<ModelTier, "low" | "medium" | "high"> = { strong: "high", fast: "low", light: "low" };

export class AnthropicClient implements AiClient {
  private readonly client: Anthropic;
  private readonly models: Record<ModelTier, string>;

  constructor(apiKey?: string, options: { client?: Anthropic; models?: Record<ModelTier, string> } = {}) {
    this.client = options.client ?? (apiKey ? new Anthropic({ apiKey }) : new Anthropic());
    this.models = options.models ?? modelsFromEnv();
  }

  private system(text: string): Anthropic.TextBlockParam[] {
    return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
  }

  async readWeb({ urls, system, question, tier = "light" }: Parameters<AiClient["readWeb"]>[0]): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: `${question}\n\nPages to read:\n${urls.map((u) => `- ${u}`).join("\n")}` },
    ];
    for (let attempt = 0; attempt < 4; attempt++) {
      const message = await this.client.messages
        .stream({
          model: this.models[tier],
          max_tokens: 16000,
          output_config: { effort: EFFORT[tier] },
          system: this.system(system),
          tools: [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: 8 }],
          messages,
        })
        .finalMessage();
      if (message.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: message.content });
        continue;
      }
      if (message.stop_reason === "refusal") throw new Error("The model declined to read this website.");
      return message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    }
    throw new Error("Reading the website did not finish.");
  }

  async structured<T extends z.ZodType>({ schema, system, user, tier = "light" }: { schema: T; system: string; user: string; tier?: ModelTier }): Promise<z.infer<T>> {
    const response = await this.client.messages.parse({
      model: this.models[tier],
      max_tokens: 16000,
      output_config: { effort: EFFORT[tier], format: zodOutputFormat(schema) },
      system: this.system(system),
      messages: [{ role: "user", content: user }],
    });
    if (response.stop_reason === "refusal") throw new Error("The model declined this request.");
    if (!response.parsed_output) throw new Error("The model returned output that did not match the expected shape.");
    return response.parsed_output;
  }
}
