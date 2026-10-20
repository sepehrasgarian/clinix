"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardList, Layers, RotateCw, ShieldCheck, Sparkles } from "lucide-react";
import { primaryDiscipline, type Analysis, type Clinic } from "@clinix/contracts";
import { PhaseTimeline } from "@/components/onboarding/PhaseTimeline";
import { Sticker } from "@/components/onboarding/Sticker";
import { WaitingRadar } from "@/components/onboarding/WaitingRadar";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { copy } from "@/lib/copy";
import { formatKm } from "@/lib/format";
import { retryAnalysis } from "@/lib/api";

const deliverables = [
  { icon: ShieldCheck, title: "Findings with evidence", text: "Every finding quotes at least two reviews, checked word for word." },
  { icon: Sparkles, title: "Your scorecard", text: "Seven measured dimensions against the rivals you chose." },
  { icon: ClipboardList, title: "A ranked action plan", text: "What to do first, with the first step for each action." },
  { icon: Layers, title: "One section per discipline", text: "Who leads each discipline locally and what to do there." },
];

function elapsedSince(iso?: string): string {
  if (!iso) return "";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** The "Your report" step: live progress of the deep analysis, who is being read, and what comes out. */
export function RunView({ clinic, analysis, onRefresh }: { clinic: Clinic; analysis: Analysis; onRefresh: () => void }) {
  const done = analysis.status === "succeeded";
  const failed = analysis.status === "failed";
  const running = !done && !failed;
  const [, tick] = useState(0);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const phasesDone = analysis.phases.filter((p) => p.status === "done").length;
  const pct = Math.round((phasesDone / Math.max(1, analysis.phases.length)) * 100);
  const startedAt = analysis.phases.find((p) => p.startedAt)?.startedAt;
  const chosen = analysis.discovery?.candidates.filter((c) => analysis.discovery!.selectedPlaceIds.includes(c.place.placeId)) ?? [];

  const retry = async () => {
    setRetrying(true);
    try {
      await retryAnalysis(clinic.id, analysis.id);
      onRefresh();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">{clinic.disciplines.slice(0, 3).map((d) => <Sticker key={d} discipline={d} size={40} />)}</div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{done ? copy.onboarding.run.done : copy.onboarding.run.title}</h1>
            <p className="text-muted">{done ? clinic.name : copy.onboarding.run.intro}</p>
          </div>
        </div>
        {done && (
          <Link href={`/app/clinics/${clinic.id}/findings`} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(67,56,202,.8)]">
            {copy.onboarding.run.open} <span aria-hidden>→</span>
          </Link>
        )}
      </header>

      {failed && (
        <Card className="border-alert/30 bg-alert-soft p-5" role="alert">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-alert text-white"><AlertTriangle size={16} aria-hidden /></span>
            <div className="flex-1">
              <p className="font-semibold text-alert">{copy.onboarding.scanning.failed}</p>
              <p className="mt-0.5 text-sm">{analysis.error}</p>
              <button type="button" onClick={retry} disabled={retrying} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50">
                <RotateCw size={16} aria-hidden className={retrying ? "animate-spin" : ""} /> {retrying ? "Retrying…" : copy.onboarding.scanning.retry}
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative grid size-28 shrink-0 place-items-center" aria-hidden>
                <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-line)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={done ? "var(--color-success)" : "var(--color-primary)"} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 97.4} 97.4`} className="transition-[stroke-dasharray] duration-700" />
                </svg>
                <div className="text-center">
                  <p className="font-mono text-2xl font-semibold tabular-nums">{pct}%</p>
                  <p className="text-[11px] text-muted">{phasesDone}/{analysis.phases.length} steps</p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                {running ? (
                  <WaitingRadar stage={analysis.stage} clinicName={clinic.name} compact />
                ) : done ? (
                  <p className="text-lg font-medium">Your report is ready. Every finding in it is backed by reviews we checked word for word.</p>
                ) : (
                  <p className="text-muted">Nothing is running. Press retry to continue.</p>
                )}
                {running && startedAt && <p className="mt-3 font-mono text-xs text-faint tabular-nums">running for {elapsedSince(startedAt)}</p>}
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <PhaseTimeline phases={analysis.phases} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-semibold">Who we are reading</h2>
            <p className="mt-0.5 text-xs text-muted">{chosen.length} competitors you confirmed, plus your own reviews.</p>
            <ul className="mt-3 divide-y divide-line">
              {chosen.map((c) => (
                <li key={c.place.placeId} className="flex items-center gap-3 py-2.5">
                  <Sticker discipline={primaryDiscipline(c.disciplines, clinic.disciplines)} size={28} tilt={false} className="rounded-lg border-2" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.place.name}</p>
                    <p className="text-xs text-muted">{formatKm(c.distanceKm)} {copy.competitors.distance}</p>
                  </div>
                  {c.place.rating !== undefined && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted"><Stars rating={c.place.rating} size={11} /> {c.place.reviewCount}</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">What you will get</h2>
            <ul className="mt-3 space-y-3">
              {deliverables.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Icon size={16} aria-hidden /></span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
