import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { copy } from "@/lib/copy";

export function Cta() {
  const t = copy.landing.cta;
  return (
    <section className="bg-[#0b0f1f] py-20 text-center text-white">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-semibold tracking-tight">{t.title}</h2>
        <p className="mt-3 text-white/70">{t.text}</p>
        <Link href="/start" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5b942] px-6 text-base font-semibold text-[#0b0f1f] hover:bg-[#f7c55e]">
          {copy.landing.hero.cta} <ArrowRight size={18} aria-hidden />
        </Link>
        <div className="mt-12 flex flex-col items-center gap-3">
          <Logo surface="dark" height={22} />
          <p className="text-xs text-white/40">© {new Date().getFullYear()} ClinX</p>
        </div>
      </div>
    </section>
  );
}
