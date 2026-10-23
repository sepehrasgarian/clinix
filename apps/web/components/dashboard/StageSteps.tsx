import clsx from "clsx";
import { Check, Loader2, X } from "lucide-react";
import type { StageRow } from "@/lib/dashboard";

const label = { done: "Completed", running: "In progress", failed: "Stopped", pending: "Pending" } as const;

/** The four analysis stages exactly as the run reports them: done, running, stopped or still pending. */
export function StageSteps({ rows }: { rows: StageRow[] }) {
  return (
    <ol className="grid gap-x-6 gap-y-3 sm:grid-cols-2" aria-label="Analysis steps">
      {rows.map((r) => (
        <li key={r.phase} className="flex items-center gap-3 text-[14px]">
          <span
            className={clsx(
              "grid size-6 shrink-0 place-items-center rounded-full",
              r.status === "done" && "bg-[#22a06b] text-white",
              r.status === "running" && "bg-primary text-white",
              r.status === "failed" && "bg-warning text-white",
              r.status === "pending" && "border border-[#d9dce8] bg-white",
            )}
            aria-hidden
          >
            {r.status === "done" && <Check size={13} strokeWidth={3} />}
            {r.status === "running" && <Loader2 size={13} className="animate-spin motion-reduce:animate-none" />}
            {r.status === "failed" && <X size={13} strokeWidth={3} />}
          </span>
          <span className={clsx("min-w-0 flex-1", r.status === "pending" ? "text-muted" : "font-medium", r.status === "running" && "font-semibold")}>{r.title}</span>
          <span className="sr-only">{label[r.status]}</span>
        </li>
      ))}
    </ol>
  );
}
