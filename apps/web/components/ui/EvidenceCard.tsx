import type { Review } from "@clinix/contracts";
import { Quote } from "lucide-react";
import { Stars } from "./Stars";
import { formatDate } from "@/lib/format";

/**
 * One cited review. The quote is the sentence the finding relies on; the rest of the review is
 * shown dimmer for context. Reviewer identity is never part of the data.
 */
export function EvidenceCard({ review, quote, sourceName }: { review: Review; quote: string; sourceName: string }) {
  const idx = review.text.indexOf(quote);
  const before = idx >= 0 ? review.text.slice(0, idx) : "";
  const after = idx >= 0 ? review.text.slice(idx + quote.length) : "";
  return (
    <figure className="rounded-xl border border-line bg-surface/60 p-4" data-testid="evidence-card">
      <blockquote className="text-[15px] leading-relaxed">
        <Quote aria-hidden size={14} className="mb-1 inline text-faint" />{" "}
        {idx >= 0 ? (
          <>
            <span className="text-muted">{before}</span>
            <mark className="rounded bg-primary-soft px-0.5 text-ink">{quote}</mark>
            <span className="text-muted">{after}</span>
          </>
        ) : (
          <span className="text-ink">{quote}</span>
        )}
      </blockquote>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <Stars rating={review.rating} size={12} />
        <span>{formatDate(review.publishedAt)}</span>
        <span className="font-medium text-ink">{sourceName}</span>
      </figcaption>
    </figure>
  );
}
