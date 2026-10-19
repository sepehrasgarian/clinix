import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Clinic, Competitor, Memory } from "./db.js";

const client = new Anthropic();
const MODEL = "claude-opus-5-5";

// ---------- Step 1: research competitors with web search ----------

const RESEARCH_SYSTEM = `You are Clinix, a competitive-intelligence consultant for small and mid-size medical clinics.
You research the local market around one clinic and write a frank, specific consultation for its owner.

Method:
1. Use web_search to find the real competing clinics of the same type within a few km of the clinic's address. Aim for 5 to 8 competitors. Prefer sources like Google Maps listings, clinic websites, RateMDs, Yelp and provincial directories.
2. For each competitor, look for: services offered, published prices, hours, Google rating and review count, what patients praise and complain about in reviews, and anything distinctive (online booking, direct billing, languages, parking, new-patient promos).
3. Compare them to the owner's clinic honestly. Point out where the owner is behind, not just ahead.
4. Finish with a consultation: market position, concrete opportunities, threats, and a prioritized action plan with 5 to 8 actions. Each action should be something the owner could start this month.

Rules: only report facts you found; mark estimates as estimates. Cite the URL for each competitor. Never invent ratings or prices. Write in plain language for a busy clinic owner, not a marketing deck.`;

function clinicProfile(c: Clinic): string {
  return [
    `Clinic: ${c.name}`,
    `Type: ${c.type}`,
    `Address: ${c.address}, ${c.city}`,
    `Services: ${c.services.join(", ") || "not provided"}`,
    c.prices && Object.keys(c.prices).length
      ? `Prices: ${Object.entries(c.prices).map(([k, v]) => `${k} ${v}`).join("; ")}`
      : "Prices: not provided",
    c.website ? `Website: ${c.website}` : "",
    c.notes ? `Owner notes: ${c.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function researchMarket(clinic: Clinic): Promise<string> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `Research the competitors of this clinic and write the full consultation report in Markdown.\n\n${clinicProfile(clinic)}`,
    },
  ];

  // Manual loop: web search is a server tool, but a long turn can stop with
  // pause_turn and must be resumed by appending the assistant turn.
  for (let i = 0; i < 6; i++) {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: [{ type: "text", text: RESEARCH_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 12,
          user_location: { type: "approximate", city: clinic.city, country: "CA" },
        },
      ],
      messages,
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    if (message.stop_reason === "refusal") {
      throw new Error(`Claude declined this request (${message.stop_details?.category ?? "unknown"}).`);
    }
    if (message.stop_reason === "max_tokens") {
      throw new Error("Report was cut off by max_tokens; retry with a larger limit.");
    }
    return message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }
  throw new Error("Research did not finish after several resumes.");
}

// ---------- Step 2: extract structured data from the report ----------

const CompetitorSchema = z.object({
  name: z.string(),
  address: z.string().nullable(),
  website: z.string().nullable(),
  rating: z.number().nullable(),
  review_count: z.number().nullable(),
  services: z.array(z.string()),
  price_notes: z.string().nullable(),
  hours: z.string().nullable(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  source_urls: z.array(z.string()),
});

const ConsultationSchema = z.object({
  summary: z.string().describe("Two or three sentences a clinic owner can read in 20 seconds"),
  market_position: z.string(),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
  action_plan: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      effort: z.enum(["low", "medium", "high"]),
      impact: z.enum(["low", "medium", "high"]),
    }),
  ),
  competitors: z.array(CompetitorSchema),
});

export type StructuredConsultation = z.infer<typeof ConsultationSchema>;

export async function structureReport(report: string): Promise<StructuredConsultation> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: zodOutputFormat(ConsultationSchema) },
    messages: [
      {
        role: "user",
        content: `Extract the structured data from this clinic consultation report. Keep every competitor mentioned. Use null when a value was not found.\n\n<report>\n${report}\n</report>`,
      },
    ],
  });
  if (!response.parsed_output) throw new Error("Could not parse structured consultation.");
  return response.parsed_output;
}

export async function analyzeClinic(clinic: Clinic) {
  const report = await researchMarket(clinic);
  const data = await structureReport(report);
  return { report, data };
}

// ---------- Follow-up chat with memory ----------

const CHAT_SYSTEM = `You are Clinix, the ongoing consultant for one clinic owner. You already researched their market; the latest findings are below. Answer follow-up questions directly, refer to specific competitors by name, and recommend concrete next steps. If a question needs fresh facts you do not have, say so and suggest re-running the market analysis.`;

export async function chat(
  clinic: Clinic,
  competitors: Competitor[],
  latestReport: string | null,
  history: Memory[],
  question: string,
): Promise<string> {
  const context = [
    clinicProfile(clinic),
    "",
    "## Known competitors",
    ...competitors.map(
      (c) =>
        `- ${c.name}${c.rating != null ? ` (${c.rating}★, ${c.review_count ?? "?"} reviews)` : ""}: ${c.services.join(", ")}. Strengths: ${c.strengths.join("; ")}. Weaknesses: ${c.weaknesses.join("; ")}.`,
    ),
    "",
    latestReport ? `## Latest report\n${latestReport}` : "## Latest report\nNo analysis has been run yet.",
  ].join("\n");

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [
      { type: "text", text: CHAT_SYSTEM },
      { type: "text", text: context, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content }) as Anthropic.Beta.BetaMessageParam),
      { role: "user", content: question },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined this question.");
  return response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
