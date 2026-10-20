import type { Analysis, Report, Review } from "@clinix/contracts";

/**
 * What the chat can read: the clinic's own reports, nothing else. Each tool is a JSON schema the
 * model sees and a function that runs over the stored data. Reviews are quoted, never fetched live.
 */
export type ToolDef = { name: string; description: string; input_schema: Record<string, unknown>; strict: true };

export const CHAT_TOOLS: ToolDef[] = [
  {
    name: "list_reports",
    description: "The clinic's reports, newest first: when each was made, its summary, and how many findings and actions it holds.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_findings",
    description: "Findings from the latest report, with their evidence quotes and review ids. Filter by competitor name, kind, or whether the finding is about the owner's own clinic.",
    input_schema: {
      type: "object",
      properties: {
        competitor: { type: ["string", "null"], description: "Part of a competitor's name, or null for all" },
        kind: { type: ["string", "null"], description: "One of strength, weakness, unmet_demand, switching_reason, admin_friction, access; or null for all" },
        aboutOwnClinic: { type: ["boolean", "null"], description: "true for findings about the owner's clinic only" },
      },
      required: ["competitor", "kind", "aboutOwnClinic"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_reviews",
    description: "Full text of reviews by id (ids come from findings), with rating, date and which business they are about.",
    input_schema: { type: "object", properties: { reviewIds: { type: "array", items: { type: "string" } } }, required: ["reviewIds"], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_scorecard",
    description: "The latest scorecard: each measured dimension with its score and a one-line summary.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_action_plan",
    description: "The latest action plan in ranked order, with each action's status and the findings it rests on.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_discipline_sections",
    description: "The latest report's section for each discipline the clinic offers: local leader, patient demand, what holds the clinic back, and that discipline's actions.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "compare_latest_two",
    description: "What changed between the latest report and the one before it. Empty when there is only one report.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "answer",
    description: "Finish: the final answer for the owner and the ids of the reviews it relies on.",
    input_schema: { type: "object", properties: { text: { type: "string" }, citedReviewIds: { type: "array", items: { type: "string" } } }, required: ["text", "citedReviewIds"], additionalProperties: false },
    strict: true,
  },
];

export type ChatContext = { reports: Analysis[] };

const competitorName = (report: Report, id: string | null) => (id === null ? "the owner's clinic" : report.competitors.find((c) => c.placeId === id)?.name ?? "a competitor");

/** Runs one tool over the clinic's reports. Returns a compact, JSON-serialisable result. */
export function runTool(name: string, input: Record<string, unknown>, ctx: ChatContext): unknown {
  const latest = ctx.reports[0]?.report;
  if (!latest) return { error: "No finished report yet." };
  switch (name) {
    case "list_reports":
      return ctx.reports.map((a) => ({ reportId: a.id, generatedAt: a.report!.generatedAt, summary: a.report!.summary, findings: a.report!.ledger.kept, actions: a.report!.recommendations.length, thin: a.report!.thinReport }));
    case "get_findings": {
      const q = typeof input.competitor === "string" ? input.competitor.toLowerCase() : null;
      const KINDS = new Set(["strength", "weakness", "unmet_demand", "switching_reason", "admin_friction", "access"]);
      const kind = typeof input.kind === "string" && KINDS.has(input.kind) ? input.kind : null;
      const own = input.aboutOwnClinic === true;
      return latest.findings
        .filter((f) => f.status === "kept")
        .filter((f) => (own ? f.competitorPlaceId === null : true))
        .filter((f) => (kind ? f.kind === kind : true))
        .filter((f) => (q ? competitorName(latest, f.competitorPlaceId).toLowerCase().includes(q) : true))
        .map((f) => ({ id: f.id, about: competitorName(latest, f.competitorPlaceId), kind: f.kind, confidence: f.confidence, claim: f.claim, whyItMatters: f.whyItMatters, evidence: f.evidence }));
    }
    case "get_reviews": {
      const ids = new Set(Array.isArray(input.reviewIds) ? (input.reviewIds as string[]).slice(0, 12) : []);
      const placeName = (r: Review) => (r.placeId === latest.competitors.find((c) => c.placeId === r.placeId)?.placeId ? competitorName(latest, r.placeId) : "the owner's clinic");
      return latest.reviews.filter((r) => ids.has(r.id)).map((r) => ({ id: r.id, about: placeName(r), rating: r.rating, date: r.publishedAt.slice(0, 10), text: r.text, ownerReply: r.ownerReply ?? null }));
    }
    case "get_scorecard":
      return { overall: latest.scorecard.overall, summary: latest.scorecard.summary, dimensions: latest.scorecard.dimensions };
    case "get_action_plan":
      return latest.recommendations.map((r, i) => ({ rank: i + 1, id: r.id, title: r.title, status: r.status, horizon: r.horizon, impact: r.impact, effort: r.effort, firstStep: r.firstStep, findingIds: r.findingIds }));
    case "get_discipline_sections":
      return latest.disciplines.map((d) => ({ discipline: d.discipline, summary: d.summary, leader: d.leader ?? null, patientDemand: d.patientDemand, statements: d.statements, actions: d.recommendations.map((r) => ({ id: r.id, title: r.title, status: r.status, findingIds: r.findingIds })) }));
    case "compare_latest_two":
      return latest.diff ?? { note: "Only one report so far. The next analysis will compare against it." };
    default:
      return { error: `Unknown tool ${name}` };
  }
}

/** The reviews an answer cites, taken from the latest report, so the client can render them. */
export function citedReviews(ctx: ChatContext, ids: string[]): Review[] {
  const set = new Set(ids);
  return ctx.reports[0]?.report?.reviews.filter((r) => set.has(r.id)) ?? [];
}
