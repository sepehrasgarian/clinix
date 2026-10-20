import { ChatMessage } from "@clinix/contracts";
import { getDb } from "./connection.js";
import { rid, toPlain } from "./records.js";
import { newId, nowIso } from "../lib/ids.js";

export const HISTORY_TURNS = 12;

/** Chat history per clinic: what the owner asked and what was answered, with the cited review ids. */
export async function appendMessage(clinicId: string, message: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage> {
  const db = await getDb();
  // `seq` keeps order stable when two messages land in the same millisecond (a question and its answer).
  const row = await db.create(rid("memory", newId("msg"))).content({ clinicId, ...message, createdAt: nowIso(), seq: Number(process.hrtime.bigint() / 1000n) });
  const { clinicId: _c, seq: _s, ...rest } = toPlain<Record<string, unknown>>(row);
  return ChatMessage.parse(rest);
}

export async function recentMessages(clinicId: string, limit = HISTORY_TURNS): Promise<ChatMessage[]> {
  const db = await getDb();
  const [rows] = await db.query<[unknown[]]>("SELECT * FROM memory WHERE clinicId = $clinicId ORDER BY seq DESC LIMIT $limit", { clinicId, limit });
  return rows
    .map((r) => {
      const { clinicId: _c, seq: _s, ...rest } = toPlain<Record<string, unknown>>(r);
      return ChatMessage.parse(rest);
    })
    .reverse();
}
