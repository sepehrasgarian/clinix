import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { copy } from "@/lib/copy";

export function Cta() {
  const t = copy.landing.cta;
  return (
    <section className="bg-ink py-20 text-center text-white">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-semibold tracking-tight">{t.title}</h2>
        <p className="mt-3 text-white/70">{t.text}</p>
        <Link href="/start" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-ink hover:bg-white/90">
          {copy.landing.hero.cta} <ArrowRight size={18} aria-hidden />
        </Link>
        <p className="mt-10 text-xs text-white/40">© {new Date().getFullYear()} Clinix</p>
      </div>
    </section>
  );
}
