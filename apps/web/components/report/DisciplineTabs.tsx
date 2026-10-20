"use client";

import { useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { Crown, Users } from "lucide-react";
import { DISCIPLINE_LABELS, type Analysis, type Report } from "@clinix/contracts";
import { Sticker } from "@/components/onboarding/Sticker";
import { ActionStatus } from "@/components/report/ActionStatus";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { copy } from "@/lib/copy";
import { toneForLevel } from "@/lib/format";
import { median, positionOf, rankByReviews, rankWithin } from "@/lib/report";

/** The report, one discipline at a time: leader, demand, what holds you back, and that discipline's actions. */
export function DisciplineTabs({ report, analysis, clinicName, clinicId, analysisId }: { report: Report; analysis?: Analysis; clinicName?: string; clinicId: string; analysisId: string }) {
  const sections = report.disciplines;
  const [tab, setTab] = useState(sections[0]?.discipline ?? null);
  const active = sections.find((s) => s.discipline === tab) ?? sections[0];
  if (!active) return null;
  const claimOf = (id: string) => report.findings.find((f) => f.id === id)?.claim ?? id;
  const rivals = report.competitors.filter((c) => active.competitorPlaceIds.includes(c.placeId));
  const ranked = analysis ? rankWithin(rankByReviews(report, analysis, clinicName ?? "Your clinic"), active.competitorPlaceIds) : [];
  const { rank, of } = positionOf(ranked);
  const you = ranked.find((r) => r.isYou);
  const leaderRow = ranked.find((r) => !r.isYou && r.name === active.leader?.name) ?? ranked.filter((r) => !r.isYou)[0];
  const label = DISCIPLINE_LABELS[active.discipline];

  return (
    <div className="flex flex-col gap-5">
      {sections.length > 1 && (
        <div role="tablist" aria-label="Disciplines" className="flex flex-wrap gap-2">
          {sections.map((s) => {
            const on = s.discipline === active.discipline;
            return (
              <button key={s.discipline} role="tab" aria-selected={on} type="button" onClick={() => setTab(s.discipline)} className={clsx("inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium", on ? "border-primary bg-primary-soft text-primary" : "border-line bg-card text-muted hover:text-ink")}>
                <Sticker discipline={s.discipline} size={24} tilt={false} className="rounded-lg border-2" />
                {DISCIPLINE_LABELS[s.discipline]}
              </button>
            );
          })}
        </div>
      )}

      <div role="tabpanel" className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <Sticker discipline={active.discipline} size={48} />
          <div>
            <h2 className="text-xl font-semibold leading-tight">{DISCIPLINE_LABELS[active.discipline]}</h2>
            <p className="mt-1 text-muted">{active.summary}</p>
          </div>
        </div>

        {analysis && rivals.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Your position" value={`#${rank} of ${of}`} note="by Google reviews" />
            <Tile label="Competitors analyzed" value={String(rivals.length)} note={`in ${label.toLowerCase()}`} />
            <Tile label="Your reviews" value={(you?.reviewCount ?? 0).toLocaleString("en-CA")} note={`rival median ${median(rivals.map((r) => r.reviewCount ?? 0)).toLocaleString("en-CA")}`} />
            <Tile label="Your rating" value={you?.rating?.toFixed(1) ?? "–"} note={`rival median ${median(rivals.map((r) => r.rating ?? 0)).toFixed(1)}`} />
          </div>
        )}
        {analysis && rivals.length === 0 && <p className="text-sm text-muted">No competitor was analyzed for {label.toLowerCase()} in this report, so there is no ranking for it.</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-faint uppercase"><Crown size={14} aria-hidden /> {copy.disciplines.leader}</p>
            {active.leader ? (
              <>
                <p className="mt-2 text-lg font-semibold">{active.leader.name}</p>
                {leaderRow && <p className="font-mono text-xs text-muted tabular-nums">{leaderRow.reviewCount.toLocaleString("en-CA")} reviews · {leaderRow.rating?.toFixed(1) ?? "–"} rating{leaderRow.distanceKm !== undefined ? ` · ${leaderRow.distanceKm.toFixed(1)} km away` : ""}</p>}
                <p className="mt-1 text-sm text-muted">{active.leader.reason}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">{copy.disciplines.noLeader}</p>
            )}
          </Card>
          <Card className="p-5">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-faint uppercase"><Users size={14} aria-hidden /> {copy.disciplines.demand}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {active.patientDemand.map((d) => <li key={d}><Pill>{d}</Pill></li>)}
              {active.patientDemand.length === 0 && <li className="text-sm text-muted">{copy.disciplines.noDemand}</li>}
            </ul>
            <p className="mt-3 text-xs text-muted">{rivals.length} {copy.disciplines.rivalsRead}: {rivals.map((r) => r.name).join(", ") || "none"}</p>
          </Card>
        </div>

        {ranked.length > 1 && (
          <Card className="overflow-x-auto p-6">
            <h3 className="font-semibold">Clinics in {label.toLowerCase()}, by Google reviews</h3>
            <table className="mt-3 w-full text-sm">
              <thead><tr className="text-left text-xs font-semibold tracking-wide text-faint uppercase"><th className="py-2 pr-3">Clinic</th><th className="py-2 pr-3 text-right">Distance</th><th className="py-2 pr-3 text-right">Rating</th><th className="py-2 text-right">Reviews</th></tr></thead>
              <tbody>
                {ranked.map((r, i) => (
                  <tr key={r.placeId ?? "you"} className={clsx("border-t border-line", r.isYou && "bg-primary-soft font-medium")}>
                    <td className="py-2 pr-3"><span className="mr-2 font-mono text-xs text-faint">{i + 1}</span>{r.name}{r.isYou ? " (you)" : ""}{i === 0 && !r.isYou && <Pill tone="primary" className="ml-2">Leader</Pill>}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums">{r.isYou ? "–" : `${(r.distanceKm ?? 0).toFixed(1)} km`}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums">{r.rating?.toFixed(1) ?? "–"}</td>
                    <td className="py-2 text-right font-mono tabular-nums">{r.reviewCount.toLocaleString("en-CA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {rivals.some((r) => r.servicesNotOnYourSite.length > 0) && (
          <Card className="p-6">
            <h3 className="font-semibold">Offered by rivals, not by you</h3>
            <p className="mt-1 text-sm text-muted">Services on their websites that your site does not mention. Worth a look, not a mandate.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {rivals.filter((r) => r.servicesNotOnYourSite.length > 0).map((r) => (
                <li key={r.placeId} className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="font-medium">{r.name}:</span>{r.servicesNotOnYourSite.map((svc) => <Pill key={svc} tone="warning">{svc}</Pill>)}</li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="font-semibold">{copy.disciplines.holdingBack}</h3>
          <ul className="mt-3 space-y-3">
            {active.statements.map((s) => (
              <li key={s.text} className="rounded-xl border border-line bg-surface/60 p-4">
                <p className="text-sm leading-snug">{s.text}</p>
                <p className="mt-2 text-xs text-muted">
                  {copy.actions.basedOn} {s.findingIds.map((id, i) => (
                    <Link key={id} href={`/app/clinics/${clinicId}/findings`} className="font-medium text-primary">{claimOf(id).slice(0, 60)}{i < s.findingIds.length - 1 ? ", " : ""}</Link>
                  ))}
                </p>
              </li>
            ))}
            {active.statements.length === 0 && <li className="text-sm text-muted">{copy.disciplines.noStatements}</li>}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold">{copy.disciplines.actions}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {active.recommendations.map((r) => (
              <div key={r.id} className="rounded-xl border border-line p-4">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <Pill tone="primary">{copy.actions.horizon[r.horizon]}</Pill>
                  <Pill tone={toneForLevel(r.impact)}>{copy.actions.impact}: {r.impact}</Pill>
                  <Pill>{copy.actions.effort}: {r.effort}</Pill>
                </div>
                <p className="font-medium leading-snug">{r.title}</p>
                <p className="mt-1 text-sm text-muted">{r.rationale}</p>
                <p className="mt-2 text-sm"><span className="text-xs font-semibold tracking-wide text-faint uppercase">{copy.actions.firstStep}</span><br />{r.firstStep}</p>
                <ActionStatus clinicId={clinicId} analysisId={analysisId} recommendation={r} />
              </div>
            ))}
            {active.recommendations.length === 0 && <p className="text-sm text-muted">{copy.disciplines.noActions}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{note}</p>
    </Card>
  );
}
