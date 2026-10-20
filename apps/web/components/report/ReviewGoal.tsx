import { Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { reviewGoal, type Ranked } from "@/lib/report";

/** What it takes to climb the review ranking: up to three rungs, each with the reviews needed and a steady pace. */
export function ReviewGoal({ ranked, area, newClinic = false }: { ranked: Ranked[]; area: string; newClinic?: boolean }) {
  const steps = reviewGoal(ranked);
  const rankLabel = (rank: number) => (rank === 1 ? "first place" : `#${rank}`);
  return (
    <Card className="p-6">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-faint uppercase"><Target size={14} aria-hidden /> Your review goal</p>
      <h3 className="mt-1 font-semibold">{steps.length === 0 ? `You lead ${area} on Google reviews. Here is how to keep it.` : newClinic ? `Build reviews steadily and move up among the clinics in ${area}.` : `What it takes to move up among the clinics in ${area}`}</h3>
      {steps.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Ask every happy patient for a review at checkout and reply to each one. {ranked.length > 1 ? `${ranked.filter((r) => !r.isYou)[0]?.name} is the closest behind you.` : ""}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <li key={s.passName} className="flex items-start gap-3 rounded-xl border border-line bg-surface/60 p-3 text-sm">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft font-mono text-xs font-semibold text-primary">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Reach {rankLabel(s.rank)} by passing {s.passName}</span>
                <span className="block text-muted">{s.reviewsNeeded.toLocaleString("en-CA")} reviews · about {s.perMonth} a month for {s.months} {s.months === 1 ? "month" : "months"}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      {newClinic && <p className="mt-3 text-xs text-muted">Your clinic is new, so a steady pace matters more than the total. Every review you earn now compounds.</p>}
    </Card>
  );
}
