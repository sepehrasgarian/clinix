import type { Metadata } from "next";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { ContactForm } from "@/components/contact/ContactForm";
import { BackToTop } from "@/components/landing/BackToTop";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { getLanding } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getLanding()).contact;
  return { title: t.title, description: t.sub };
}

export default async function ContactPage() {
  const t = (await getLanding()).contact;
  return (
    <>
      <Nav />
      <main className="bg-surface">
        <section className="relative isolate overflow-hidden bg-night pt-[138px] pb-[176px] text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_88%_12%,rgba(79,70,229,.3),transparent_55%)]" />
          <div className="relative mx-auto w-[min(1180px,100%-48px)] pt-[96px]">
            <p className="text-[12.5px] font-bold tracking-[0.3em] text-gold uppercase">{t.eyebrow}</p>
            <h1 className="mt-5 text-[clamp(38px,4.45vw,67px)] leading-[1.05] font-bold tracking-[-0.045em]">{t.headline}</h1>
            <p className="mt-5 max-w-[720px] text-[18px] text-[#b9c1d6]">{t.sub}</p>
          </div>
        </section>
        <div className="relative z-10 mx-auto -mt-[128px] grid w-[min(1180px,100%-48px)] items-start gap-8 pb-[97px] lg:grid-cols-[1.67fr_1fr]">
          <ContactForm />
          <ContactDetails />
        </div>
      </main>
      <Footer banner={false} />
      <BackToTop />
    </>
  );
}
