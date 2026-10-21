"use client";

import clsx from "clsx";
import Link from "next/link";
import { ArrowRight, Facebook, Globe, Instagram, Linkedin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useLang, useLanding } from "@/components/i18n/LangProvider";

const socials = [Linkedin, Instagram, Facebook];

/** Closing banner with the last call to action, then the footer. */
export function Footer({ banner = true }: { banner?: boolean }) {
  const t = useLanding().footer;
  const sp = useLang().lang === "zh" ? "" : " ";
  return (
    <footer id="footer" className="relative isolate overflow-hidden bg-[#0a1128] pt-[64px] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,.25),transparent_70%)]" />
        <div className="absolute -right-72 -top-80 size-[900px] rounded-full border border-white/[.06]" />
      </div>

      <div className="relative mx-auto w-[min(1320px,100%-3rem)]">
        {banner && (
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#151b45] via-[#1a1f57] to-[#141a44] px-8 py-12 lg:pl-[30%]">
          <div aria-hidden className="absolute -left-16 top-[32%] hidden size-[360px] rounded-full bg-gradient-to-br from-[#7c5cf5] to-[#2a2a7a] lg:block" />
          <div aria-hidden className="absolute -left-24 top-[22%] hidden size-[520px] rounded-full border border-gold/40 lg:block" />
          <span aria-hidden className="absolute top-[34%] left-[19%] hidden size-3 rounded-full bg-gold shadow-[0_0_14px_4px_rgba(243,193,99,.6)] lg:block" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase">{t.eyebrow}</p>
              <h2 className="mt-3 text-[clamp(2rem,3.4vw,3rem)] font-bold leading-tight tracking-[-0.04em]">{t.headline1}{sp}<span className="bg-gradient-to-r from-[#c4b5fd] to-[#a78bfa] bg-clip-text text-transparent">{t.headline2}</span></h2>
              <p className="mt-4 text-[#b9c1d6]">{t.text}</p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-center">
              <Link href="/demo" className="btn-gold h-14 text-base">{t.cta} <ArrowRight size={18} aria-hidden /></Link>
              <p className="text-sm text-[#b9c1d6]">{t.note}</p>
            </div>
          </div>
        </div>
        )}

        <div className={clsx("grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[328fr_294fr_292fr_293fr_392fr] lg:gap-x-0", banner && "mt-16")}>
          <div className="col-span-2 lg:col-span-1 lg:border-r lg:border-white/10 lg:pr-8">
            <Logo surface="dark" height={38} />
            <p className="mt-6 text-lg font-semibold">{t.tagline}</p>
            <p className="mt-3 max-w-[250px] text-[15px] leading-relaxed text-[#b9c1d6]">{t.blurb}</p>
            <p className="mt-6 space-y-1 text-[15px] text-[#b9c1d6]"><a href={`mailto:${t.email}`} className="block hover:text-gold">{t.email}</a><a href={`tel:${t.phone.replace(/[^+\d]/g, "")}`} className="block hover:text-gold">{t.phone}</a></p>
            <div className="mt-6 flex gap-3">
              {socials.map((Icon, i) => <span key={t.social[i]} role="img" aria-label={t.social[i]} className="grid size-11 place-items-center rounded-full border border-white/15 text-white/80"><Icon size={16} aria-hidden /></span>)}
            </div>
          </div>
          {[t.groups[0], { title: t.disciplinesTitle, links: t.disciplines.map((d) => ({ label: d, href: "" })) }, t.groups[1]].map((g, i) => (
            <nav key={g.title} aria-label={g.title} className={i === 0 ? "lg:pl-[41px]" : undefined}>
              <h3 className="text-xs font-bold tracking-[0.2em] text-[#b9c1d6] uppercase">{g.title}</h3>
              <ul className="mt-5 space-y-4 text-[15px]">
                {g.links.map((l) => <li key={l.label}>{l.href ? <a href={l.href} className="text-white/90 hover:text-gold">{l.label}</a> : <span className="text-white/90">{l.label}</span>}</li>)}
              </ul>
            </nav>
          ))}
          <div className="col-span-2 lg:col-span-1 lg:border-l lg:border-white/10 lg:pl-[40px]">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[#b9c1d6] uppercase">{t.newsletter.title}</h3>
            <p className="mt-5 text-[15px] leading-relaxed text-[#b9c1d6]">{t.newsletter.text}</p>
            <form action={`mailto:${t.email}`} method="post" encType="text/plain" className="mt-5">
              <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-1.5 pl-5">
                <label className="sr-only" htmlFor="footer-email">{t.newsletter.placeholder}</label>
                <input id="footer-email" type="email" required placeholder={t.newsletter.placeholder} className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-white/50" />
                <button type="submit" aria-label={t.newsletter.submit} className="grid size-10 place-items-center rounded-full bg-[#7c6cff]"><ArrowRight size={16} aria-hidden /></button>
              </div>
              <label className="mt-4 flex items-start gap-3 text-[13px] leading-snug text-[#b9c1d6]"><input type="checkbox" required className="mt-0.5 size-5 shrink-0" />{t.newsletter.consent}</label>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-7 text-[15px] text-[#b9c1d6]">
          <p>© {new Date().getFullYear()} {t.rights}</p>
          <p className="inline-flex items-center gap-2"><Globe size={16} aria-hidden />{t.place}</p>
        </div>
      </div>
    </footer>
  );
}
