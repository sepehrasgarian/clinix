import clsx from "clsx";
import { Check, CircleDashed, Loader2, X } from "lucide-react";
import { PHASE_LABELS, type PhaseProgress } from "@clinix/contracts";

/** Real phase states from the API. No fake percentages. */
export function PhaseList({ phases }: { phases: PhaseProgress[] }) {
  return (
    <ol className="space-y-3" aria-live="polite">
      {phases.map((p) => (
        <li key={p.phase} className="flex items-start gap-3">
          <span
            className={clsx(
              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
              p.status === "done" && "bg-success text-white",
              p.status === "running" && "bg-primary text-white",
              p.status === "failed" && "bg-alert text-white",
              (p.status === "pending" || p.status === "skipped") && "border border-line text-faint",
            )}
            aria-label={p.status}
          >
            {p.status === "done" && <Check size={14} aria-hidden />}
            {p.status === "running" && <Loader2 size={14} aria-hidden className="animate-spin" />}
            {p.status === "failed" && <X size={14} aria-hidden />}
            {(p.status === "pending" || p.status === "skipped") && <CircleDashed size={14} aria-hidden />}
          </span>
          <div>
            <p className={clsx("font-medium", p.status === "pending" && "text-muted")}>{PHASE_LABELS[p.phase]}</p>
            {p.error && <p className="text-sm text-alert">{p.error}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
