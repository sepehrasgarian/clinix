"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { DISCIPLINE_LABELS, type Analysis, type Clinic, type Recommendation, type Report } from "@clinix/contracts";
import { Sticker } from "@/components/onboarding/Sticker";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatDate, toneForLevel } from "@/lib/format";
import { nextMoves, positionOf, rankByReviews } from "@/lib/report";
import { ActionCheck } from "./ActionCheck";
import { RecommendationDrawer } from "./RecommendationDrawer";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/** The dashboard after the first report: scoreboard, your 3 moves, where you stand, issues by discipline. */
export function Dashboard({ clinic, analysis, report }: { clinic: Clinic; analysis: Analysis; report: Report }) {
  const [drawer, setDrawer] = useState<{ rec: Recommendation; index: number } | null>(null);
  const ranked = rankByReviews(report, analysis, clinic.name);
  const { rank, of } = positionOf(ranked);
  const you = ranked.find((r) => r.isYou)!;
  const rivalMedian = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  };
  const medianRating = rivalMedian(report.competitors.map((c) => c.rating ?? 0));
  const medianReviews = rivalMedian(report.competitors.map((c) => c.reviewCount ?? 0));
  const moves = nextMoves(report);
  const open = report.recommendations.filter((r) => r.status !== "done");
  const high = open.filter((r) => r.impact === "high").length;
  const base = `/app/clinics/${clinic.id}`;
  const [tab, setTab] = useState<"clinic" | string>("clinic");
  const section = report.disciplines.find((d) => d.discipline === tab);
  const nearest = ranked.slice(0, 6);
  const maxReviews = Math.max(1, ...nearest.map((r) => r.reviewCount));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{greeting()}</h1>
        <p className="text-sm text-muted">Latest report {formatDate(report.generatedAt)} · {clinic.name}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted">Review position</p><p className="font-mono text-3xl font-semibold tabular-nums">#{rank}</p><p className="text-xs text-muted">of {of} nearby</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Google rating</p><p className="font-mono text-3xl font-semibold tabular-nums">{you.rating?.toFixed(1) ?? "–"}</p><p className="text-xs text-muted">Rival median {medianRating.toFixed(1)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Google reviews</p><p className="font-mono text-3xl font-semibold tabular-nums">{you.reviewCount.toLocaleString("en-CA")}</p><p className="text-xs text-muted">{report.diff ? `${report.diff.reviewCountDelta >= 0 ? "+" : ""}${report.diff.reviewCountDelta} since last report · ` : ""}Rival median {medianReviews.toLocaleString("en-CA")}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Actions to take</p><p className="font-mono text-3xl font-semibold tabular-nums">{open.length}</p><p className="text-xs text-muted">{high} high priority</p></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <Card className="p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Your 3 moves</h2>
            <Link href={`${base}/actions`} className="inline-flex items-center gap-1 text-sm font-medium text-primary">All {report.recommendations.length} actions <ArrowRight size={14} aria-hidden /></Link>
          </div>
          <p className="text-sm text-muted">{moves.length ? "Picked for this month. Tick one off and the next takes its place." : "No open action. Run a new analysis to see what to do next."}</p>
          <ol className="mt-4 space-y-4">
            {moves.map((r) => (
              <li key={r.id} className="flex items-start gap-3">
                <div className="pt-0.5"><ActionCheck clinicId={clinic.id} analysisId={analysis.id} recommendation={r} /></div>
                <div className="min-w-0">
                  <button type="button" onClick={() => setDrawer({ rec: r, index: report.recommendations.indexOf(r) + 1 })} className="text-left font-medium leading-snug hover:text-primary">{r.title}</button>
                  <div className="mt-1 flex flex-wrap gap-1.5"><Pill tone={toneForLevel(r.impact)}>{r.impact} impact</Pill><Pill>{r.effort} effort</Pill></div>
                  <p className="mt-1.5 text-sm text-muted"><span className="font-medium text-ink">Start here:</span> {r.firstStep}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Where you stand</h2>
          <p className="text-sm text-muted">Your market visibility, by Google reviews.</p>
          <ul className="mt-4 space-y-2.5">
            {nearest.map((r) => (
              <li key={r.placeId ?? "you"} className="text-sm">
                <div className="flex justify-between gap-2"><span className={clsx("truncate", r.isYou && "font-semibold text-primary")}>{r.isYou ? "You" : r.name}</span><span className="font-mono text-xs tabular-nums">{r.reviewCount.toLocaleString("en-CA")}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface"><div className={clsx("h-full rounded-full", r.isYou ? "bg-primary" : "bg-faint/50")} style={{ width: `${(r.reviewCount / maxReviews) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">Measured by Google review count, the first thing patients compare in Maps.</p>
          <Link href={`${base}/report`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">Open the full report <ArrowRight size={14} aria-hidden /></Link>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Issues and ideas by discipline</h2>
        <p className="text-sm text-muted">Advice for the whole clinic, and for each discipline against its own rivals.</p>
        <div role="tablist" aria-label="Scope" className="mt-4 flex flex-wrap gap-2">
          <button role="tab" aria-selected={tab === "clinic"} type="button" onClick={() => setTab("clinic")} className={clsx("min-h-10 rounded-full border px-3 text-sm font-medium", tab === "clinic" ? "border-primary bg-primary-soft text-primary" : "border-line bg-card text-muted")}>Whole clinic</button>
          {report.disciplines.map((d) => (
            <button key={d.discipline} role="tab" aria-selected={tab === d.discipline} type="button" onClick={() => setTab(d.discipline)} className={clsx("inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium", tab === d.discipline ? "border-primary bg-primary-soft text-primary" : "border-line bg-card text-muted")}>
              <Sticker discipline={d.discipline} size={22} tilt={false} className="rounded-lg border-2" />{DISCIPLINE_LABELS[d.discipline]} <span className="font-mono text-xs opacity-70">{d.statements.length}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-faint uppercase">What&apos;s holding you back</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {(section ? section.statements.map((s) => s.text) : report.findings.filter((f) => f.status === "kept" && f.competitorPlaceId === null && (f.kind === "weakness" || f.kind === "admin_friction" || f.kind === "access")).slice(0, 4).map((f) => f.claim)).map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-alert" />{t}</li>
              ))}
              {(section ? section.statements.length === 0 : report.findings.filter((f) => f.competitorPlaceId === null && f.kind !== "strength").length === 0) && <li className="text-muted">Nothing stands out against your rivals here.</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-faint uppercase">Ideas</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {(section ? section.recommendations : open).slice(0, 4).map((r) => (
                <li key={r.id} className="flex gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /><button type="button" onClick={() => setDrawer({ rec: r, index: 0 })} className="text-left hover:text-primary">{r.title}</button></li>
              ))}
            </ul>
            <Link href={section ? `${base}/disciplines` : `${base}/actions`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">View all <ArrowRight size={14} aria-hidden /></Link>
          </div>
        </div>
      </Card>

      {drawer && <RecommendationDrawer report={report} rec={drawer.rec} index={drawer.index || 1} clinicName={clinic.name} onClose={() => setDrawer(null)} />}
    </div>
  );
}
