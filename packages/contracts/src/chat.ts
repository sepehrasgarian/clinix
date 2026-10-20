import { z } from "zod";
import { Id, IsoDate } from "./common";
import { Review } from "./place";

export const ChatMessage = z.object({
  id: Id,
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  citedReviewIds: z.array(Id).default([]),
  createdAt: IsoDate,
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export const ChatRequest = z.object({ message: z.string().min(1).max(4000) });
/** An answer plus the reviews it cites, so the client can show the quotes without another call. */
export const ChatResponse = z.object({ answer: ChatMessage, reviews: z.array(Review).default([]) });
export const ChatHistory = z.object({ messages: z.array(ChatMessage), reviews: z.array(Review).default([]) });
