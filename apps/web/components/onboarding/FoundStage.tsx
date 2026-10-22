"use client";

import { useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import type { Analysis } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { insightTiles, nearbyCount } from "@/lib/overview";
import { ClinicCard } from "./ClinicCard";
import { HintList } from "./HintList";
import { InsightTile } from "./InsightTile";
import { MarketMap } from "./MarketMap";
import { NearbyList } from "./NearbyList";
import { ServicesCard, MAX_SERVICES } from "./ServicesCard";
import { PrimaryButton, SetupFrame } from "./SetupFrame";

/** Step 2, once the scan is done: the market overview, what stands out, and the editable service list (checkpoint 1). */
export function FoundStage({
  analysis,
  clinicOpened,
  onContinue,
  busy,
  guest = false,
  onCreateAccount,
  onBack,
}: {
  analysis: Analysis;
  /** When the clinic opened, so a young clinic is not ranked by review count. */
  clinicOpened?: string;
  onContinue: (services: string[]) => void;
  busy?: boolean;
  guest?: boolean;
  onCreateAccount?: () => void;
  onBack?: () => void;
}) {
  const scan = analysis.scan!;
  const t = copy.onboarding.found;
  const [services, setServices] = useState(scan.understanding.services.slice(0, MAX_SERVICES));
  const tiles = insightTiles(scan, clinicOpened);
  const count = nearbyCount(scan);

  const aside = (
    <>
      <section className="rounded-[26px] border border-[#ecedf5] bg-white p-[24px] shadow-[0_24px_60px_-44px_rgba(76,70,180,.4)]" aria-labelledby="market-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="market-title" className="text-[18px] font-bold">Your local market</h2>
            <p className="mt-1 text-[13.5px] text-ink-grey">{count > 0 ? <>We found <b className="text-ink">{count}{scan.nearbyCapped ? "+" : ""}</b> clinics within {scan.radiusKm} km.</> : "Nearby clinics are measured in your full analysis."}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#eeefff] px-3.5 py-1.5 text-[13px] font-semibold text-primary"><MapPin size={13} aria-hidden />{scan.radiusKm} km radius</span>
        </div>
        <div className="mt-4"><MarketMap center={scan.place} radiusKm={scan.radiusKm} clinics={scan.nearby} name={scan.place.name} /></div>
        {scan.nearby.length > 0 && <div className="mt-5"><NearbyList clinics={scan.nearby} /></div>}
      </section>
      <section className="flex gap-3 rounded-[22px] border border-[#e6e3ff] bg-gradient-to-br from-[#f6f5ff] to-[#fbfaff] p-[20px]">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-[#6d5cf5]" aria-hidden />
        <div>
          <h2 className="text-[15.5px] font-bold">{t.beginningTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-grey">{t.beginningText}</p>
        </div>
      </section>
    </>
  );

  return (
    <SetupFrame step={2} back={{ label: copy.onboarding.steps[0], onClick: onBack, href: "/start" }} title={t.title} intro={t.intro} note={t.note} aside={aside} asideWidth={480}>
      <div className="flex flex-col gap-[28px]">
        <ClinicCard place={scan.place} />
        <div>
          <h2 className="text-[18px] font-bold">{t.insights}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">{tiles.map((x) => <InsightTile key={x.label} insight={x} />)}</div>
        </div>
        <HintList hints={scan.hints} />
        <ServicesCard services={services} onChange={setServices} />
        <div className="flex flex-col-reverse gap-4 rounded-[22px] border border-[#ecedf5] bg-white p-[16px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)] sm:flex-row sm:items-center sm:justify-between">
          <p className="px-2 text-[13.5px] text-ink-grey" aria-live="polite">{guest ? t.accountGate : `${services.length} ${services.length === 1 ? "service" : "services"} to analyze`}</p>
          {guest ? (
            <PrimaryButton onClick={onCreateAccount} disabled={busy}>{busy ? copy.common.loading : t.accountCta}</PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => onContinue(services)} disabled={services.length === 0 || busy}>{busy ? copy.common.loading : t.continue}</PrimaryButton>
          )}
        </div>
      </div>
    </SetupFrame>
  );
}
