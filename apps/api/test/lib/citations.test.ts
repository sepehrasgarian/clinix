import { describe, expect, it } from "vitest";
import type { Finding, Review } from "@clinix/contracts";
import { dedupeFindings, ledgerFor, normalize, quoteAppearsIn, validateFinding, type ProposedFinding } from "../../src/lib/citations.js";

const r = (id: string, text: string): Review => ({ id, placeId: "p", rating: 4, text, publishedAt: "2026-09-01T00:00:00.000Z", source: "apify" });
const reviews = new Map([
  r("a", "Booked online at 11pm and got a next-day appointment. Open Saturdays which is huge for me."),
  r("b", "They sent a text reminder and I was seen on time. Very modern office!"),
  r("c", "Felt rushed and upsold on whitening I did not ask for."),
].map((x) => [x.id, x]));

const base: ProposedFinding = { id: "f1", discipline: "dentistry", competitorPlaceId: "p", kind: "strength", claim: "Online booking and Saturday hours", whyItMatters: "x", confidence: "likely", evidence: [] };

describe("quoteAppearsIn", () => {
  it("tolerates punctuation, case and spacing differences but not paraphrase", () => {
    expect(quoteAppearsIn("open saturdays, which is huge", reviews.get("a")!.text)).toBe(true);
    expect(quoteAppearsIn("Very modern office", reviews.get("b")!.text)).toBe(true);
    expect(quoteAppearsIn("they have weekend hours", reviews.get("a")!.text)).toBe(false);
    expect(quoteAppearsIn("on time", reviews.get("b")!.text)).toBe(false); // too short to count
  });
  it("normalizes curly quotes", () => {
    expect(normalize("Didn’t feel a thing")).toBe("didn't feel a thing");
  });
});

describe("validateFinding", () => {
  it("keeps a finding with verbatim quotes from two distinct reviews and returns the review's exact spelling", () => {
    const out = validateFinding({ ...base, evidence: [{ reviewId: "a", quote: "open saturdays" }, { reviewId: "b", quote: "seen on time" }] }, reviews);
    expect(out.status).toBe("kept");
    expect(out.evidence[0].quote).toBe("Open Saturdays");
  });
  it("rejects a hallucinated quote as quote_not_found", () => {
    const out = validateFinding({ ...base, evidence: [{ reviewId: "a", quote: "there is never any parking" }, { reviewId: "zzz", quote: "whatever this is" }] }, reviews);
    expect(out).toMatchObject({ status: "rejected", rejectionReason: "quote_not_found" });
  });
  it("rejects a finding supported by only one review, and drops the bad citation while keeping the good one", () => {
    const out = validateFinding({ ...base, evidence: [{ reviewId: "a", quote: "Open Saturdays" }, { reviewId: "a", quote: "next-day appointment" }] }, reviews);
    expect(out).toMatchObject({ status: "rejected", rejectionReason: "too_few_reviews" });
    const mixed = validateFinding({ ...base, evidence: [{ reviewId: "a", quote: "Open Saturdays" }, { reviewId: "b", quote: "not in this review at all" }] }, reviews);
    expect(mixed).toMatchObject({ status: "rejected", rejectionReason: "too_few_reviews" });
  });
});

describe("dedupeFindings and ledgerFor", () => {
  const kept = (id: string, claim: string, who: string | null = "p"): Finding => ({ ...base, id, claim, competitorPlaceId: who, status: "kept" });
  it("marks a repeated claim about the same business as a duplicate, but not the same claim about another business", () => {
    const out = dedupeFindings([kept("1", "Online booking."), kept("2", "online booking"), kept("3", "Online booking.", null)]);
    expect(out.map((f) => f.status)).toEqual(["kept", "rejected", "kept"]);
    expect(out[1].rejectionReason).toBe("duplicate");
  });
  it("counts the ledger by reason", () => {
    const out = dedupeFindings([kept("1", "A"), kept("2", "a"), { ...kept("3", "B"), status: "rejected", rejectionReason: "quote_not_found" }]);
    expect(ledgerFor(out)).toEqual({ proposed: 3, kept: 1, rejected: 2, rejectedReasons: expect.arrayContaining([{ reason: "duplicate", count: 1 }, { reason: "quote_not_found", count: 1 }]) });
  });
});
