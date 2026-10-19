import type { Finding, Review, ReviewCitation } from "@clinix/contracts";

export const MIN_DISTINCT_REVIEWS = 2;

/** Lower-case, collapse whitespace, strip punctuation and curly quotes so a near-verbatim quote still matches. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the quote appears in the review text, allowing for punctuation and spacing differences. */
export function quoteAppearsIn(quote: string, reviewText: string): boolean {
  const q = normalize(quote);
  return q.length >= 8 && normalize(reviewText).includes(q);
}

export type ProposedFinding = Omit<Finding, "status" | "rejectionReason">;

/**
 * The evidence rule, enforced in code rather than by prompt:
 * every citation must quote a stored review verbatim, and a finding needs quotes from at
 * least two distinct reviews. Findings that fail are kept in the report as "rejected" with
 * the reason, so the owner (and the judge) can see what was thrown out.
 */
export function validateFinding(finding: ProposedFinding, reviewsById: Map<string, Review>): Finding {
  const valid: ReviewCitation[] = [];
  let quoteNotFound = false;
  for (const c of finding.evidence) {
    const review = reviewsById.get(c.reviewId);
    if (!review || !quoteAppearsIn(c.quote, review.text)) {
      quoteNotFound = true;
      continue;
    }
    valid.push({ reviewId: c.reviewId, quote: exactSlice(c.quote, review.text) });
  }
  const distinct = new Set(valid.map((c) => c.reviewId)).size;
  if (distinct >= MIN_DISTINCT_REVIEWS) return { ...finding, evidence: valid, status: "kept" };
  return {
    ...finding,
    evidence: finding.evidence,
    status: "rejected",
    rejectionReason: quoteNotFound && valid.length === 0 ? "quote_not_found" : "too_few_reviews",
  };
}

/** Returns the review's own spelling of the quoted passage, so the UI can highlight it exactly. */
function exactSlice(quote: string, reviewText: string): string {
  const idx = reviewText.toLowerCase().indexOf(quote.toLowerCase());
  if (idx >= 0) return reviewText.slice(idx, idx + quote.length);
  return quote;
}

/** Marks later findings that repeat an earlier claim (same normalized text, same subject) as duplicates. */
export function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.map((f) => {
    const key = `${f.competitorPlaceId ?? "own"}|${normalize(f.claim)}`;
    if (seen.has(key)) return f.status === "kept" ? { ...f, status: "rejected", rejectionReason: "duplicate" } : f;
    seen.add(key);
    return f;
  });
}

export function ledgerFor(findings: Finding[]) {
  const rejected = findings.filter((f) => f.status === "rejected");
  const counts = new Map<string, number>();
  for (const f of rejected) counts.set(f.rejectionReason ?? "other", (counts.get(f.rejectionReason ?? "other") ?? 0) + 1);
  return {
    proposed: findings.length,
    kept: findings.length - rejected.length,
    rejected: rejected.length,
    rejectedReasons: [...counts.entries()].map(([reason, count]) => ({ reason, count })),
  };
}
