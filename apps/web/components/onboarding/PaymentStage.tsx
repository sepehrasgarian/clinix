"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useAccount } from "@/components/auth/useAccount";
import { billingErrors, defaultBilling, type BillingDraft } from "@/lib/billingForm";
import { demoOutcome } from "@/lib/checkout";
import type { PlanId } from "@/lib/pricing";
import { BillingForm } from "./BillingForm";
import { CardForm, cardErrors, emptyCard, type CardDraft } from "./CardForm";
import { OrderSummary } from "./OrderSummary";
import type { Billing } from "./PlanStage";
import { SetupFrame } from "./SetupFrame";

export const PROCESSING_MS = 700;

/**
 * Step 4: billing details, a card form and the order. There is no payment provider yet, so this is a working demo: the
 * card is checked for typos and picks an outcome (paid, declined, extra verification), but is never sent or saved. Only the
 * billing details are kept, so coming back resumes where the owner stopped.
 */
export function PaymentStage({ clinic, plan, billing, draft, onDraft, onBilling, onBack, onContinue }: {
  clinic: { name: string; address: string; city: string; province?: string };
  plan: PlanId;
  billing: Billing;
  draft?: BillingDraft;
  onDraft: (next: BillingDraft) => void;
  onBilling: (b: Billing) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { email } = useAccount();
  const [form, setForm] = useState<BillingDraft>(() => draft ?? defaultBilling(clinic, email));
  // Which address fields the clinic itself supplied. Fixed at the start so typing a missing one never locks it.
  const [fromClinic] = useState(() => { const d = defaultBilling(clinic, null); return { street: !!d.street, city: !!d.city, postalCode: !!d.postalCode, province: /,\s*[A-Z]{2}\b/.test(clinic.address) || !!clinic.province }; });
  const [card, setCard] = useState<CardDraft>(emptyCard);
  const [busy, setBusy] = useState(false);
  const [verify, setVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // The account's email arrives a moment after the page; fill it in only if the owner has not typed one.
  useEffect(() => { if (email) setForm((f) => (f.email ? f : { ...f, email })); }, [email]);

  const change = (next: BillingDraft) => { setForm(next); onDraft(next); };
  const ready = Object.keys(billingErrors(form)).length === 0 && Object.keys(cardErrors(card)).length === 0;
  const pay = () => {
    setError(null);
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      const outcome = demoOutcome(card.number);
      if (outcome === "declined") setError("Your card was declined. Try another card, or use 4242 4242 4242 4242 in this demo.");
      else if (outcome === "verify") setVerify(true);
      else { setCard(emptyCard); onContinue(); }
    }, PROCESSING_MS);
  };

  const aside = (
    <>
      <section className="flex items-center gap-4 rounded-[24px] border border-[#f3e7c9] bg-gradient-to-br from-[#fffaf0] to-[#fbfaff] p-[20px]">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-sm" aria-hidden><Sparkles size={20} /></span>
        <div><h2 className="text-[17px] font-bold">You&apos;re almost there!</h2><p className="mt-1 text-[13.5px] leading-snug text-ink-grey">Review your plan and confirm your payment to start your full analysis.</p></div>
      </section>
      <OrderSummary plan={plan} billing={billing} province={form.province} ready={ready} busy={busy} error={error} onBilling={onBilling} onEditPlan={onBack} onPay={pay} />
      <p className="flex items-center gap-2.5 px-2 text-[12.5px] text-ink-grey"><ShieldCheck size={16} className="shrink-0" aria-hidden /><span><b className="text-ink">Itemized invoice</b> — tax for your province</span></p>
    </>
  );

  return (
    <SetupFrame step={4} back={{ label: "plans", onClick: onBack }} title="Complete your subscription" intro="Activate your plan and start the full analysis of your market." aside={aside} asideWidth={440}>
      <div className="flex flex-col gap-6">
        <p role="note" className="flex items-center gap-3 rounded-2xl border border-[#f3e7c9] bg-[#fffaf0] px-5 py-3.5 text-[14px] text-[#7a5200]"><ShieldCheck size={16} className="shrink-0" aria-hidden />Prototype checkout — no charge is made and no card data is stored.</p>
        <BillingForm draft={form} fromClinic={fromClinic} onChange={change} />
        <CardForm card={card} onChange={setCard} />
        {verify && (
          <section role="dialog" aria-label="Extra verification" className="rounded-[24px] border border-primary/30 bg-[#f7f7ff] p-[24px]">
            <h2 className="text-[17px] font-bold">Confirm with your bank</h2>
            <p className="mt-1 text-[14px] text-ink-grey">This test card asks for extra verification, as many real cards do. In the live version your bank&apos;s own window opens here.</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => { setVerify(false); setCard(emptyCard); onContinue(); }} className="h-11 rounded-full bg-primary px-6 text-[14px] font-semibold text-white">Complete verification</button>
              <button type="button" onClick={() => setVerify(false)} className="h-11 rounded-full border border-[#dfe2f1] bg-white px-6 text-[14px] font-semibold">Cancel</button>
            </div>
          </section>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={onBack} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#dfe2f1] bg-white px-5 text-[14px] font-semibold hover:border-primary/40">← Back</button>
          <p className="text-[13.5px] text-ink-grey">Change your plan or setup. What you&apos;ve entered here is saved.</p>
        </div>
      </div>
    </SetupFrame>
  );
}
