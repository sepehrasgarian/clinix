import clsx from "clsx";
import { scoreTone } from "@/lib/format";

export function ScoreBar({ score, label, summary }: { score: number; label: string; summary: string }) {
  const tone = scoreTone(score);
  const fill = { success: "bg-success", warning: "bg-warning", alert: "bg-alert", neutral: "bg-faint", primary: "bg-primary" }[tone];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-lg tabular-nums">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={clsx("h-full rounded-full", fill)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-sm text-muted">{summary}</p>
    </div>
  );
}
