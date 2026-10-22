"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { billingErrors, type BillingDraft } from "@/lib/billingForm";
import { normalPostal } from "@/lib/checkout";
import { PROVINCES, type ProvinceCode } from "@/lib/tax";
import { Field, inputClass } from "./SetupFrame";

const select = `${inputClass} appearance-none pr-9`;
const lock = "bg-[#f6f7fb] text-ink-grey";

/** Step one of the checkout: who is invoiced and where. The clinic's own address is filled in and can be changed. */
export function BillingForm({ draft, fromClinic, onChange }: { draft: BillingDraft; /** The address fields the clinic's own address supplied; only those are fixed while "same as clinic" is ticked. */ fromClinic: Partial<Record<keyof BillingDraft, boolean>>; onChange: (next: BillingDraft) => void }) {
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [more, setMore] = useState(false);
  const errors = billingErrors(draft);
  const err = (k: keyof typeof errors) => (touched.has(k) ? errors[k] : undefined);
  const set = <K extends keyof BillingDraft>(k: K, v: BillingDraft[K]) => onChange({ ...draft, [k]: v });
  const blur = (k: string) => () => setTouched((t) => new Set(t).add(k));
  const business = draft.kind === "business";
  const seg = (on: boolean) => clsx("h-10 rounded-xl px-6 text-[14px] font-semibold", on ? "bg-white shadow-sm" : "text-ink-grey");
  const text = (id: keyof BillingDraft, over: { autoComplete?: string; readOnly?: boolean; placeholder?: string; normal?: (s: string) => string } = {}) => (
    <input id={id} value={draft[id] as string} readOnly={over.readOnly && !!fromClinic[id]} autoComplete={over.autoComplete} placeholder={over.placeholder} onBlur={blur(id)} onChange={(e) => set(id, (over.normal ? over.normal(e.target.value) : e.target.value) as never)} className={clsx(inputClass, over.readOnly && !!fromClinic[id] && lock)} aria-describedby={errors[id as keyof typeof errors] && touched.has(id) ? `${id}-error` : undefined} />
  );
  const locked = draft.sameAddress;
  return (
    <section className="rounded-[24px] border border-[#ecedf5] bg-white p-[28px] shadow-[0_24px_60px_-44px_rgba(76,70,180,.4)]" aria-labelledby="billing-title">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eeefff] text-[15px] font-bold text-primary" aria-hidden>1</span>
        <div><h2 id="billing-title" className="text-[20px] font-bold">Billing information</h2><p className="mt-0.5 text-[14px] text-ink-grey">Used to calculate applicable taxes and issue your invoice.</p></div>
      </div>
      <p className="mt-5 text-[12.5px] text-ink-grey"><span className="text-[#e5484d]">*</span> Required</p>
      <div role="group" aria-label="Billing as" className="mt-3 inline-flex rounded-2xl bg-[#f0f1f7] p-1">
        <button type="button" aria-pressed={business} onClick={() => set("kind", "business")} className={seg(business)}>Business</button>
        <button type="button" aria-pressed={!business} onClick={() => set("kind", "individual")} className={seg(!business)}>Individual</button>
      </div>
      <div className="mt-5 flex flex-col gap-5">
        <Field id="legalName" label={business ? "Legal business name" : "Full name"} required error={err("legalName")}>{text("legalName", { autoComplete: "organization" })}</Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="contactName" label="Billing contact full name" required error={err("contactName")}>{text("contactName", { autoComplete: "name" })}</Field>
          <Field id="email" label="Billing email" required error={err("email")}>{text("email", { autoComplete: "email" })}</Field>
        </div>
        <label className="flex items-center gap-3 text-[14px]"><input type="checkbox" checked={draft.sameAddress} onChange={(e) => set("sameAddress", e.target.checked)} className="size-[18px] accent-[#4338ca]" />My billing address is the same as my clinic address.</label>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="country" label="Country" required icon={<span aria-hidden>🇨🇦</span>}><select id="country" className={select} defaultValue="CA"><option value="CA">Canada</option></select></Field>
          <Field id="province" label="Province / territory" required>
            <select id="province" value={draft.province} disabled={locked && !!fromClinic.province} onChange={(e) => set("province", e.target.value as ProvinceCode)} className={clsx(select, locked && fromClinic.province && lock)} autoComplete="address-level1">{PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</select>
          </Field>
          <Field id="postalCode" label="Postal code" required error={err("postalCode")}>{text("postalCode", { autoComplete: "postal-code", readOnly: locked, normal: normalPostal })}</Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-[1.4fr_.5fr_1fr]">
          <Field id="street" label="Street address" required error={err("street")}>{text("street", { autoComplete: "address-line1", readOnly: locked })}</Field>
          <Field id="unit" label="Unit">{text("unit", { autoComplete: "address-line2", placeholder: "Optional" })}</Field>
          <Field id="city" label="City" required error={err("city")}>{text("city", { autoComplete: "address-level2", readOnly: locked })}</Field>
        </div>
        {business && (
          <div className="rounded-2xl border border-[#ecedf5]">
            <button type="button" aria-expanded={more} onClick={() => setMore(!more)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
              <span><span className="block text-[15px] font-bold">Additional business &amp; tax details <span className="font-normal text-ink-grey">(optional)</span></span><span className="mt-0.5 block text-[13px] text-ink-grey">Registration and tax account numbers, invoice language.</span></span>
              <ChevronDown size={18} className={clsx("shrink-0 transition-transform", more && "rotate-180")} aria-hidden />
            </button>
            {more && (
              <div className="grid gap-5 border-t border-[#ecedf5] p-5 sm:grid-cols-3">
                <Field id="gstNumber" label="GST/HST number" optional>{text("gstNumber", { placeholder: "123456789 RT0001" })}</Field>
                <Field id="qstNumber" label="QST number" optional>{text("qstNumber", { placeholder: "1234567890 TQ0001" })}</Field>
                <Field id="language" label="Invoice language"><select id="language" value={draft.language} onChange={(e) => set("language", e.target.value as "en" | "fr")} className={select}><option value="en">English</option><option value="fr">Français</option></select></Field>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
