import { Hono } from "hono";
import { ChatRequest } from "@clinix/contracts";
import { answerQuestion } from "../chat/agent.js";
import { citedReviews } from "../chat/tools.js";
import { listAnalyses } from "../db/analyses.js";
import { getClinic } from "../db/clinics.js";
import { appendMessage, recentMessages } from "../db/memory.js";
import type { AuthVariables } from "../middleware/auth.js";
import type { PipelineDeps } from "../pipeline/deps.js";

/** Ask ClinX: answers from the clinic's own reports, with cited reviews. Needs an account and a finished report. */
export function chatRoutes(deps: PipelineDeps) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const [messages, analyses] = await Promise.all([recentMessages(clinic.id, 50), listAnalyses(clinic.id)]);
      const ctx = { reports: analyses.filter((a) => a.status === "succeeded" && a.report) };
      const ids = messages.flatMap((m) => m.citedReviewIds);
      return c.json({ messages, reviews: citedReviews(ctx, ids) });
    })
    .post("/", async (c) => {
      if (c.get("isGuest")) return c.json({ error: "Create a free account to ask questions about your report.", code: "auth_required" }, 401);
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const body = ChatRequest.safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: "message required (1-4000 characters)" }, 400);
      const reports = (await listAnalyses(clinic.id)).filter((a) => a.status === "succeeded" && a.report);
      if (reports.length === 0) return c.json({ error: "Your first report is not ready yet. Ask again once it is." }, 409);

      const history = (await recentMessages(clinic.id)).map((m) => ({ role: m.role, content: m.content }));
      const ctx = { reports };
      const result = await answerQuestion(deps.ai, ctx, history, body.data.message);
      await appendMessage(clinic.id, { role: "user", content: body.data.message, citedReviewIds: [] });
      const answer = await appendMessage(clinic.id, { role: "assistant", content: result.text, citedReviewIds: result.citedReviewIds });
      return c.json({ answer, reviews: citedReviews(ctx, result.citedReviewIds) });
    });
}
