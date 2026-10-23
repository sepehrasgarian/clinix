"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Clinic } from "@clinix/contracts";
import { AnalysisStatus } from "@/components/dashboard/AnalysisStatus";
import { CompetitorPanel } from "@/components/dashboard/CompetitorPanel";
import { ContextAction } from "@/components/dashboard/ContextAction";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HoldingBack, SinceLast } from "@/components/dashboard/Insights";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { MarketSnapshot } from "@/components/dashboard/MarketSnapshot";
import { Opportunities, ReportPreview } from "@/components/dashboard/Opportunities";
import { SetupDashboard } from "@/components/dashboard/SetupDashboard";
import { copy } from "@/lib/copy";
import { competitorRows, holdingBack, kpiList, marketSnapshot, sinceLastTime, topOpportunities, type Completed, type HeroState, type Opportunity } from "@/lib/dashboard";
import { formatDate } from "@/lib/format";
import { RecommendationDrawer } from "./RecommendationDrawer";

/** The dashboard for the four real states: no analysis, running, stopped, and a finished report. */
export function Dashboard({ clinic, hero, latest, refreshMs = 4000 }: { clinic: Clinic; hero: HeroState; latest: Completed | null; refreshMs?: number }) {
  const router = useRouter();
  const [open, setOpen] = useState<Opportunity | null>(null);
  const live = hero.kind === "processing";
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => router.refresh(), refreshMs);
    return () => clearInterval(id);
  }, [live, router, refreshMs]);

  const base = `/app/clinics/${clinic.id}`;
  const current = hero.kind === "none" ? null : hero.analysis;
  const rows = competitorRows(latest, current);
  const since = latest ? sinceLastTime(latest.report) : null;

  // Until the deep analysis has started, the owner is still setting up: scan, competitors, plan, payment.
  const settingUp = hero.kind === "none" || hero.kind === "setup" || hero.analysis.stage !== "deep";
  if (!latest && settingUp) return <SetupDashboard clinic={clinic} />;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader clinic={clinic} hero={hero} latest={latest} />

      {hero.kind !== "none" && hero.kind !== "completed" && <AnalysisStatus clinic={clinic} hero={hero} latest={latest} />}

      {latest ? (
        <>
          {hero.kind !== "completed" && <p className="text-[13px] text-muted">{copy.dashboard.latestCompleted} <span className="font-semibold text-ink">{formatDate(latest.report.generatedAt)}</span>.</p>}
          <KpiRow items={kpiList(latest, clinic.name)} />
          <div className="grid items-start gap-4 xl:grid-cols-[3fr_2fr]">
            <Opportunities items={topOpportunities(latest.report)} allHref={`${base}/actions`} onOpen={setOpen} />
            <MarketSnapshot snapshot={marketSnapshot(latest, clinic.name)} reportHref={`${base}/report`} />
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[3fr_2fr]">
            <CompetitorPanel rows={rows} href={`${base}/competitors`} fromReport />
            <div className="flex flex-col gap-4">
              <HoldingBack claims={holdingBack(latest.report)} href={`${base}/findings`} />
              {since && <SinceLast since={since} href={`${base}/compare`} />}
              <ContextAction hero={hero} base={base} />
            </div>
          </div>
        </>
      ) : (
        hero.kind !== "none" && hero.kind !== "setup" && (
          <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
            <CompetitorPanel rows={rows} href={`${base}/run/${hero.analysis.id}`} fromReport={false} />
            <ReportPreview />
          </div>
        )
      )}
      {open && latest && <RecommendationDrawer report={latest.report} rec={open.rec} index={open.index} clinicName={clinic.name} onClose={() => setOpen(null)} />}
    </div>
  );
}
