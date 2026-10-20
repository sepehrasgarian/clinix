import type { ChatMessage } from "@clinix/contracts";
import type { AiClient } from "../clients/anthropic.js";
import { chatSystem } from "../prompts/chat.js";
import { CHAT_TOOLS, runTool, type ChatContext } from "./tools.js";

export const MAX_TOOL_CALLS = 10;

export type ChatTurn = Pick<ChatMessage, "role" | "content">;

/** One answer: the model reads the reports through tools and finishes with `answer`. */
export async function answerQuestion(ai: AiClient, ctx: ChatContext, history: ChatTurn[], question: string): Promise<{ text: string; citedReviewIds: string[] }> {
  const result = await ai.runTools({
    system: chatSystem(),
    history,
    question,
    tools: CHAT_TOOLS,
    maxCalls: MAX_TOOL_CALLS,
    run: (name, input) => runTool(name, input, ctx),
    tier: "strong",
  });
  const cited = [...new Set(result.citedReviewIds)].filter((id) => ctx.reports[0]?.report?.reviews.some((r) => r.id === id));
  return { text: result.text.trim(), citedReviewIds: cited };
}
