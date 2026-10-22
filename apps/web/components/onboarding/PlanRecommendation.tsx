import clsx from "clsx";
import { BarChart3, Building2, Check, LayoutGrid, Users } from "lucide-react";
import { copy } from "@/lib/copy";
import { FEATURE_LABELS, PLANS, neededFeatures, yearlySaving, type Needs } from "@/lib/planFinder";
import { money, monthlyPrice, planOrder, whole, yearlyPerMonth, yearlyPrice, type PlanId } from "@/lib/pricing";
import { PrimaryButton } from "./SetupFrame";

export type Billing = "annual" | "monthly";
export const planName = (p: PlanId) => copy.landing.pricingPage.plans[planOrder.indexOf(p)].name;

/** The plan that fits, why in one paragraph, what it covers, and its price with the billing choice. */
export function PlanRecommendation({ needs, plan, recommended, billing, onBilling, onUseRecommended, onContinue }: { needs: Needs; plan: PlanId; recommended: PlanId; billing: Billing; onBilling: (b: Billing) => void; onUseRecommended: () => void; onContinue: () => void }) {
  const annual = billing === "annual";
  const p = PLANS[plan];
  const asked = neededFeatures(needs).map((n) => FEATURE_LABELS[n.feature]);
  const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
  const focus = asked.length ? ` and your focus on ${asked.join(" and ").toLowerCase().replace("google analytics & search console", "analytics")}` : "";
  const tile = (icon: React.ReactNode, top: string, bottom: string) => (
    <li className="rounded-2xl bg-white/70 px-3 py-3.5 text-center ring-1 ring-[#ecedf5]"><span className="mx-auto grid size-8 place-items-center text-primary" aria-hidden>{icon}</span><p className="mt-1.5 text-[13px] font-semibold">{top}</p><p className="text-[12px] text-ink-grey">{bottom}</p></li>
  );
  const toggle = (b: Billing) => clsx("h-9 rounded-full px-5 text-[13px] font-semibold", billing === b ? "bg-[#161a3a] text-white" : "text-ink-grey");
  return (
    <section className="grid gap-6 rounded-[22px] border border-[#e6e3ff] bg-gradient-to-br from-[#f6f5ff] to-[#fbfaff] p-[24px] lg:grid-cols-[1.35fr_1fr]" aria-labelledby="plan-name">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eeefff] px-3 py-1 text-[12px] font-bold text-primary"><Check size={12} strokeWidth={3} aria-hidden />{plan === recommended ? copy.onboarding.plan.recommended : "Your choice"}</span>
        <h2 id="plan-name" className="mt-3 text-[28px] font-bold tracking-[-0.02em]">Clinx {planName(plan)}</h2>
        {plan === recommended ? (
          <>
            <p className="mt-1.5 text-[15px] text-ink-grey">Covers your current needs and gives you room to grow.</p>
            <p className="mt-3 text-[13.5px] leading-relaxed">Based on your {n(needs.locations, "location")}, {n(needs.disciplines, "discipline")}{focus}, {planName(plan)} is the best fit for your clinic.</p>
          </>
        ) : (
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-grey">You chose {planName(plan)}. We recommend {planName(recommended)} for your setup. <button type="button" onClick={onUseRecommended} className="font-semibold text-primary hover:underline">Use {planName(recommended)}</button></p>
        )}
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tile(<Building2 size={20} />, `Up to ${p.locations}`, p.locations === 1 ? "location" : "locations")}
          {tile(<LayoutGrid size={20} />, `Up to ${p.disciplines}`, p.disciplines === 1 ? "discipline" : "disciplines")}
          {tile(<BarChart3 size={20} />, "Monthly", "analysis & reports")}
          {tile(<Users size={20} />, "Competitor", "intelligence")}
        </ul>
      </div>
      <div className="rounded-[20px] bg-white p-[20px] ring-1 ring-[#ecedf5]">
        <div role="group" aria-label="Billing period" className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-[#f0f1f7] p-1">
            <button type="button" aria-pressed={!annual} onClick={() => onBilling("monthly")} className={toggle("monthly")}>{copy.onboarding.plan.monthly}</button>
            <button type="button" aria-pressed={annual} onClick={() => onBilling("annual")} className={toggle("annual")}>{copy.onboarding.plan.annual}</button>
          </div>
          <span className="rounded-full bg-[#fff3cf] px-2.5 py-1 text-[11.5px] font-bold text-[#8a5a00]">2 months free</span>
        </div>
        <p className="mt-4 flex items-baseline gap-2"><span className="text-[34px] leading-none font-extrabold tracking-[-0.03em]">{whole(annual ? yearlyPrice(plan) : monthlyPrice[plan])}</span><span className="text-[12.5px] text-ink-grey">CAD / {annual ? "year" : "month"}</span></p>
        <p className="mt-2 text-[12.5px] leading-snug text-ink-grey">{annual ? `Billed once a year. Equivalent to ${money(yearlyPerMonth(plan))} per month.` : "Billed every month, no commitment."}</p>
        {annual && <p className="mt-2.5 rounded-lg bg-[#e6f7ee] px-3 py-2 text-[12.5px] font-medium text-[#16875a]">You save {whole(yearlySaving(plan))} compared with monthly billing.</p>}
        <div className="mt-4"><PrimaryButton pill onClick={onContinue}>Continue with this plan</PrimaryButton></div>
        <p className="mt-2.5 text-[11.5px] text-ink-grey">Nothing is charged until you confirm payment in the next step.</p>
      </div>
    </section>
  );
}
