import { createElement } from "react";
import clsx from "clsx";
import { DISCIPLINE_LABELS, type Discipline } from "@clinix/contracts";
import { disciplineIcon, stickerColor } from "@/lib/disciplines";

/** A discipline "sticker": a tilted pastel tile with a white border and the discipline's icon. */
export function Sticker({ discipline, size = 44, tilt = true, className }: { discipline: Discipline; size?: number; tilt?: boolean; className?: string }) {
  const i = discipline.length % 3;
  const rotate = tilt ? ["-rotate-3", "rotate-2", "rotate-1"][i] : "";
  return (
    <span
      aria-hidden
      className={clsx("grid shrink-0 place-items-center rounded-2xl border-[3px] border-white text-ink shadow-[0_4px_12px_-4px_rgba(14,21,38,.35)]", rotate, className)}
      style={{ width: size, height: size, background: stickerColor(discipline) }}
      title={DISCIPLINE_LABELS[discipline]}
    >
      {createElement(disciplineIcon(discipline), { size: Math.round(size * 0.5) })}
    </span>
  );
}
