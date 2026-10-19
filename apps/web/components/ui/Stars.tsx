import { Star } from "lucide-react";
import { copy } from "@/lib/copy";

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} ${copy.common.stars}`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} aria-hidden className={i < Math.round(rating) ? "fill-warning text-warning" : "text-line"} />
      ))}
    </span>
  );
}
