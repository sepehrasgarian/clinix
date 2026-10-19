"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Analysis } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Pill";
import { copy } from "@/lib/copy";
import { ListingCard } from "./ListingCard";
import { PrimaryButton, SetupFrame } from "./SetupFrame";

const hintTone = { review_gap: "alert", rating_gap: "alert", rating_strength: "success", no_website: "alert", crowded_market: "warning" } as const;

/** Step 2 of 4: tiles, what stands out, and the editable service list (checkpoint 1). */
export function FoundStage({
  analysis,
  onContinue,
  busy,
  guest = false,
  onCreateAccount,
}: {
  analysis: Analysis;
  onContinue: (services: string[]) => void;
  busy?: boolean;
  /** Guests see the account gate instead of the continue button. */
  guest?: boolean;
  onCreateAccount?: () => void;
}) {
  const scan = analysis.scan!;
  const [services, setServices] = useState(scan.understanding.services.slice(0, 12));
  const [draft, setDraft] = useState("");
  const nearby = Math.max(0, ...scan.competitorCountsPerService.map((c) => c.count));

  const add = () => {
    const s = draft.trim();
    if (s && !services.includes(s) && services.length < 12) setServices([...services, s]);
    setDraft("");
  };

  return (
    <SetupFrame
      step={2}
      back={{ href: "/onboarding", label: copy.onboarding.steps[0] }}
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
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <ListingCard place={scan.place} services={[]} />
        <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-muted">{copy.onboarding.found.tiles.reviews}</p><p className="font-mono text-3xl tabular-nums">{scan.place.reviewCount ?? "–"}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted">{copy.onboarding.found.tiles.rating}</p><p className="font-mono text-3xl tabular-nums">{scan.place.rating?.toFixed(1) ?? "–"}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted">{copy.onboarding.found.tiles.nearby}</p><p className="font-mono text-3xl tabular-nums">{nearby}</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">{copy.onboarding.found.standsOut}</h2>
        {scan.hints.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {scan.hints.map((h) => (
              <li key={h.kind} className="flex items-start gap-3"><span className="mt-2"><Dot tone={hintTone[h.kind]} /></span><span>{h.text}</span></li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">{copy.onboarding.found.nothingStandsOut}</p>
        )}
      </Card>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold">{copy.onboarding.found.services}</h2>
        <p className="mt-1 text-sm text-muted">{copy.onboarding.found.servicesHint}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Services">
          {services.map((s) => (
            <li key={s} className="flex items-center gap-1 rounded-full border border-line bg-surface pl-3 text-sm">
              {s}
              <button type="button" onClick={() => setServices(services.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="grid size-9 place-items-center rounded-full hover:text-alert"><X size={14} /></button>
            </li>
          ))}
        </ul>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <label htmlFor="add-service" className="sr-only">{copy.onboarding.found.addService}</label>
          <input id="add-service" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={copy.onboarding.found.addService} className="min-h-11 flex-1 rounded-lg border border-line px-3 text-sm sm:max-w-xs" />
          <button type="submit" className="min-h-11 rounded-lg border border-line px-4 text-sm font-medium">{copy.onboarding.competitors.add}</button>
        </form>
      </Card>
    </SetupFrame>
  );
}
