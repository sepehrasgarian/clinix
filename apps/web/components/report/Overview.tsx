"use client";

import { useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Analysis, Recommendation, Report } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { copy } from "@/lib/copy";
import { toneForLevel, scoreTone } from "@/lib/format";
import { isNewClinic, nextMoves, positionOf, rankByReviews, takeaways } from "@/lib/report";
import { ActionCheck } from "./ActionCheck";
import { ReviewGoal } from "./ReviewGoal";

const fill = { success: "bg-success", warning: "bg-warning", alert: "bg-alert", neutral: "bg-faint", primary: "bg-primary" };

/** 01 Overview: position card, four tiles, next 3 moves, key takeaways, benchmark table. */
export function Overview({ report, analysis, clinicId, clinicName, opened, area = "your area", onOpen }: { report: Report; analysis: Analysis; clinicId: string; clinicName: string; opened?: string; area?: string; onOpen?: (rec: Recommendation, index: number) => void }) {
  const ranked = rankByReviews(report, analysis, clinicName);
  const { rank, of } = positionOf(ranked);
  const leader = ranked[0];
  const moves = nextMoves(report);
  const done = report.recommendations.filter((r) => r.status === "done").length;
  const highPriority = report.recommendations.filter((r) => r.impact === "high" && r.status !== "done").length;
  const { strongest, weakest } = takeaways(report);
  const maxReviews = Math.max(1, ...ranked.map((r) => r.reviewCount));
  const [showAll, setShowAll] = useState(false);
  const shown = showAll || ranked.length <= 6 ? ranked : ranked.filter((r, i) => i < 3 || r.isYou || i === rank - 2);

  const tiles = [
    { label: "Competitors analyzed", value: String(report.competitors.length), note: `Within ${Math.max(...report.competitors.map((c) => c.distanceKm), 0).toFixed(0)} km of your clinic`, href: "#competitors", link: "See competitors" },
    { label: "Recommendations", value: String(report.recommendations.length), note: "In your action plan", href: "#plan", link: "Open the plan" },
    { label: "High priority", value: String(highPriority), note: "Start with these", href: "#plan", link: "See what to do first" },
    { label: "Benchmark standing", value: String(report.scorecard.overall), note: `Average of the ${report.scorecard.dimensions.length} scores below`, href: "#benchmark", link: "See how it's measured" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
      <Card className="p-6">
        <p className="text-xs font-semibold tracking-wide text-faint uppercase">Your position</p>
        <p className="mt-2 text-xl font-semibold leading-snug">
          {rank === 1 ? `You lead your area by Google reviews, ahead of ${of - 1} local competitors.` : `${leader.name} leads with ${leader.reviewCount.toLocaleString("en-CA")} reviews; you rank #${rank} of ${of}.`}
        </p>
        <p className="mt-1 text-sm text-muted">Measured by Google review count among the competitors you chose, the first thing patients compare in Maps.</p>
        <ol className="mt-4 space-y-1.5">
          {shown.map((r) => {
            const i = ranked.indexOf(r);
            return (
            <li key={r.placeId ?? "you"} className={clsx("grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 rounded-lg px-2 py-1 text-sm", r.isYou && "bg-primary-soft font-medium")}>
              <span className="font-mono text-xs text-faint">{i + 1}</span>
              <span className="min-w-0">
                <span className="block truncate">{r.name}{r.isYou ? " (you)" : ""}</span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface"><span className={clsx("block h-full rounded-full", r.isYou ? "bg-primary" : "bg-faint/60")} style={{ width: `${(r.reviewCount / maxReviews) * 100}%` }} /></span>
              </span>
              <span className="font-mono text-xs tabular-nums">{r.reviewCount.toLocaleString("en-CA")}</span>
            </li>
            );
          })}
        </ol>
        {ranked.length > 6 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 min-h-9 text-sm font-medium text-primary">{showAll ? "Show fewer" : `Show all ${ranked.length}`}</button>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Card key={t.label} className="flex flex-col p-4">
            <p className="text-xs text-muted">{t.label}</p>
            <p className="font-mono text-3xl font-semibold tabular-nums">{t.value}</p>
            <p className="text-xs text-muted">{t.note}</p>
            <a href={t.href} className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary">{t.link} <ArrowRight size={12} aria-hidden /></a>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-semibold">{copy.dashboard.nextMoves}</h3>
            <p className="text-sm text-muted">Do these first. Tick one off and the next takes its place.</p>
          </div>
          <span className="font-mono text-xs text-muted tabular-nums">{done} of {report.recommendations.length} done</span>
        </div>
        {moves.length ? (
          <ol className="mt-4 space-y-3">
            {moves.map((r) => (
              <li key={r.id} className="flex items-start gap-3">
                <div className="pt-0.5"><ActionCheck clinicId={clinicId} analysisId={analysis.id} recommendation={r} /></div>
                <div className="min-w-0">
                  <button type="button" onClick={() => onOpen?.(r, report.recommendations.indexOf(r) + 1)} className="text-left font-medium leading-snug hover:text-primary">{r.title}</button>
                  <p className="mt-0.5 text-sm text-muted"><span className="font-medium text-ink">Start here:</span> {r.firstStep}</p>
                  <span className={clsx("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px]", { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", neutral: "bg-surface text-muted", alert: "", primary: "" }[toneForLevel(r.impact)])}>{r.impact} impact · {r.effort} effort</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-muted">Every action in this report is done. Run a new analysis to see what has changed and what to do next.</p>
        )}
        <a href="#plan" className="mt-4 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-primary">View all {report.recommendations.length} recommendations <ArrowRight size={14} aria-hidden /></a>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold">Key takeaways</h3>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-success" /><span><span className="font-medium">Strongest area, {strongest.label.toLowerCase()}:</span> {strongest.summary}</span></li>
          <li className="flex gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-alert" /><span><span className="font-medium">Biggest gap, {weakest.label.toLowerCase()}:</span> {weakest.summary}</span></li>
          <li className="flex gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /><span>{report.summary}</span></li>
        </ul>
        <Link href={`/app/clinics/${clinicId}/findings`} className="mt-4 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-primary">{report.ledger.kept} findings, {report.ledger.rejected} set aside <ArrowRight size={14} aria-hidden /></Link>
      </Card>

      <div className="lg:col-span-2"><ReviewGoal ranked={ranked} area={area} newClinic={isNewClinic(opened)} /></div>

      <Card id="benchmark" className="p-6 lg:col-span-2">
        <h3 className="font-semibold">Benchmark</h3>
        <p className="text-sm text-muted">{report.scorecard.summary}</p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-faint uppercase"><th className="py-2 font-semibold">Measure</th><th className="py-2 font-semibold">Where you stand</th><th className="w-1/3 py-2 text-right font-semibold">Score</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {report.scorecard.dimensions.map((d) => (
              <tr key={d.key}>
                <td className="py-2.5 pr-4 font-medium">{d.label}</td>
                <td className="py-2.5 pr-4 text-muted">{d.summary}</td>
                <td className="py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    <span className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-surface"><span className={clsx("block h-full rounded-full", fill[scoreTone(d.score)])} style={{ width: `${d.score}%` }} /></span>
                    <span className="w-8 text-right font-mono tabular-nums">{d.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
