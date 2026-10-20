"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Globe, MapPin, Phone, Search, X } from "lucide-react";
import { type Clinic, type Discipline, type ClinicInput, type Place } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { copy } from "@/lib/copy";
import { getMarketCard, searchClinics, type MarketCard } from "@/lib/api";
import { disciplinesFromTypes } from "@/lib/disciplines";
import { DisciplinePicker } from "./DisciplinePicker";
import { ListingCard } from "./ListingCard";
import { Field, PrimaryButton, SetupFrame, inputClass } from "./SetupFrame";

const openedOptions = [
  { key: "new", value: () => `${new Date().getFullYear()}` },
  { key: "recent", value: () => `${new Date().getFullYear() - 1}` },
  { key: "established", value: () => `${new Date().getFullYear() - 3}` },
] as const;

const NON_CLINIC_TYPES = new Set(["hospital", "pharmacy", "drugstore", "supermarket", "store", "insurance_agency", "school"]);

/** Step 1 of 4. Pure UI: `onSubmit` receives a valid ClinicInput. */
export function ClinicForm({
  onSubmit,
  busy,
  initial,
  search = searchClinics,
  marketCard = getMarketCard,
}: {
  onSubmit: (input: ClinicInput) => void;
  busy?: boolean;
  /** When the owner comes back to this step: the clinic and listing they already chose. */
  initial?: { clinic: Clinic; place: Place | null };
  search?: typeof searchClinics;
  marketCard?: typeof getMarketCard;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(initial?.clinic.city ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<Place | null>(initial?.place ?? null);
  const [website, setWebsite] = useState(initial?.clinic.website ?? "");
  const [phone, setPhone] = useState(initial?.clinic.phone ?? "");
  const [address, setAddress] = useState(initial?.place?.address ?? (initial ? `${initial.clinic.address}, ${initial.clinic.city}` : ""));
  const [opened, setOpened] = useState<(typeof openedOptions)[number]["key"] | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>(initial?.clinic.disciplines ?? []);
  const [autoFilled, setAutoFilled] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [services, setServices] = useState<string[]>(initial?.clinic.services ?? []);
  const [market, setMarket] = useState<MarketCard | null>(null);
  const [businessConfirmed, setBusinessConfirmed] = useState(false);
  const looksNonClinic = !!place && place.types.some((t) => NON_CLINIC_TYPES.has(t));

  useEffect(() => {
    if (query.trim().length < 2 || place) return;
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await search(query.trim(), city));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query, city, place, search]);

  // The market card appears as soon as a listing and a discipline are known.
  useEffect(() => {
    if (!place || disciplines.length === 0) return;
    let cancelled = false;
    marketCard(place.placeId, disciplines)
      .then((m) => !cancelled && setMarket(m))
      .catch(() => !cancelled && setMarket(null));
    return () => {
      cancelled = true;
    };
  }, [place, disciplines, marketCard]);

  const pick = (r: Place) => {
    setPlace(r);
    setWebsite(r.website ?? "");
    setPhone(r.phone ?? "");
    setAddress(r.address);
    // The listing's Google types usually say what kind of clinic it is: preselect, let the owner correct.
    const implied = disciplinesFromTypes(r.types);
    if (implied.length && disciplines.length === 0) {
      setDisciplines(implied.slice(0, 4));
      setAutoFilled(true);
    }
  };

  const changeDisciplines = (next: Discipline[]) => {
    setMarket(null);
    setAutoFilled(false);
    setDisciplines(next);
  };

  const addService = () => {
    const s = serviceQuery.trim();
    if (s && !services.includes(s) && services.length < 12) setServices([...services, s]);
    setServiceQuery("");
  };

  const ready = !!place && disciplines.length > 0 && (!looksNonClinic || businessConfirmed);

  const submit = () => {
    if (!place) return;
    // Google formats addresses as "street, city, region postal, country"; keep the parts we can name.
    const parts = (address || place.address).split(",").map((s) => s.trim()).filter(Boolean);
    const street = parts[0] ?? place.address;
    const cityPart = parts[1] ?? city;
    const region = parts.length >= 3 ? parts[2].replace(/\s+[A-Z0-9]{3,}\s?[A-Z0-9]{0,3}$/i, "").trim() || undefined : undefined;
    const country = parts.length >= 4 ? parts[parts.length - 1] : undefined;
    onSubmit({
      name: place.name,
      address: street,
      city: cityPart || city || "Unknown",
      province: region || undefined,
      country,
      website: (website || place.website || undefined)?.trim() || undefined,
      phone: phone || place.phone,
      disciplines,
      services,
      opened: opened ? openedOptions.find((o) => o.key === opened)!.value() : undefined,
      businessTypeConfirmed: looksNonClinic ? businessConfirmed : undefined,
    });
  };

  const preview = (
    <>
      <Card className="p-5">
        <h2 className="text-lg font-semibold">{copy.onboarding.previewTitle}</h2>
        <p className="mt-1 text-sm text-muted">{copy.onboarding.previewEmpty}</p>
        <div className="mt-4">
          {place ? (
            <ListingCard place={place} services={services} market={market} disciplines={disciplines} />
          ) : (
            <div className="rounded-xl border border-line bg-surface/60 p-3" aria-hidden>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 rounded-lg bg-line/60" />
                <MapPlaceholder />
              </div>
              <div className="mt-3 h-3 w-3/4 rounded bg-line/70" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#f5b942]/30" />
              <div className="mt-2 h-3 w-5/6 rounded bg-line/60" />
            </div>
          )}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">{copy.onboarding.whatNext}</h2>
        <ol className="mt-3 space-y-2.5 text-sm">
          {copy.onboarding.nextSteps.map((t, i) => (
            <li key={t} className="flex items-start gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line font-mono text-xs text-muted">{i + 2}</span>
              <span className="text-muted">{t}</span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );

  return (
    <SetupFrame
      step={1}
      title={copy.onboarding.title}
      intro={copy.onboarding.intro}
      status={ready ? copy.onboarding.statusReady : copy.onboarding.statusMissing}
      action={<PrimaryButton onClick={submit} disabled={!ready || busy}>{busy ? copy.onboarding.starting : initial ? "Save and continue" : copy.onboarding.start}</PrimaryButton>}
      aside={preview}
    >
      <form className="flex flex-col gap-6 rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)] md:p-7" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field id="clinic-search" label={copy.onboarding.searchLabel} required hint={copy.onboarding.searchHint} icon={<Search size={16} aria-hidden />}>
          <input
            id="clinic-search"
            value={place ? place.name : query}
            onChange={(e) => { setPlace(null); setMarket(null); setQuery(e.target.value); }}
            placeholder="Clinic name, anywhere in the world"
            autoComplete="off"
            className={inputClass}
            aria-describedby="clinic-search-hint"
          />
          <label htmlFor="city" className="sr-only">{copy.onboarding.cityLabel}</label>
          <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (optional)" className="min-h-12 w-36 border-l border-line bg-surface/60 px-3 text-sm outline-none placeholder:text-faint" />
        </Field>

        {!place && query.trim().length >= 2 && (
          <ul className="-mt-3 divide-y divide-line rounded-xl border border-line bg-card" aria-label="Matching listings" aria-busy={searching}>
            {searching && results.length === 0 && <li className="p-3 text-sm text-muted">{copy.common.loading}</li>}
            {!searching && results.length === 0 && <li className="p-3 text-sm text-muted">No clinic matched. Try the exact name on your Google listing.</li>}
            {results.map((r) => (
              <li key={r.placeId}>
                <button type="button" onClick={() => pick(r)} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-surface">
                  <span>
                    <span className="block font-medium">{r.name}</span>
                    <span className="block text-xs text-muted">{r.address}</span>
                  </span>
                  {r.rating !== undefined && <span className="shrink-0 font-mono text-xs text-muted tabular-nums">{r.rating.toFixed(1)} · {r.reviewCount}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {looksNonClinic && (
          <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm">
            <p className="text-warning">{copy.onboarding.confirmBusiness}</p>
            <label className="mt-2 flex min-h-9 items-center gap-2 font-medium">
              <input type="checkbox" checked={businessConfirmed} onChange={(e) => setBusinessConfirmed(e.target.checked)} className="size-4 accent-primary" />
              {copy.onboarding.confirmBusinessYes}
            </label>
          </div>
        )}

        <Field id="website" label="Website" optional hint={copy.onboarding.websiteHint} icon={<Globe size={16} aria-hidden />}>
          <span className="border-r border-line px-3 text-sm text-muted">https://</span>
          <input id="website" value={website.replace(/^https?:\/\//, "")} onChange={(e) => setWebsite(e.target.value ? `https://${e.target.value.replace(/^https?:\/\//, "")}` : "")} placeholder="yourclinic.com" className={inputClass} />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field id="phone" label="Phone" optional icon={<Phone size={16} aria-hidden />}>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(416) 555-0123" className={inputClass} />
          </Field>
          <Field id="address" label="Address" optional hint="Filled from your Google listing. Edit if it is wrong." icon={<MapPin size={16} aria-hidden />}>
            <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 100 Main St, Toronto, ON" className={inputClass} />
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold">{copy.onboarding.openedLabel} <span className="font-normal text-muted">(optional)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
            {openedOptions.map((o) => (
              <button key={o.key} type="button" role="radio" aria-checked={opened === o.key} onClick={() => setOpened(o.key)} className={clsx("min-h-11 rounded-full border px-4 text-sm", opened === o.key ? "border-primary bg-primary-soft text-primary" : "border-line bg-card")}>
                {copy.onboarding.openedOptions[o.key]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">{copy.onboarding.openedHint}</p>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold">{copy.onboarding.disciplinesLabel} <span className="text-alert" aria-hidden>*</span></legend>
          <p className="mt-1 text-xs text-muted">{copy.onboarding.disciplinesHint}</p>
          <div className="mt-3">
            <DisciplinePicker value={disciplines} onChange={changeDisciplines} autoFilled={autoFilled} />
          </div>
        </fieldset>

        <Field id="services" label={copy.onboarding.servicesLabel} optional hint={copy.onboarding.servicesHint} icon={<Search size={16} aria-hidden />}>
          <input
            id="services"
            value={serviceQuery}
            onChange={(e) => setServiceQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
            placeholder="Type a service and press Enter, e.g. Invisalign"
            className={inputClass}
          />
        </Field>
        {services.length > 0 && (
          <div className="-mt-3 flex flex-wrap gap-2">
            {services.map((s) => (
              <span key={s} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface pl-3 text-sm">
                {s}
                <button type="button" onClick={() => setServices(services.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="grid size-9 place-items-center rounded-full hover:text-alert"><X size={14} /></button>
              </span>
            ))}
          </div>
        )}
      </form>
    </SetupFrame>
  );
}

function MapPlaceholder() {
  return (
    <svg viewBox="0 0 120 96" className="h-24 w-full rounded-lg" aria-hidden>
      <rect width="120" height="96" fill="#eef1f6" />
      <path d="M0 40 H120 M0 70 H120 M35 0 V96 M80 0 V96" stroke="#d9dee8" strokeWidth="6" />
      <path d="M0 40 H120 M35 0 V96" stroke="#f5b942" strokeWidth="4" opacity=".6" />
      <circle cx="58" cy="44" r="9" fill="#4338ca" />
      <circle cx="58" cy="44" r="3.5" fill="#fff" />
    </svg>
  );
}
