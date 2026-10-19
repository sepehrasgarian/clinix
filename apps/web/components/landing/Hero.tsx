import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { copy } from "@/lib/copy";

/** Dark hero: ink background, two soft glows, gold-to-violet headline, one button. */
export function Hero() {
  const t = copy.landing.hero;
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/40 blur-[120px]" />
        <div className="absolute top-40 -right-32 h-[380px] w-[380px] rounded-full bg-[#f5b942]/25 blur-[110px]" />
        <div className="absolute -bottom-24 -left-24 h-[320px] w-[320px] rounded-full bg-[#7c3aed]/30 blur-[100px]" />
      </div>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="inline-block size-6 rounded-md bg-gradient-to-br from-[#f5b942] to-[#7c3aed]" /> Clinix
        </span>
        <Link href="/start" className="min-h-10 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
          {t.navCta}
        </Link>
      </nav>
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center md:pt-24 md:pb-32">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">{t.eyebrow}</p>
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          <span className="bg-gradient-to-r from-[#f5b942] via-[#f0a6c8] to-[#a78bfa] bg-clip-text text-transparent">{t.headline}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">{t.sub}</p>
        <div className="mt-9 flex flex-col items-center gap-3">
          <Link href="/start" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-ink shadow-lg shadow-primary/30 hover:bg-white/90">
            {t.cta} <ArrowRight size={18} aria-hidden />
          </Link>
          <p className="text-sm text-white/60">{t.trust}</p>
        </div>
      </div>
    </section>
  );
}
