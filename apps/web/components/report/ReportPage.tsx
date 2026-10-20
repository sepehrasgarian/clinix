"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Printer } from "lucide-react";
import { DISCIPLINE_LABELS, type Analysis, type Clinic, type Recommendation, type Report } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { ActionPlan } from "./ActionPlan";
import { CompetitorsSection } from "./CompetitorsSection";
import { DisciplineTabs } from "./DisciplineTabs";
import { MonthOverMonth } from "./MonthOverMonth";
import { Overview } from "./Overview";
import { RecommendationDrawer } from "./RecommendationDrawer";
import { SectionHeading, SectionMenu } from "./SectionMenu";

/** The report: one long page, numbered sections, a sticky menu, and a drawer for any recommendation. */
export function ReportPage({ clinic, analysis, report, inProgress }: { clinic: Clinic; analysis: Analysis; report: Report; inProgress: Analysis | null }) {
  const [drawer, setDrawer] = useState<{ rec: Recommendation; index: number } | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const sections = [
    { id: "overview", label: "Overview" },
    { id: "changes", label: "Month over month" },
    ...(report.disciplines.length > 0 ? [{ id: "disciplines", label: "Disciplines" }] : []),
    { id: "competitors", label: "Competitors" },
    { id: "plan", label: "Action plan" },
  ];
  const status = inProgress ? (inProgress.status === "awaiting_competitors" || inProgress.status === "awaiting_services" ? "Previous report · new analysis awaiting you" : "Previous report · new analysis in progress") : "Latest completed report";

  return (
    <div className="mx-auto max-w-6xl">
      <Link href={`/app/clinics/${clinic.id}`} className="inline-flex min-h-9 items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={14} aria-hidden /> Back to dashboard</Link>
      <header className="mt-2 mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-faint uppercase">Marketing intelligence report</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{clinic.name}</h1>
        <p className="mt-1 text-sm text-muted">Generated {formatDate(report.generatedAt)} · {report.competitors.length} competitors analyzed · {clinic.disciplines.map((d) => DISCIPLINE_LABELS[d]).join(", ")}</p>
        <span className="mt-2 inline-flex rounded-full border border-line bg-card px-2.5 py-0.5 text-xs text-muted">{status}</span>
        </div>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-medium hover:bg-surface print:hidden">
          <Printer size={16} aria-hidden /> Download PDF
        </button>
      </header>

      <SectionMenu sections={sections} />

      <section id="overview" className="scroll-mt-16 py-8">
        <SectionHeading number="01" label="Executive overview" title="Where your clinic stands" />
        <Overview report={report} analysis={analysis} clinicId={clinic.id} clinicName={clinic.name} opened={clinic.opened} area={clinic.city} onOpen={(rec, index) => setDrawer({ rec, index })} />
      </section>

      <section id="changes" className="scroll-mt-16 py-8">
        <SectionHeading number="02" label="Month over month" title="What changed since last time" />
        <MonthOverMonth report={report} />
      </section>

      {report.disciplines.length > 0 && (
        <section id="disciplines" className="scroll-mt-16 py-8">
          <SectionHeading number="03" label="Disciplines" title="Where you stand in each discipline" intro="Each discipline is compared with its own competitors, never one blended ranking." />
          <DisciplineTabs report={report} analysis={analysis} clinicName={clinic.name} clinicId={clinic.id} analysisId={analysis.id} />
        </section>
      )}

      <section id="competitors" className="scroll-mt-16 py-8">
        <SectionHeading number={report.disciplines.length > 0 ? "04" : "03"} label="Competitors" title={`${report.competitors.length} clinics competing for your patients`} intro="Open a clinic for what its patients say, one of its reviews and its website." />
        <CompetitorsSection report={report} disciplines={clinic.disciplines} />
      </section>

      <section id="plan" className="scroll-mt-16 py-8">
        <SectionHeading number={report.disciplines.length > 0 ? "05" : "04"} label="Action plan" title="What to do, and when" intro="Work top to bottom; your next report shows what changed." />
        <ActionPlan report={report} clinicId={clinic.id} analysisId={analysis.id} clinicName={clinic.name} onOpen={(rec, index) => setDrawer({ rec, index })} />
      </section>

      <Card className="mt-4 p-5">
        <button type="button" onClick={() => setMethodOpen((v) => !v)} aria-expanded={methodOpen} className="flex w-full items-center justify-between text-left font-semibold">
          How this report was made <ChevronDown size={16} aria-hidden className={methodOpen ? "rotate-180" : ""} />
        </button>
        {methodOpen && (
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p><span className="font-medium text-ink">Data.</span> Public Google listings and recent patient reviews for your clinic and the {report.competitors.length} competitors you confirmed, plus your own website. Reviewer names and photos are never stored.</p>
            <p><span className="font-medium text-ink">Findings.</span> {report.ledger.proposed} findings were proposed; {report.ledger.kept} are in this report. Each one quotes at least two different reviews, checked word for word against the stored text. {report.ledger.rejected} were set aside for weak evidence and are listed on the findings page.</p>
            <p><span className="font-medium text-ink">Recommendations.</span> Every action cites the findings it rests on. Pricing is never recommended as a lever.</p>
          </div>
        )}
        <p className="mt-3 text-xs text-faint">Report generated {new Date(report.generatedAt).toLocaleString("en-CA")}</p>
      </Card>

      {drawer && <RecommendationDrawer report={report} rec={drawer.rec} index={drawer.index} clinicName={clinic.name} onClose={() => setDrawer(null)} />}
    </div>
  );
}
