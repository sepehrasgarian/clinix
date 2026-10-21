import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { DemoForm } from "@/components/demo/DemoForm";
import { BackToTop } from "@/components/landing/BackToTop";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { getLanding } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLanding()).demo.title };
}

export default async function DemoPage() {
  const t = (await getLanding()).demo;
  return (
    <>
      <Nav />
      <main className="relative isolate overflow-hidden bg-night pt-[88px] pb-24 text-white lg:pt-[96px]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,.22),transparent_60%)]" />
          <div className="absolute -left-[620px] top-[52%] size-[1000px] rounded-full" style={{ boxShadow: "inset 0 0 0 2px rgba(243,193,99,.45), inset 60px 0 140px rgba(243,193,99,.12)" }} />
          <span className="absolute top-[56%] left-[2%] size-3 rounded-full bg-gold shadow-[0_0_14px_4px_rgba(243,193,99,.6)]" />
          <div className="absolute -right-80 bottom-0 size-[760px] rounded-full bg-[#2a2a76]/40 blur-3xl" />
        </div>
        <div className="relative mx-auto grid w-[min(1400px,100%-3rem)] items-start gap-12 pt-14 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:pt-20 lg:pl-12">
          <div className="lg:pt-6">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-[11px] font-semibold tracking-[0.24em] text-white/80 uppercase"><span aria-hidden className="size-1.5 rounded-full bg-gold" />{t.eyebrow}</p>
            <h1 className="mt-9 text-[clamp(2.6rem,5.4vw,4.6rem)] font-bold leading-[1.04] tracking-[-0.045em]">{t.headline1}<br /><span className="bg-gradient-to-r from-[#f3c163] to-[#e9a97a] bg-clip-text text-transparent">{t.headline2}</span></h1>
            <p className="mt-8 max-w-xl text-[19px] leading-relaxed text-[#b9c1d6]">{t.text}</p>
            <ul className="mt-9 space-y-5">
              {t.points.map((p) => (
                <li key={p} className="flex items-center gap-4 text-lg"><span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-gold"><Check size={16} aria-hidden /></span>{p}</li>
              ))}
            </ul>
            <Link href="/app/clinics/clinic_demo/findings" className="mt-12 inline-flex items-center gap-2 text-lg font-semibold text-[#b7a8ff]">{t.sample} <ArrowRight size={18} aria-hidden /></Link>
          </div>
          <div className="lg:max-w-[760px]"><DemoForm /></div>
        </div>
      </main>
      <Footer banner={false} />
      <BackToTop />
    </>
  );
}
