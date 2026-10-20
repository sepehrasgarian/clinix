import clsx from "clsx";
import { DISCIPLINE_LABELS, type Discipline } from "@clinix/contracts";
import { Sticker } from "@/components/onboarding/Sticker";

/** The discipline sticker with its label. Same look everywhere. */
export function DisciplineBadge({ discipline, size = "sm", className }: { discipline: Discipline; size?: "sm" | "md"; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full border border-line bg-card pr-2.5 font-medium", size === "sm" ? "py-0.5 pl-0.5 text-xs" : "py-1 pl-1 text-sm", className)}>
      <Sticker discipline={discipline} size={size === "sm" ? 20 : 26} tilt={false} className="rounded-lg border-2" />
      {DISCIPLINE_LABELS[discipline]}
    </span>
  );
}
