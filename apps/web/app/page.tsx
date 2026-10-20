import type { Metadata } from "next";
import { AnalysisPreview } from "@/components/landing/AnalysisPreview";
import { Cta } from "@/components/landing/Cta";
import { EvidencePromise } from "@/components/landing/EvidencePromise";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";

export const metadata: Metadata = { title: "ClinX – Know why patients pick the clinic down the street" };

export default function HomePage() {
  return (
    <>
      <Hero />
      <AnalysisPreview />
      <HowItWorks />
      <EvidencePromise />
      <Cta />
    </>
  );
}
