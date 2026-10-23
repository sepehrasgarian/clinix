import clsx from "clsx";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Info, MessageSquareText, Sparkles, Star } from "lucide-react";
import type { Kpi } from "@/lib/dashboard";
import { panel } from "./panel";

const icons = { position: BarChart3, rating: Star, reviews: MessageSquareText, opportunities: Sparkles };
const arrows = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight };
const trendTone = { up: "bg-[#e6f7ee] text-[#16845d]", down: "bg-[#fdecec] text-[#c83d47]", flat: "bg-[#f1f2f7] text-muted" };

/** Only figures the report supports, each with its comparison. A trend shows only when the report carries a real previous analysis. */
export function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-4" aria-label="Key figures">
      {items.map(({ key, label, value, note, trend, info }) => {
        const Icon = icons[key];
        const Arrow = trend ? arrows[trend.direction] : null;
        return (
          <li key={key} className={`${panel} flex gap-4 p-6`}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f1f0ff] text-primary" aria-hidden><Icon size={20} strokeWidth={1.5} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#17213a]">
                {label}
                <span title={info} className="inline-flex text-faint"><Info size={14} strokeWidth={1.5} aria-hidden /><span className="sr-only">{info}</span></span>
              </div>
              <p className="mt-3 text-[32px] leading-none font-semibold tracking-tight whitespace-nowrap text-[#111b35] tabular-nums">{value}</p>
              <p className="mt-2 min-h-[2.5rem] text-[13px] leading-snug text-muted">{note}</p>
              {trend && Arrow && <p className={clsx("mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", trendTone[trend.direction])}><Arrow size={13} aria-hidden />{trend.text}</p>}
            </div>
                      </li>
        );
      })}
    </ul>
  );
}
