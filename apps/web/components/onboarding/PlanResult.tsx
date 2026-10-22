import { SlidersHorizontal } from "lucide-react";
import type { Discipline } from "@clinix/contracts";
import { PLANS, neededFeatures, FEATURE_LABELS, type Needs } from "@/lib/planFinder";
import { planOrder, type PlanId } from "@/lib/pricing";
import { PlanCompare } from "./PlanCompare";
import { PlanRecommendation, planName, type Billing } from "./PlanRecommendation";
import { PlanSummary } from "./PlanSummary";

export type { Billing };
const card = "rounded-[22px] border border-[#ecedf5] bg-white p-[24px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]";

/** The recommendation page: what we know, the plan that fits and its price, why, the other plans, and a way back to the answers. */
export function PlanResult({ address, disciplines, needs, recommended, beyond, plan, billing, onChange, onContinue, onAdjust, onEdit }: { address: string; disciplines: Discipline[]; needs: Needs; recommended: PlanId; beyond: boolean; plan: PlanId; billing: Billing; onChange: (next: { plan: PlanId; billing: Billing }) => void; onContinue: () => void; onAdjust: () => void; onEdit: () => void }) {
  const p = PLANS[plan];
  const asked = neededFeatures(needs).map((n) => FEATURE_LABELS[n.feature]);
  const spareLocations = p.locations - needs.locations;
  const spareDisciplines = p.disciplines - needs.disciplines;
  const why = [
    { title: "Supports your current setup", text: `Covers your ${needs.locations} location${needs.locations === 1 ? "" : "s"} and ${needs.disciplines} discipline${needs.disciplines === 1 ? "" : "s"}, with competitors compared discipline by discipline.` },
    { title: "Includes your requested capabilities", text: asked.length ? `${asked.join(", ")} ${asked.length === 1 ? "is" : "are"} included, because of what you asked for.` : "What you asked for is in every plan, so we recommend the least expensive one." },
    { title: "Room to grow", text: spareLocations > 0 || spareDisciplines > 0 ? `You can add up to ${spareLocations} more location${spareLocations === 1 ? "" : "s"} and ${spareDisciplines} more discipline${spareDisciplines === 1 ? "" : "s"} on this plan.` : plan === "scale" ? "You are using this plan's full capacity. Beyond it, write to support@clinx.app and we'll set it up with you." : `You are using this plan's full capacity. ${planName(planOrder[planOrder.indexOf(plan) + 1])} covers more.` },
  ];
  return (
    <div className="flex flex-col gap-5">
      <PlanSummary address={address} locations={needs.locations} disciplines={disciplines} goals={needs.goals} onEdit={onEdit} />
      <PlanRecommendation needs={needs} plan={plan} recommended={recommended} billing={billing} onBilling={(b) => onChange({ plan, billing: b })} onUseRecommended={() => onChange({ plan: recommended, billing })} onContinue={onContinue} />
      {beyond && <p role="status" className="rounded-2xl bg-[#fff7e6] px-5 py-3.5 text-[13.5px] text-[#8a5a00]">Your setup is larger than any plan covers ({PLANS.scale.locations} locations, {PLANS.scale.disciplines} disciplines). Scale is the closest; write to support@clinx.app and we&apos;ll set up the rest with you.</p>}
      <section className={card} aria-labelledby="why-title">
        <h2 id="why-title" className="text-[17px] font-bold">Why this plan fits your clinic</h2>
        <ol className="mt-4 grid gap-5 md:grid-cols-3">
          {why.map((w, i) => (
            <li key={w.title} className="flex gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eeefff] text-[13px] font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
              <div><h3 className="text-[14px] font-bold">{w.title}</h3><p className="mt-1 text-[13px] leading-relaxed text-ink-grey">{w.text}</p></div>
            </li>
          ))}
        </ol>
      </section>
      <PlanCompare needs={needs} plan={plan} recommended={recommended} billing={billing} onSelect={(id) => onChange({ plan: id, billing })} />
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#ecedf5] bg-white/70 p-[20px]">
        <div className="flex items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#eeefff] text-primary" aria-hidden><SlidersHorizontal size={18} /></span>
          <div><h2 className="text-[15px] font-bold">Need a different plan?</h2><p className="text-[13px] text-ink-grey">Adjust your needs, locations, or disciplines to see an updated recommendation.</p></div>
        </div>
        <button type="button" onClick={onAdjust} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#eeefff] px-5 text-[13.5px] font-semibold text-primary hover:bg-[#e4e5ff]"><SlidersHorizontal size={14} aria-hidden />Adjust my needs</button>
      </section>
    </div>
  );
}
