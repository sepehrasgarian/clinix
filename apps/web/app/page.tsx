import { AnalysisPreview } from "@/components/landing/AnalysisPreview";
import { BackToTop } from "@/components/landing/BackToTop";
import { CaseSnapshots } from "@/components/landing/CaseSnapshots";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Nav } from "@/components/landing/Nav";
import { Pricing } from "@/components/landing/Pricing";
import { Stats } from "@/components/landing/Stats";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <AnalysisPreview />
        <HowItWorks />
        <Stats />
        <CaseSnapshots />
        <Pricing />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
