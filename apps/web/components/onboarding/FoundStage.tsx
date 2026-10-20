"use client";

import { useState } from "react";
import { ArrowRight, Building2, MessageSquare, Star, TrendingDown, TrendingUp, X } from "lucide-react";
import type { Analysis, Discipline } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Pill";
import { copy } from "@/lib/copy";
import { ListingCard } from "./ListingCard";
import { PrimaryButton, SetupFrame } from "./SetupFrame";
import { Sticker } from "./Sticker";

const hintTone = { review_gap: "alert", rating_gap: "alert", rating_strength: "success", no_website: "alert", crowded_market: "warning" } as const;

/** Step 2 of 4: the market overview, what stands out, and the editable service list (checkpoint 1). */
export function FoundStage({
  analysis,
  disciplines = [],
  onContinue,
  busy,
  guest = false,
  onCreateAccount,
  onBack,
}: {
  analysis: Analysis;
  disciplines?: Discipline[];
  onContinue: (services: string[]) => void;
  busy?: boolean;
  guest?: boolean;
  onCreateAccount?: () => void;
  onBack?: () => void;
}) {
  const scan = analysis.scan!;
  const [services, setServices] = useState(scan.understanding.services.slice(0, 12));
  const [draft, setDraft] = useState("");
  const counts = [...scan.competitorCountsPerService].sort((a, b) => b.count - a.count);
  const nearby = Math.max(0, ...counts.map((c) => c.count));
  const maxCount = Math.max(1, nearby);
  const ratingHint = scan.hints.find((h) => h.kind === "rating_gap" || h.kind === "rating_strength");
  const avgMatch = ratingHint?.text.match(/average of ([\d.]+)/);
  const localAvg = avgMatch ? Number(avgMatch[1]) : undefined;
  const ratingDelta = scan.place.rating !== undefined && localAvg !== undefined ? Math.round((scan.place.rating - localAvg) * 10) / 10 : undefined;
  const leaderHint = scan.hints.find((h) => h.kind === "review_gap");
  const leaderCount = leaderHint?.text.match(/has ([\d,]+) reviews/)?.[1];

  const add = () => {
    const s = draft.trim();
    if (s && !services.includes(s) && services.length < 12) setServices([...services, s]);
    setDraft("");
  };

  const aside = (
    <>
      <ListingCard place={scan.place} services={[]} />
      <Card className="p-5">
        <h2 className="font-semibold">Next: choose your competitors</h2>
        <p className="mt-1 text-sm text-muted">We search within 2, 5 and 15 km and rank who really competes for your patients. You keep or swap up to five per discipline before we read their reviews.</p>
        <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">Step 3 of 4 <ArrowRight size={14} aria-hidden /></p>
      </Card>
    </>
  );

  return (
    <SetupFrame
      step={2}
      back={{ label: copy.onboarding.steps[0], onClick: onBack, href: "/start" }}
      title={copy.onboarding.found.title}
      intro={copy.onboarding.found.intro}
      status={guest ? copy.onboarding.found.accountGate : `${services.length} services selected`}
      action={
        guest ? (
          <PrimaryButton onClick={onCreateAccount} disabled={busy}>{busy ? copy.common.loading : copy.onboarding.found.accountCta}</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => onContinue(services)} disabled={services.length === 0 || busy}>{busy ? copy.common.loading : copy.onboarding.found.continue}</PrimaryButton>
        )
      }
      aside={aside}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          {disciplines.slice(0, 3).map((d) => <Sticker key={d} discipline={d} size={40} />)}
          <div>
            <h2 className="text-lg font-semibold leading-tight">{scan.place.name}</h2>
            <p className="text-sm text-muted">{scan.understanding.positioning}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Tile icon={MessageSquare} label={copy.onboarding.found.tiles.reviews} value={scan.place.reviewCount?.toLocaleString("en-CA") ?? "–"} note={leaderCount ? `Local leader: ${leaderCount}` : "Google reviews"} tone={leaderCount ? "alert" : "neutral"} />
          <Tile icon={Star} label={copy.onboarding.found.tiles.rating} value={scan.place.rating?.toFixed(1) ?? "–"} note={localAvg !== undefined ? `Local average ${localAvg.toFixed(1)}` : "Google rating"} delta={ratingDelta} />
          <Tile icon={Building2} label={copy.onboarding.found.tiles.nearby} value={String(nearby)} note={counts[0] ? `offering ${counts[0].service}` : "same discipline"} tone="neutral" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-semibold">{copy.onboarding.found.standsOut}</h2>
            {scan.hints.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {scan.hints.map((h) => (
                  <li key={h.kind} className="flex items-start gap-3 rounded-xl border border-line bg-surface/60 p-3">
                    <span className="mt-1.5"><Dot tone={hintTone[h.kind]} /></span>
                    <span className="text-sm leading-snug">{h.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">{copy.onboarding.found.nothingStandsOut}</p>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Market snapshot</h2>
            <p className="mt-1 text-xs text-muted">Clinics within 5 km offering each service.</p>
            <ul className="mt-4 space-y-2.5">
              {counts.slice(0, 6).map((c) => (
                <li key={c.service} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="flex justify-between gap-2"><span className="truncate">{c.service}</span><span className="font-mono text-xs text-muted tabular-nums">{c.count}</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-primary/70" style={{ width: `${(c.count / maxCount) * 100}%` }} /></div>
                  </div>
                </li>
              ))}
              {counts.length === 0 && <li className="text-sm text-muted">No comparable clinics counted yet.</li>}
            </ul>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-semibold">{copy.onboarding.found.services}</h2>
          <p className="mt-1 text-sm text-muted">{copy.onboarding.found.servicesHint}</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Services">
            {services.map((s) => (
              <li key={s} className="flex items-center gap-1 rounded-full border border-line bg-surface pl-3 text-sm">
                {s}
                <button type="button" onClick={() => setServices(services.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="grid size-9 place-items-center rounded-full hover:text-alert"><X size={14} /></button>
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
            <label htmlFor="add-service" className="sr-only">{copy.onboarding.found.addService}</label>
            <input id="add-service" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={copy.onboarding.found.addService} className="min-h-11 flex-1 rounded-xl border border-line px-3 text-sm sm:max-w-xs" />
            <button type="submit" className="min-h-11 rounded-xl border border-line px-4 text-sm font-medium">{copy.onboarding.competitors.add}</button>
          </form>
        </Card>
      </div>
    </SetupFrame>
  );
}

function Tile({ icon: Icon, label, value, note, delta, tone = "neutral" }: { icon: typeof Star; label: string; value: string; note: string; delta?: number; tone?: "neutral" | "alert" }) {
  const up = delta !== undefined && delta > 0;
  const down = delta !== undefined && delta < 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary"><Icon size={16} aria-hidden /></span>
        {delta !== undefined && delta !== 0 && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs ${up ? "bg-success-soft text-success" : "bg-alert-soft text-alert"}`}>
            {up ? <TrendingUp size={12} aria-hidden /> : <TrendingDown size={12} aria-hidden />}{up ? "+" : ""}{delta.toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="font-mono text-3xl font-semibold tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${tone === "alert" && !down && !up ? "text-alert" : "text-muted"}`}>{note}</p>
    </Card>
  );
}
