import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HeroState } from "@/lib/dashboard";

const primary = "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#5146e5] px-5 text-sm font-semibold text-white hover:bg-[#4338ca]";

/** One next step that follows where the account really is. It never repeats an upsell: with a fresh report it points at the report. */
export function ContextAction({ hero, base }: { hero: HeroState; base: string }) {
  const content = hero.kind === "processing"
    ? { title: "Your analysis is underway", text: "A newer analysis is running. Your latest report stays available meanwhile.", label: "View progress", href: `${base}/run/${hero.analysis.id}` }
    : hero.kind === "failed"
      ? { title: "Your latest analysis needs attention", text: "The steps that finished are saved. Open it to retry.", label: "Resume or retry", href: `${base}/run/${hero.analysis.id}` }
      : { title: "Your latest report is ready", text: "Explore the evidence, benchmarks, and recommendations behind your latest analysis.", label: "Explore your report", href: `${base}/report` };
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-[16px] border border-[#e6e4ff] bg-[#f7f6ff] p-5" aria-labelledby="context-title">
      <div className="min-w-0 flex-1 basis-48"><h2 id="context-title" className="text-[15px] font-bold text-[#111b35]">{content.title}</h2><p className="mt-0.5 text-[13px] text-muted">{content.text}</p></div>
      <Link href={content.href} className={primary}>{content.label} <ArrowRight size={15} aria-hidden /></Link>
    </section>
  );
}
