"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, Select, inputClass } from "@/components/forms/Fields";
import { useLanding } from "@/components/i18n/LangProvider";
import { copy } from "@/lib/copy";

const EMAIL = copy.landing.footer.email;

type Values = { topic: string; name: string; email: string; message: string };

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isComplete = (v: Values) => v.name.trim() !== "" && isValidEmail(v.email) && v.message.trim() !== "";

/** There is no message endpoint yet, so the form hands the message to the visitor's mail app. */
export function contactMailto(v: Values, subject: string = copy.landing.contact.form.mailSubject) {
  const body = [`Topic: ${v.topic}`, `Name: ${v.name}`, `Email: ${v.email}`, "", v.message.trim()].join("\n");
  return `mailto:${EMAIL}?subject=${encodeURIComponent(`${subject}: ${v.topic}`)}&body=${encodeURIComponent(body)}`;
}

export function ContactForm() {
  const t = useLanding().contact.form;
  const [v, setV] = useState<Values>({ topic: t.topics[0], name: "", email: "", message: "" });
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof Values) => (value: string) => { setV((p) => ({ ...p, [k]: value })); setError(false); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete(v)) { setError(true); return; }
    window.location.href = contactMailto(v, t.mailSubject);
    setSent(true);
  };

  const card = "rounded-[28px] bg-white p-[37px] shadow-[0_40px_80px_-40px_rgba(14,21,38,.4)]";
  if (sent) {
    return (
      <div className={card} role="status">
        <h2 className="text-2xl font-bold tracking-tight">{t.sent.title}</h2>
        <p className="mt-3 text-[15px] text-ink-grey">{t.sent.text.replace("{email}", EMAIL)}</p>
        <Link href="/" className="mt-6 inline-flex font-semibold text-primary">{t.sent.back}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={card} aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" className="text-[22px] font-bold tracking-[-0.02em]">{t.title}</h2>
      <p className="mt-2.5 text-[14px] text-ink-grey">{t.intro}</p>
      <div className="mt-[29px] space-y-[19px]">
        <Field id="contact-topic" label={t.topic}><Select id="contact-topic" value={v.topic} onChange={set("topic")} options={t.topics.map((x) => ({ value: x, label: x }))} /></Field>
        <div className="grid gap-[17px] sm:grid-cols-2">
          <Field id="contact-name" label={t.name}><input id="contact-name" autoComplete="name" placeholder={t.namePlaceholder} className={inputClass} value={v.name} onChange={(e) => set("name")(e.target.value)} /></Field>
          <Field id="contact-email" label={t.email}><input id="contact-email" type="email" autoComplete="email" placeholder={t.emailPlaceholder} className={inputClass} value={v.email} onChange={(e) => set("email")(e.target.value)} /></Field>
        </div>
        <Field id="contact-message" label={t.message}><textarea id="contact-message" rows={5} className={`${inputClass} block h-[145px] resize-y py-3`} value={v.message} onChange={(e) => set("message")(e.target.value)} /></Field>
      </div>
      {error && <p role="alert" className="mt-4 text-sm font-medium text-alert">{t.missing}</p>}
      <button type="submit" className="mt-6 h-[50px] w-full rounded-2xl bg-[#4338ca] text-base font-bold text-white transition-colors hover:bg-[#3730a3] active:translate-y-px">{t.submit}</button>
      <p className="mt-4 text-center text-[12.5px] text-ink-grey">{t.note}</p>
    </form>
  );
}
