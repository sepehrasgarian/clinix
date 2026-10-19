import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export const MODELS = {
  /** Synthesis and review mining: the judged output. */
  strong: "claude-opus-5-5",
  /** Extraction, ranking, site reading: bulk steps. */
  fast: "claude-sonnet-5-5",
} as const;

export type ModelTier = keyof typeof MODELS;

/** The surface the pipeline needs. Tests provide a fake; production uses AnthropicClient. */
export interface AiClient {
  /** Reads the given URLs with the web fetch tool and answers the question as text. */
  readWeb(input: { urls: string[]; system: string; question: string; tier?: ModelTier }): Promise<string>;
  /** Returns a value matching `schema`, extracted from the prompt. */
  structured<T extends z.ZodType>(input: { schema: T; system: string; user: string; tier?: ModelTier }): Promise<z.infer<T>>;
}

export class AnthropicClient implements AiClient {
  private readonly client: Anthropic;

  constructor(apiKey?: string) {
    this.client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  }

  async readWeb({ urls, system, question, tier = "fast" }: Parameters<AiClient["readWeb"]>[0]): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: `${question}\n\nPages to read:\n${urls.map((u) => `- ${u}`).join("\n")}` },
    ];
    for (let attempt = 0; attempt < 4; attempt++) {
      const message = await this.client.messages
        .stream({
          model: MODELS[tier],
          max_tokens: 16000,
          output_config: { effort: "low" },
          system,
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

  async structured<T extends z.ZodType>({ schema, system, user, tier = "fast" }: { schema: T; system: string; user: string; tier?: ModelTier }): Promise<z.infer<T>> {
    const response = await this.client.messages.parse({
      model: MODELS[tier],
      max_tokens: 16000,
      output_config: { effort: tier === "strong" ? "high" : "low", format: zodOutputFormat(schema) },
      system,
      messages: [{ role: "user", content: user }],
    });
    if (response.stop_reason === "refusal") throw new Error("The model declined this request.");
    if (!response.parsed_output) throw new Error("The model returned output that did not match the expected shape.");
    return response.parsed_output;
  }
}
