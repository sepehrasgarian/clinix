import clsx from "clsx";
import { Check } from "lucide-react";

export type PlanStep = "setup" | "goals" | "details" | "result";
const LABELS: Record<PlanStep, string> = { setup: "Your setup", goals: "Your goals", details: "A few details", result: "Recommendation" };

/** Where the owner is in the plan questions: finished steps tick, the current one is dark, the rest wait. */
export function PlanSteps({ steps, current, onGo }: { steps: PlanStep[]; current: PlanStep; onGo: (s: PlanStep) => void }) {
  const at = steps.indexOf(current);
  return (
    <ol className="mb-5 flex flex-wrap items-center gap-y-2" aria-label="Plan questions">
      {steps.map((s, i) => {
        const done = i < at;
        const on = s === current;
        return (
          <li key={s} className="flex items-center" aria-current={on ? "step" : undefined}>
            {i > 0 && <span aria-hidden className="mx-2 h-px w-6 bg-[#dfe2ee]" />}
            <button type="button" disabled={!done} onClick={() => onGo(s)} className={clsx("inline-flex h-[36px] items-center gap-2 rounded-full px-[14px] text-[13.5px] font-semibold", on ? "bg-[#161a3a] text-white" : done ? "bg-[#eeefff] text-primary hover:bg-[#e4e5ff]" : "bg-[#f0f1f7] text-ink-grey")}>
              <span className={clsx("grid size-[20px] place-items-center rounded-full text-[11.5px]", on ? "bg-white/15" : done ? "bg-primary text-white" : "bg-white")}>
                {done ? <Check size={12} strokeWidth={3} aria-label="done" /> : i + 1}
              </span>
              {LABELS[s]}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
