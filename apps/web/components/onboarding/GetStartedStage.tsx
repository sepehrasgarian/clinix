"use client";

import { useRef, useState } from "react";
import { BarChart3, Check, ChevronDown, CircleCheck, Layers, Lock, MapPin, Plug, Users } from "lucide-react";
import { DISCIPLINE_LABELS, type Discipline, type Place } from "@clinix/contracts";
import { photoUrl } from "@/lib/api";
import { copy } from "@/lib/copy";
import { cityFromAddress } from "@/lib/overview";
import { cleanWebsite } from "@/lib/website";
import { PrimaryButton, SetupFrame } from "./SetupFrame";

const card = "rounded-[24px] border border-[#ecedf5] bg-white shadow-[0_24px_60px_-44px_rgba(76,70,180,.4)]";

/** Step 5: setup is done. Shows what was saved and starts the first analysis; the integrations we don't have yet are a quiet note. */
export function GetStartedStage({ clinic, place, locations, competitors, busy, error, onBack, onStart }: {
  clinic: { name: string; address: string; disciplines: Discipline[] };
  /** The Google listing, for the photo and public details when there is one. */
  place?: Pick<Place, "photoName" | "website" | "phone">;
  locations: number;
  competitors: number;
  busy?: boolean;
  error?: string | null;
  onBack: () => void;
  onStart: () => void;
}) {
  const t = copy.onboarding.ready;
  const [open, setOpen] = useState(false);
  const pressed = useRef(false);
  const city = cityFromAddress(clinic.address);
  const site = cleanWebsite(place?.website);
  const start = () => {
    if (pressed.current) return;
    pressed.current = true;
    onStart();
  };
  // A failed start leaves the button usable again; a second press while one is running does nothing.
  if (!busy) pressed.current = false;

  const stats = [
    { icon: Layers, label: "Locations", value: locations, sub: locations === 1 ? "clinic location" : "clinic locations" },
    { icon: BarChart3, label: "Disciplines", value: clinic.disciplines.length, sub: clinic.disciplines.map((d) => DISCIPLINE_LABELS[d]).join(", ") },
    { icon: Users, label: "Competitors", value: competitors, sub: "selected for analysis" },
  ];
  return (
    <SetupFrame
      step={5}
      complete
      back={{ label: copy.onboarding.steps[3], onClick: onBack }}
      eyebrow={<span className="flex items-center gap-3"><span>{t.eyebrow}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7ee] px-3 py-1 text-[12.5px] font-semibold tracking-normal text-[#16875a] normal-case"><CircleCheck size={13} aria-hidden />{t.complete}</span></span>}
      title={<>{t.titleStart}<span className="text-primary">{t.titleAccent}</span></>}
      intro={t.intro}
      note={t.note}
    >
      <div className="flex flex-col gap-6">
        <section className={`${card} p-[24px]`} aria-labelledby="clinic-name" data-testid="clinic-summary">
          <div className="flex flex-wrap items-start gap-5">
            {place?.photoName ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl(place.photoName)} alt="" className="h-[100px] w-[100px] shrink-0 rounded-2xl object-cover" />
            ) : (
              <span className="grid size-[100px] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#eeefff] to-[#e2e4ff] text-[30px] font-bold text-primary" aria-hidden>{clinic.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ink-grey">{t.yourClinic}</p>
              <h2 id="clinic-name" className="mt-0.5 text-[22px] leading-tight font-bold">{clinic.name}</h2>
              {city && <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-ink-grey"><MapPin size={14} aria-hidden />{city}</p>}
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7ee] px-3 py-1 text-[13px] font-semibold text-[#16875a]"><Check size={13} strokeWidth={3} aria-hidden />{t.confirmed}</span>
              <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dfe2f1] bg-white px-4 text-[13px] font-semibold text-primary hover:border-primary/40">{open ? t.hideDetails : t.viewDetails}<ChevronDown size={13} className={open ? "rotate-180" : ""} aria-hidden /></button>
            </div>
          </div>
          {open && (
            <dl className="mt-5 grid gap-3 rounded-2xl bg-[#f6f7fb] p-4 text-[13.5px] sm:grid-cols-3">
              <div><dt className="text-ink-grey">Address</dt><dd className="mt-0.5 font-medium">{clinic.address}</dd></div>
              {site && <div><dt className="text-ink-grey">Website</dt><dd className="mt-0.5 font-medium">{site.replace(/^https?:\/\//, "")}</dd></div>}
              {place?.phone && <div><dt className="text-ink-grey">Phone</dt><dd className="mt-0.5 font-medium">{place.phone}</dd></div>}
            </dl>
          )}
          <dl className="mt-6 grid gap-5 border-t border-[#eef0f6] pt-5 md:grid-cols-3 md:divide-x md:divide-[#eef0f6]">
            {stats.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex gap-3.5 md:px-5 md:first:pl-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eeefff] text-primary" aria-hidden><Icon size={16} /></span>
                <div className="min-w-0"><dt className="text-[13px] text-ink-grey">{label}</dt><dd className="mt-1 text-[26px] leading-none font-bold">{value}</dd><dd className="mt-1.5 text-[12.5px] leading-snug text-ink-grey">{sub}</dd></div>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-8 rounded-[24px] border border-[#e6e3ff] bg-gradient-to-br from-[#f6f5ff] to-[#fbfaff] p-[28px] lg:grid-cols-[1.3fr_1fr]" aria-labelledby="start-title">
          <div>
            <h2 id="start-title" className="text-[26px] font-bold tracking-[-0.02em]">{t.startTitle}</h2>
            <p className="mt-2 max-w-[460px] text-[15px] leading-relaxed text-ink-grey">{t.startText}</p>
            {error && (
              <div role="alert" className="mt-5 rounded-2xl border border-alert/30 bg-alert-soft px-4 py-3.5">
                <p className="text-[14px] font-semibold text-alert">{t.failed}</p>
                <p className="mt-0.5 text-[13px] text-ink">{error}</p>
                <p className="mt-1 text-[13px] text-ink-grey">{t.recovery}</p>
              </div>
            )}
            <div className="mt-5"><PrimaryButton onClick={start} disabled={busy}>{busy ? t.starting : t.start}</PrimaryButton></div>
            <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-snug text-ink-grey"><Lock size={13} className="mt-0.5 shrink-0" aria-hidden />{t.begins}</p>
          </div>
          <ul className="flex flex-col justify-center gap-3.5 lg:border-l lg:border-[#e6e3ff] lg:pl-8">
            {t.covers.map((c) => <li key={c} className="flex items-center gap-3 text-[15px]"><span className="grid size-6 place-items-center rounded-full bg-[#eeefff] text-primary" aria-hidden><Check size={13} strokeWidth={3} /></span>{c}</li>)}
          </ul>
        </section>

        <section className="rounded-[24px] border border-[#ecedf5] bg-white/70 p-[22px]" aria-labelledby="soon-title">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eeefff] text-primary" aria-hidden><Plug size={16} /></span>
            <div><h2 id="soon-title" className="text-[16px] font-bold">{t.soonTitle}</h2><p className="mt-0.5 max-w-[640px] text-[13px] leading-snug text-ink-grey">{t.soonText}</p></div>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {t.cards.map((c) => (
              <li key={c.name} className="flex items-start justify-between gap-3 rounded-2xl border border-[#ecedf5] bg-white p-4">
                <div><h3 className="text-[14.5px] font-bold">{c.name}</h3><p className="mt-1 text-[13px] leading-snug text-ink-grey">{c.text}</p></div>
                <span className="shrink-0 rounded-full bg-[#eef0f4] px-2.5 py-1 text-[11.5px] font-semibold text-ink-grey">{t.soon}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SetupFrame>
  );
}
