import { z } from "zod";
import { Id, IsoDate } from "./common.js";

export const ChatMessage = z.object({
  id: Id,
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  citedReviewIds: z.array(Id).default([]),
  createdAt: IsoDate,
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export const ChatRequest = z.object({ message: z.string().min(1).max(4000) });
export const ChatResponse = z.object({ answer: ChatMessage });
