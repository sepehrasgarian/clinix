"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Field, Select, inputClass as input } from "@/components/forms/Fields";
import { useLang, useLanding } from "@/components/i18n/LangProvider";
import { LANGS, LANG_INFO, type Lang } from "@/lib/i18n/languages";
import { copy } from "@/lib/copy";

const DRAFT_KEY = "clinx-demo-draft";
const EMAIL = copy.landing.footer.email;

type Values = { name: string; email: string; website: string; jane: string; role: string; locations: string; language: string; phone: string; notes: string };
const empty: Values = { name: "", email: "", website: "", jane: "", role: "", locations: "", language: "en", phone: "", notes: "" };

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const requiredStatus = (v: Values) => ({ name: v.name.trim() !== "", email: isValidEmail(v.email), website: v.website.trim() !== "", jane: v.jane.trim() !== "" });

/** Builds the mail the owner sends us. There is no demo-request endpoint yet, so the form hands off to their mail app. */
export function demoMailto(v: Values, subject: string = copy.landing.demo.form.mailSubject) {
  const lines = [`Name: ${v.name}`, `Work email: ${v.email}`, `Website: ${v.website}`, `Jane App URL: ${v.jane}`, `Role: ${v.role || "-"}`, `Locations: ${v.locations || "-"}`, `Meeting language: ${LANG_INFO[v.language as Lang]?.name ?? v.language}`];
  if (v.phone.trim()) lines.push(`Phone: ${v.phone}`);
  if (v.notes.trim()) lines.push("", v.notes.trim());
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export function DemoForm() {
  const t = useLanding().demo.form;
  const { lang } = useLang();
  const [v, setV] = useState<Values>({ ...empty, language: lang });
  const same = (list: readonly string[]) => list.map((x) => ({ value: x, label: x }));
  const [more, setMore] = useState(false);
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) setV({ ...empty, ...JSON.parse(saved) });
    } catch { /* private window or blocked storage: start empty */ }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* the draft is a convenience only */ }
  }, [v]);

  const status = requiredStatus(v);
  const done = Object.values(status).filter(Boolean).length;
  const set = (k: keyof Values) => (value: string) => { setV((p) => ({ ...p, [k]: value })); setError(false); };
  const text = (k: keyof Values) => ({ value: v[k], onChange: (e: { target: { value: string } }) => set(k)(e.target.value) });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (done < 4) { setError(true); return; }
    window.location.href = demoMailto(v, t.mailSubject);
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* nothing to clear */ }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-[28px] bg-white p-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,.6)] md:p-10" role="status">
        <h2 className="text-2xl font-bold tracking-tight">{t.sent.title}</h2>
        <p className="mt-3 text-[15px] text-ink-grey">{t.sent.text.replace("{email}", EMAIL)}</p>
        <Link href="/" className="mt-6 inline-flex font-semibold text-primary">{t.sent.back}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-[28px] bg-white p-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,.6)] md:p-10" aria-labelledby="demo-form-title">
      <h2 id="demo-form-title" className="text-[26px] font-bold tracking-[-0.02em]">{t.title}</h2>
      <p className="mt-3 text-[15px] text-ink-grey">{t.intro}</p>
      <p className="mt-3 text-[13px] text-ink">{t.required}</p>
      <p className="mt-2 text-xs text-ink-grey">{t.draft}</p>
      <p className="mt-3 inline-flex rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink">{t.progress.replace("{done}", String(done)).replace("{total}", "4")}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef0f4]" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={done}><div className="h-full rounded-full bg-success transition-all" style={{ width: `${done * 25}%` }} /></div>

      <div className="mt-7 space-y-5">
        <Field id="demo-name" label={t.fields.name.label} ok={status.name}><input id="demo-name" autoComplete="name" className={input} {...text("name")} /></Field>
        <Field id="demo-email" label={t.fields.email.label} ok={status.email}><input id="demo-email" type="email" autoComplete="email" className={input} {...text("email")} /></Field>
        <Field id="demo-website" label={t.fields.website.label} ok={status.website}><input id="demo-website" autoComplete="url" className={input} {...text("website")} /></Field>
        <Field id="demo-jane" label={t.fields.jane.label} ok={status.jane}><input id="demo-jane" placeholder={t.fields.jane.placeholder} className={input} {...text("jane")} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="demo-role" label={t.fields.role.label}><Select id="demo-role" value={v.role} onChange={set("role")} options={same(t.roles)} placeholder={t.select} /></Field>
          <Field id="demo-locations" label={t.fields.locations.label}><Select id="demo-locations" value={v.locations} onChange={set("locations")} options={same(t.locationOptions)} placeholder={t.select} /></Field>
        </div>
        <Field id="demo-language" label={t.fields.language.label}><Select id="demo-language" value={v.language} onChange={set("language")} options={LANGS.map((c) => ({ value: c, label: LANG_INFO[c].name, lang: c }))} placeholder={t.select} /></Field>
        {more && (
          <>
            <Field id="demo-phone" label={t.fields.phone.label}><input id="demo-phone" type="tel" autoComplete="tel" className={input} {...text("phone")} /></Field>
            <Field id="demo-notes" label={t.fields.notes.label}><textarea id="demo-notes" rows={3} className={clsx(input, "h-auto py-3")} {...text("notes")} /></Field>
          </>
        )}
      </div>

      <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="mt-6 text-sm font-semibold text-[#3730a3]">{more ? t.hideOptional : t.optional}</button>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-alert">{t.missing}</p>}
      <button type="submit" className="mt-4 h-14 w-full rounded-2xl bg-[#f59e0b] text-base font-bold text-[#101a32] hover:brightness-105 active:translate-y-px">{t.submit}</button>
      <p className="mt-4 text-center text-[13px] text-ink-grey">{t.reassurance}</p>
    </form>
  );
}
