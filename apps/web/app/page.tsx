import type { Metadata } from "next";
import { Cta } from "@/components/landing/Cta";
import { EvidencePromise } from "@/components/landing/EvidencePromise";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SampleMarket } from "@/components/landing/SampleMarket";

export const metadata: Metadata = { title: "Clinix – Know why patients pick the clinic down the street" };

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <SampleMarket />
      <EvidencePromise />
      <Cta />
    </>
  );
}
