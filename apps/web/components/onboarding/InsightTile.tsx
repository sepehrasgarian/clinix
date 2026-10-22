import clsx from "clsx";
import { BarChart3, MapPin, Trophy, Users } from "lucide-react";
import type { Insight } from "@/lib/overview";

const looks = {
  trophy: { Icon: Trophy, tile: "bg-[#eeefff] text-primary" },
  users: { Icon: Users, tile: "bg-[#e3f7ee] text-[#0f7a50]" },
  bars: { Icon: BarChart3, tile: "bg-[#fff4e0] text-[#c27a12]" },
  pin: { Icon: MapPin, tile: "bg-[#eeefff] text-primary" },
} as const;

/** One of the three figures under "Key insights": an icon, a label, the measured value and a line saying what it is. */
export function InsightTile({ insight }: { insight: Insight }) {
  const { Icon, tile } = looks[insight.icon];
  const long = insight.value.length > 9;
  return (
    <div className="rounded-[20px] border border-[#ecedf5] bg-white p-[20px] shadow-[0_14px_36px_-30px_rgba(76,70,180,.4)]">
      <div className="flex items-center gap-3">
        <span className={clsx("grid size-12 shrink-0 place-items-center rounded-full", tile)}><Icon size={20} aria-hidden /></span>
        <div className="min-w-0">
          <p className="text-[13px] text-ink-grey">{insight.label}</p>
          <p className={clsx("font-bold tracking-[-0.03em]", long ? "text-[17px] leading-tight" : "text-[26px] leading-tight")}>{insight.value}</p>
        </div>
      </div>
      <p className="mt-3.5 text-[13px] leading-snug text-ink-grey">{insight.note}</p>
    </div>
  );
}
