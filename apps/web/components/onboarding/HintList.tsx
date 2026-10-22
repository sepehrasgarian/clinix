import clsx from "clsx";
import { BarChart3, Globe, MessageSquare, Sparkles, Star, Trophy, Users } from "lucide-react";
import type { ScanHint } from "@clinix/contracts";

const kinds = {
  review_gap: { Icon: MessageSquare, tone: "problem" },
  rating_gap: { Icon: Star, tone: "problem" },
  no_website: { Icon: Globe, tone: "problem" },
  rating_strength: { Icon: Trophy, tone: "strength" },
  crowded_market: { Icon: Users, tone: "context" },
} as const;

const tones = {
  problem: { tile: "bg-[#fff1e6] text-[#d9622b]", prefix: "To improve: " },
  strength: { tile: "bg-[#e3f7ee] text-[#0f7a50]", prefix: "Strength: " },
  context: { tile: "bg-[#eeefff] text-primary", prefix: "" },
} as const;

/**
 * "What stands out": the measured facts the scan found, tinted by whether each is something to improve, a strength or context,
 * then always a dashed row for the full action plan. It never claims what the full report will find.
 */
export function HintList({ hints }: { hints: ScanHint[] }) {
  return (
    <section className="rounded-[24px] border border-[#ecedf5] bg-white p-[24px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" aria-labelledby="stands-out">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="stands-out" className="text-[18px] font-bold">What stands out for your clinic</h2>
          <p className="mt-1 text-[13.5px] text-ink-grey">Measured from your Google profile and the clinics closest to you.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eeefff] px-3.5 py-1.5 text-[13px] font-semibold text-primary"><BarChart3 size={13} aria-hidden />Full report after your plan</span>
      </div>
      <ul className="mt-5 flex flex-col gap-[10px]">
        {hints.map((h) => {
          const { Icon, tone } = kinds[h.kind];
          return (
            <li key={h.kind} className="flex gap-4 rounded-2xl border border-[#ecedf5] p-[16px]">
              <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone].tile)}><Icon size={18} aria-hidden /></span>
              <div>
                <p className="text-[14.5px] leading-snug font-semibold"><span className="sr-only">{tones[tone].prefix}</span>{h.text}</p>
                {h.why && <p className="mt-1 text-[13px] leading-snug text-ink-grey">{h.why}</p>}
              </div>
            </li>
          );
        })}
        <li className="flex gap-4 rounded-2xl border border-dashed border-[#d9dcf5] bg-[#fafaff] p-[16px]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eeefff] text-primary"><Sparkles size={18} aria-hidden /></span>
          <div>
            <p className="text-[14.5px] font-semibold">Your full action plan</p>
            <p className="mt-1 text-[13px] leading-snug text-ink-grey">Your report reads every nearby competitor&apos;s reviews and website, then ranks what to fix first.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
