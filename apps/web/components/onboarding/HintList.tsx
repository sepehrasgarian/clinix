import clsx from "clsx";
import { BarChart3, Globe, MessageSquare, Sparkles, Star, Trophy, Users } from "lucide-react";
import type { HintTone, ScanHint } from "@clinix/contracts";
import { copy, fill } from "@/lib/copy";

const kinds: Record<ScanHint["kind"], { Icon: typeof Star; tone: HintTone }> = {
  review_gap: { Icon: MessageSquare, tone: "problem" },
  rating_gap: { Icon: Star, tone: "problem" },
  no_website: { Icon: Globe, tone: "problem" },
  rating_strength: { Icon: Trophy, tone: "strength" },
  crowded_market: { Icon: Users, tone: "context" },
};

const tones: Record<HintTone, { tile: string; dot: string }> = {
  problem: { tile: "bg-[#fff1e6] text-[#d9622b]", dot: "bg-[#d9622b]" },
  strength: { tile: "bg-[#e3f7ee] text-[#0f7a50]", dot: "bg-[#0f7a50]" },
  context: { tile: "bg-[#eeefff] text-primary", dot: "bg-primary" },
};

const t = copy.onboarding.hints;
const stars = (v: number) => v.toFixed(1);

/** The headline worded from the hint's numbers; an older scan without numbers keeps the sentence it was saved with. */
export function hintHeadline(h: ScanHint): string {
  if (h.kind === "no_website") return t.headline.no_website;
  if (h.kind === "crowded_market") return h.nearbyCount === undefined ? h.text : fill(t.headline.crowded_market, { count: `${h.nearbyCount}${h.atLeast ? "+" : ""}` });
  if (h.yours === undefined || h.nearby === undefined) return h.text;
  if (h.kind === "review_gap") return fill(t.headline.review_gap, { yours: String(h.yours), nearby: String(h.nearby) });
  return fill(t.headline[h.kind], { yours: stars(h.yours), nearby: stars(h.nearby) });
}

/**
 * "What stands out": the measured facts the scan found, tinted by whether each is something to improve, a strength or context,
 * then always a dashed row for the full action plan. It never claims what the full report will find.
 */
export function HintList({ hints }: { hints: ScanHint[] }) {
  return (
    <section className="rounded-[24px] border border-[#ecedf5] bg-white p-[24px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" aria-labelledby="stands-out">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="stands-out" className="text-[18px] font-bold">{t.title}</h2>
          <p className="mt-1 text-[13.5px] text-ink-grey">{t.intro}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eeefff] px-3.5 py-1.5 text-[13px] font-semibold text-primary"><BarChart3 size={13} aria-hidden />{t.badge}</span>
      </div>
      <ul className="mt-5 flex flex-col gap-[10px]">
        {hints.length === 0 && <li className="text-[14px] text-ink-grey">{t.empty}</li>}
        {hints.map((h) => {
          const { Icon } = kinds[h.kind];
          const tone = h.tone ?? kinds[h.kind].tone;
          const measured = h.kind !== "no_website" && h.nearbyCount !== undefined ? fill(t.measuredOver, { count: String(h.nearbyCount) }) : null;
          return (
            <li key={h.kind} className="flex gap-4 rounded-2xl border border-[#ecedf5] p-[16px]">
              <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone].tile)}><Icon size={18} aria-hidden /></span>
              <div>
                <p className="flex items-center gap-2 text-[14.5px] leading-snug font-semibold">
                  <span aria-hidden className={clsx("inline-block size-2 shrink-0 rounded-full", tones[tone].dot)} />
                  <span className="sr-only">{t.prefix[tone]}</span>
                  {hintHeadline(h)}
                </p>
                {(h.why || measured) && <p className="mt-1 text-[13px] leading-snug text-ink-grey">{[h.why, measured].filter(Boolean).join(" ")}</p>}
              </div>
            </li>
          );
        })}
        <li className="flex gap-4 rounded-2xl border border-dashed border-[#d9dcf5] bg-[#fafaff] p-[16px]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eeefff] text-primary"><Sparkles size={18} aria-hidden /></span>
          <div>
            <p className="text-[14.5px] font-semibold">{t.planTitle}</p>
            <p className="mt-1 text-[13px] leading-snug text-ink-grey">{t.planText}</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
