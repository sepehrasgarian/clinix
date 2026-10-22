import clsx from "clsx";
import { Check, Lock } from "lucide-react";
import { FEATURE_LABELS, PLANS } from "@/lib/planFinder";
import { cents, orderFor } from "@/lib/checkout";
import { planOrder, type PlanId } from "@/lib/pricing";
import { copy } from "@/lib/copy";
import { taxLines, type ProvinceCode } from "@/lib/tax";
import type { Billing } from "./PlanStage";

const planName = (p: PlanId) => copy.landing.pricingPage.plans[planOrder.indexOf(p)].name;
const renewal = (annual: boolean, now: Date) => {
  const next = new Date(now);
  next.setFullYear(next.getFullYear() + (annual ? 1 : 0));
  if (!annual) next.setMonth(next.getMonth() + 1);
  return next.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
};

/** The order: plan, billing choice, the price line by line with the province's taxes, and the pay button. */
export function OrderSummary({ plan, billing, province, ready, busy, error, onBilling, onEditPlan, onPay, now = new Date() }: { plan: PlanId; billing: Billing; province: ProvinceCode; ready: boolean; busy: boolean; error: string | null; onBilling: (b: Billing) => void; onEditPlan: () => void; onPay: () => void; now?: Date }) {
  const annual = billing === "annual";
  const order = orderFor(plan, billing);
  const taxes = taxLines(order.subtotalCents, province);
  const total = order.subtotalCents + taxes.reduce((s, t) => s + t.cents, 0);
  const p = PLANS[plan];
  const features = [`Up to ${p.disciplines} discipline${p.disciplines === 1 ? "" : "s"}`, `Up to ${p.locations} location${p.locations === 1 ? "" : "s"}`, "Monthly analysis & reports", ...p.features.map((f) => FEATURE_LABELS[f])];
  const choice = (b: Billing, title: string, sub: string) => (
    <label className={clsx("flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5", billing === b ? "border-primary bg-[#f7f7ff] ring-1 ring-primary" : "border-[#e3e6f2] bg-white")}>
      <input type="radio" name="billing" checked={billing === b} onChange={() => onBilling(b)} className="size-[18px] accent-[#4338ca]" />
      <span><span className="block text-[14px] font-semibold">{title}</span><span className={clsx("block text-[12.5px]", b === "annual" ? "text-[#16875a]" : "text-ink-grey")}>{sub}</span></span>
    </label>
  );
  const row = (label: string, value: string, tone = "") => <div className={clsx("flex justify-between gap-4 py-1.5 text-[14px]", tone)}><dt>{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>;
  return (
    <section className="rounded-[24px] border border-[#ecedf5] bg-white p-[24px] shadow-[0_24px_60px_-44px_rgba(76,70,180,.4)]" aria-labelledby="plan-title">
      <div className="flex items-center justify-between gap-3"><h2 id="plan-title" className="text-[20px] font-bold">Your plan</h2><button type="button" onClick={onEditPlan} className="text-[13.5px] font-semibold text-primary hover:underline">Edit plan</button></div>
      <div className="mt-4 rounded-2xl bg-[#f6f7fb] p-4">
        <p className="text-[17px] font-bold">Clinx {planName(plan)}</p>
        <p className="mt-1 text-[26px] leading-none font-extrabold tracking-[-0.02em]">{cents(order.subtotalCents / (annual ? 10 : 1)).replace(/\.00$/, "")}<span className="ml-1 text-[14px] font-normal text-ink-grey">/ month</span></p>
        <p className="mt-1.5 text-[12.5px] text-ink-grey">{annual ? "Billed annually · 2 months free" : "Billed monthly"}</p>
      </div>
      <ul className="mt-4 grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-2">{features.map((f) => <li key={f} className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />{f}</li>)}</ul>
      <div role="radiogroup" aria-label="Billing period" className="mt-5 grid gap-3 sm:grid-cols-2">{choice("monthly", "Monthly", "Pay month to month")}{choice("annual", "Annual", "2 months free")}</div>
      <h3 className="mt-6 border-t border-[#ecedf5] pt-5 text-[16px] font-bold">Pricing details</h3>
      <dl className="mt-2 divide-y divide-[#eef0f6]">
        {annual && <div className="pb-2">{row("Annual subscription (12 months)", cents(order.listCents))}{row("2 months free", `−${cents(order.discountCents)}`, "text-[#16875a]")}</div>}
        <div className="py-2">{row("Subtotal (before tax)", cents(order.subtotalCents), "font-semibold")}{taxes.map((t) => row(t.label, cents(t.cents), "text-ink-grey"))}</div>
      </dl>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#f6f7fb] px-5 py-4"><span className="text-[15px] font-bold">Total due today</span><span className="text-[13px] text-ink-grey">CAD <b className="ml-1 text-[24px] text-ink">{cents(total)}</b></span></div>
      <p className="mt-3 text-[12.5px] leading-snug text-ink-grey">Renews on {renewal(annual, now)}: {cents(order.subtotalCents)} plus tax, for another {annual ? "12 months" : "month"}.</p>
      {error && <p role="alert" className="mt-3 rounded-xl bg-alert-soft px-4 py-3 text-[13px] font-medium text-alert">{error}</p>}
      <button type="button" onClick={onPay} disabled={!ready || busy} className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4338ca] to-[#5b5cf0] text-[15px] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(67,56,202,.8)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none">
        <Lock size={15} aria-hidden />{busy ? "Processing…" : `Pay CAD ${cents(total)}`}
      </button>
      <p className="mt-3 text-[11.5px] leading-snug text-ink-grey">Prototype checkout: confirming charges nothing. When billing goes live, confirming will authorize Clinx to charge {cents(total)} CAD today and {cents(order.subtotalCents)} plus applicable tax at each renewal until you cancel.</p>
      {!ready && <p className="mt-2 text-center text-[12.5px] text-ink-grey">Complete your billing and payment details to continue.</p>}
    </section>
  );
}
