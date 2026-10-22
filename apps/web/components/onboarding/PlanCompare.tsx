import clsx from "clsx";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { FEATURE_LABELS, PLANS, misfits, type FeatureId, type Needs } from "@/lib/planFinder";
import { money, monthlyPrice, planOrder, whole, yearlyPerMonth, yearlyPrice, type PlanId } from "@/lib/pricing";
import { copy } from "@/lib/copy";
import { planName, type Billing } from "./PlanRecommendation";

const FEATURES = Object.keys(FEATURE_LABELS) as FeatureId[];
const tagline = (id: PlanId) => copy.landing.pricingPage.plans[planOrder.indexOf(id)].tagline;
const mark = (on: boolean) => (on ? <span className="inline-grid size-[22px] place-items-center rounded-full bg-[#e6f7ee] text-[#16875a]" role="img" aria-label="Included"><Check size={13} strokeWidth={3} aria-hidden /></span> : <Minus size={15} className="text-faint" role="img" aria-label="Not included" />);

/** All three plans side by side, priced as the owner chose to pay. A plan that does not fit says exactly why instead of just being unavailable. */
export function PlanCompare({ needs, plan, recommended, billing, onSelect }: { needs: Needs; plan: PlanId; recommended: PlanId; billing: Billing; onSelect: (p: PlanId) => void }) {
  const annual = billing === "annual";
  const col = (id: PlanId) => id === recommended;
  const rows: { label: string; cell: (id: PlanId) => React.ReactNode }[] = [
    { label: "Locations, up to", cell: (id) => PLANS[id].locations },
    { label: "Disciplines, up to", cell: (id) => PLANS[id].disciplines },
    { label: "Monthly analysis & reports", cell: () => mark(true) },
    { label: "Competitor intelligence", cell: () => mark(true) },
    ...FEATURES.map((f) => ({ label: FEATURE_LABELS[f], cell: (id: PlanId) => mark(PLANS[id].features.includes(f)) })),
  ];
  return (
    <section className="rounded-[22px] border border-[#ecedf5] bg-white p-[24px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" aria-labelledby="compare-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="compare-title" className="text-[17px] font-bold">Compare all plans</h2><p className="mt-1 text-[12.5px] text-ink-grey">See what&apos;s included in each plan. You can choose any plan that fits your needs.</p></div>
        <Link href="/pricing" target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dfe2f1] bg-white px-4 text-[13px] font-semibold text-primary hover:border-primary/40">See full feature comparison <ArrowRight size={13} aria-hidden /></Link>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <td className="w-[28%]" />
              {planOrder.map((id) => {
                const problems = misfits(id, needs);
                return (
                  <th key={id} scope="col" className={clsx("align-top px-4 pt-4 pb-4 font-normal", col(id) && "rounded-t-[18px] bg-[#f5f5ff] ring-1 ring-primary/40")}>
                    <span className="flex items-center gap-2"><span className="text-[17px] font-bold">{planName(id)}</span>{col(id) && <span className="rounded-full bg-[#fff3cf] px-2 py-0.5 text-[11px] font-semibold text-[#8a5a00]">Recommended</span>}</span>
                    <span className="mt-1 block min-h-[34px] text-[12px] leading-snug text-ink-grey">{tagline(id)}</span>
                    <span className="mt-2 block text-[22px] leading-none font-extrabold tracking-[-0.02em]">{whole(annual ? yearlyPrice(id) : monthlyPrice[id])}<span className="ml-1 text-[12px] font-normal text-ink-grey">/ {annual ? "year" : "month"}</span></span>
                    <span className="mt-1 block text-[12px] text-ink-grey">{annual ? `${money(yearlyPerMonth(id))} / month` : "billed monthly"}</span>
                    {id === plan ? (
                      <span className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-[13px] font-semibold text-white"><Check size={13} aria-hidden />{id === recommended ? "Current recommendation" : "Selected"}</span>
                    ) : (
                      <button type="button" onClick={() => onSelect(id)} disabled={problems.length > 0} className="mt-3 h-10 w-full rounded-xl border border-[#dfe2f1] bg-white text-[13px] font-semibold text-primary hover:border-primary/50 disabled:cursor-not-allowed disabled:text-faint disabled:hover:border-[#dfe2f1]">Select {planName(id)}</button>
                    )}
                    {problems.length > 0 && <span className="mt-2 block text-[12px] leading-snug text-[#8a5a00]">Doesn&apos;t fit: {problems.join("; ")}.</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} className="border-t border-[#eef0f6]">
                <th scope="row" className="py-3 pr-4 font-normal">{r.label}</th>
                {planOrder.map((id) => <td key={id} className={clsx("px-4 py-3", col(id) && "bg-[#f5f5ff]", col(id) && "border-x border-primary/40", col(id) && i === rows.length - 1 && "rounded-b-[18px] border-b")}>{r.cell(id)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
