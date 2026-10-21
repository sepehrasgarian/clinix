import type { Metadata } from "next";
import { BackToTop } from "@/components/landing/BackToTop";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { CompareTable } from "@/components/pricing/CompareTable";
import { PlanFinder } from "@/components/pricing/PlanFinder";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { getLanding } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getLanding()).pricingPage;
  return { title: t.title, description: t.sub };
}

export default async function PricingPage() {
  const t = (await getLanding()).pricingPage;
  return (
    <>
      <Nav />
      <main className="relative overflow-hidden bg-[#fafbfe] pt-[88px] pb-[clamp(4.5rem,7vw,6.5rem)] lg:pt-[96px]">
        <div aria-hidden className="pointer-events-none absolute -left-72 top-40 size-[640px] rounded-full border border-[#e3e6f2]" />
        <div aria-hidden className="pointer-events-none absolute -right-72 top-10 size-[640px] rounded-full border border-[#f1e6d2]" />
        <div className="relative mx-auto w-[min(1040px,100%-3rem)]">
          <header className="pt-14 text-center lg:pt-16">
            <p className="text-xs font-bold tracking-[0.3em] text-[#3730a3] uppercase">{t.eyebrow}</p>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-[1.05] tracking-[-0.045em]">{t.headline1}<br /><span className="bg-gradient-to-r from-[#f3b94a] via-[#c06bc0] to-[#5b5cf0] bg-clip-text text-transparent">{t.headline2}</span></h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-grey">{t.sub}</p>
          </header>
          <PricingPlans />
        </div>
        <div className="relative mt-24"><PlanFinder /></div>
        <div className="relative mt-24"><CompareTable /></div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
