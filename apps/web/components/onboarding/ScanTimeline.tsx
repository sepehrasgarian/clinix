import clsx from "clsx";
import { Check, X } from "lucide-react";
import { PHASE_LABELS, type PhaseId, type PhaseProgress } from "@clinix/contracts";
import { copy } from "@/lib/copy";

const seconds = (p: PhaseProgress) => {
  if (!p.startedAt || !p.finishedAt) return null;
  const s = Math.round((new Date(p.finishedAt).getTime() - new Date(p.startedAt).getTime()) / 1000);
  return s < 1 ? "<1s" : `${s}s`;
};

/** The steps of this stage: finished ones shrink to a line, the running one opens with what it is doing, the rest wait. */
export function ScanTimeline({ phases, ids }: { phases: PhaseProgress[]; ids: PhaseId[] }) {
  const t = copy.onboarding.scanning;
  const rows = ids.map((id) => phases.find((p) => p.phase === id) ?? { phase: id, status: "pending" as const });
  const finished = rows.filter((p) => p.status === "done" || p.status === "skipped").length;
  return (
    <section className="rounded-[22px] border border-[#ecedf5] bg-white p-[22px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" aria-label="Progress" data-testid="scan-timeline">
      <div className="text-[13px]">
        <span className="font-semibold">{finished} of {rows.length} steps complete</span>
      </div>
      <div className="mt-2.5 flex gap-1.5" aria-hidden>
        {rows.map((p) => <span key={p.phase} className={clsx("h-1.5 flex-1 rounded-full", p.status === "done" || p.status === "skipped" ? "bg-primary" : p.status === "running" ? "animate-pulse bg-primary/45" : p.status === "failed" ? "bg-alert" : "bg-[#eceef6]")} />)}
      </div>
      <ol className="mt-5 space-y-1" aria-live="polite">
        {rows.map((p, i) => {
          const status = p.status === "skipped" ? "done" : p.status;
          const lines = p.error ? [p.error] : (t.tasks[p.phase as keyof typeof t.tasks] ?? []);
          return (
            <li key={p.phase} className={clsx("rounded-2xl px-4 py-3", status === "running" && "bg-[#f6f6ff] ring-1 ring-[#e3e4ff]")}>
              <div className="flex items-center gap-3.5">
                <span className={clsx("grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold", status === "done" ? "bg-[#e6f7ee] text-[#16875a]" : status === "failed" ? "bg-alert text-white" : status === "running" ? "bg-primary text-white" : "border border-[#d9dce8] text-faint")} aria-hidden>
                  {status === "done" ? <Check size={14} strokeWidth={3} /> : status === "failed" ? <X size={14} /> : i + 1}
                </span>
                <h3 className={clsx("flex-1 text-[15.5px]", status === "running" || status === "failed" ? "font-bold" : status === "done" ? "font-semibold text-ink-grey" : "font-medium text-faint")}>{PHASE_LABELS[p.phase]}</h3>
                {status === "done" && <span className="text-[12.5px] text-faint tabular-nums">{seconds(p as PhaseProgress) ?? t.statusPill.done}</span>}
                {status === "running" && <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-primary ring-1 ring-[#e3e4ff]">{t.statusPill.running}</span>}
                {status === "failed" && <span className="rounded-full bg-alert-soft px-3 py-1 text-[12px] font-semibold text-alert">{t.statusPill.failed}</span>}
              </div>
              {(status === "running" || status === "failed") && (
                <div className="pl-[42px]">
                  {status === "running" && <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e3e4ff]" role="progressbar" aria-label={PHASE_LABELS[p.phase]}><div className="h-full w-1/3 animate-[scan-slide_1.4s_ease-in-out_infinite] rounded-full bg-primary" /></div>}
                  <ul className="mt-3 space-y-1.5 text-[13.5px] text-ink-grey">{lines.map((line) => <li key={line}>{line}</li>)}</ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
