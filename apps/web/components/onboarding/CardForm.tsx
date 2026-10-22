"use client";

import { useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import { brandOf, cvcValid, expiryValid, groupCard, groupExpiry, luhnValid } from "@/lib/checkout";
import { CardMarks } from "./CardMarks";
import { Field, inputClass } from "./SetupFrame";

export type CardDraft = { name: string; number: string; expiry: string; cvc: string };
export const emptyCard: CardDraft = { name: "", number: "", expiry: "", cvc: "" };

export function cardErrors(c: CardDraft): Partial<Record<keyof CardDraft, string>> {
  const e: Partial<Record<keyof CardDraft, string>> = {};
  if (!c.name.trim()) e.name = "Enter the name on the card.";
  if (!luhnValid(c.number)) e.number = "That card number doesn't look right. Check it and try again.";
  if (!expiryValid(c.expiry)) e.expiry = "Enter a date that hasn't passed, like 04 / 28.";
  if (!cvcValid(c.cvc, c.number)) e.cvc = brandOf(c.number) === "amex" ? "Enter the 4 digit code." : "Enter the 3 digit code.";
  return e;
}

/**
 * Step two of the checkout. This is the shape a payment provider's hosted fields will take; for now the values stay in this
 * form, are never sent or saved, and only choose a demo outcome.
 */
export function CardForm({ card, onChange }: { card: CardDraft; onChange: (next: CardDraft) => void }) {
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const errors = cardErrors(card);
  const err = (k: keyof CardDraft) => (touched.has(k) ? errors[k] : undefined);
  const blur = (k: string) => () => setTouched((t) => new Set(t).add(k));
  return (
    <section className="rounded-[24px] border border-[#ecedf5] bg-white p-[28px] shadow-[0_24px_60px_-44px_rgba(76,70,180,.4)]" aria-labelledby="card-title">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eeefff] text-[15px] font-bold text-primary" aria-hidden>2</span>
        <div><h2 id="card-title" className="text-[20px] font-bold">Payment method</h2><p className="mt-0.5 text-[14px] text-ink-grey">Card details are never stored by Clinx.</p></div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[#f6f7fb] px-5 py-3.5 text-[14px]">
        <span>Cards we accept</span>
        <CardMarks />
      </div>
      <div className="mt-5 flex flex-col gap-5">
        <Field id="cardName" label="Name on card" required error={err("name")}>
          <input id="cardName" autoComplete="cc-name" value={card.name} onBlur={blur("name")} onChange={(e) => onChange({ ...card, name: e.target.value })} className={inputClass} />
        </Field>
        <Field id="cardNumber" label="Card number" required error={err("number")} icon={<CreditCard size={16} aria-hidden />}>
          <input id="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" value={card.number} onBlur={blur("number")} onChange={(e) => onChange({ ...card, number: groupCard(e.target.value) })} className={inputClass} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="cardExpiry" label="Expiration date" required error={err("expiry")}>
            <input id="cardExpiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" value={card.expiry} onBlur={blur("expiry")} onChange={(e) => onChange({ ...card, expiry: groupExpiry(e.target.value) })} className={inputClass} />
          </Field>
          <Field id="cardCvc" label="Security code" required error={err("cvc")}>
            <input id="cardCvc" inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" value={card.cvc} onBlur={blur("cvc")} onChange={(e) => onChange({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} className={inputClass} />
          </Field>
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-grey">Test cards: <b className="font-mono">4242 4242 4242 4242</b> succeeds · <b className="font-mono">4000 0000 0000 0002</b> declined · <b className="font-mono">4000 0027 6000 3184</b> asks for extra verification. Any future date, any code.</p>
        <p className="flex items-center gap-2 border-t border-[#ecedf5] pt-4 text-[13px] text-ink-grey"><Lock size={14} aria-hidden />No card details are stored.</p>
      </div>
    </section>
  );
}
