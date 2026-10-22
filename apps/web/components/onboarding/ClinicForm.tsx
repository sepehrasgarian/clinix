"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Globe, MapPin, Phone, Search, Sparkle, X } from "lucide-react";
import { parseInstagram, type Clinic, type Discipline, type ClinicInput, type Place } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { getMarketCard, searchClinics, type MarketCard } from "@/lib/api";
import { disciplinesFromListing, disciplinesFromName } from "@/lib/disciplines";
import { cleanWebsite, isValidWebsite, websiteHost } from "@/lib/website";
import { ListingCard } from "./ListingCard";
import { ServiceSearch } from "./ServiceSearch";
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
  const [city] = useState(initial?.clinic.city ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<Place | null>(initial?.place ?? null);
  const [website, setWebsite] = useState(initial?.clinic.website ?? "");
  const [phone, setPhone] = useState(initial?.clinic.phone ?? "");
  const [instagram, setInstagram] = useState(initial?.clinic.instagram ? `@${initial.clinic.instagram}` : "");
  const [suggestion, setSuggestion] = useState<Place | null>(null);
  const [dismissedHost, setDismissedHost] = useState("");
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

  const typedSite = website.replace(/^https?:\/\//, "");
  const websiteError = isValidWebsite(typedSite) ? undefined : "That doesn't look like a website address. Enter it like yourclinic.com, or leave it blank.";
  const igHandle = parseInstagram(instagram);
  const instagramError = igHandle === null ? "That isn't an Instagram profile. Enter @yourclinic or the link to its profile." : undefined;

  // A website that looks like a domain, before a listing is chosen: offer the listing that owns that domain.
  useEffect(() => {
    const host = websiteHost(typedSite);
    if (place || query.trim() !== "" || !host || websiteError || host === dismissedHost) { setSuggestion(null); return; }
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const found = await search(host, city);
        if (!cancelled) setSuggestion(found.find((r) => r.website && websiteHost(r.website) === host) ?? null);
      } catch {
        if (!cancelled) setSuggestion(null);
      }
    }, 700);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [typedSite, place, query, city, websiteError, dismissedHost, search]);

  const pick = (r: Place) => {
    setSuggestion(null);
    setPlace(r);
    setWebsite(cleanWebsite(r.website));
    setPhone(r.phone ?? "");
    setAddress(r.address);
    // The listing's name and specific Google types usually say what kind of clinic it is: preselect, let the owner correct.
    // A name that names its disciplines ("osteo - physio - masso") is a strong signal: take them all. Google's tags alone
    // are looser, so they only suggest the first.
    const fromName = disciplinesFromName(r.name);
    const implied = fromName.length ? fromName.slice(0, 4) : disciplinesFromListing(r.name, r.types).slice(0, 1);
    if (implied.length && disciplines.length === 0) {
      setDisciplines(implied);
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

  const ready = !!place && address.trim() !== "" && disciplines.length > 0 && (!looksNonClinic || businessConfirmed) && !websiteError && !instagramError;

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
      website: (website || cleanWebsite(place.website) || undefined)?.trim() || undefined,
      phone: phone || place.phone,
      instagram: igHandle ?? undefined,
      disciplines,
      services,
      opened: opened ? openedOptions.find((o) => o.key === opened)!.value() : undefined,
      businessTypeConfirmed: looksNonClinic ? businessConfirmed : undefined,
    });
  };

  const t = copy.onboarding;
  const preview = (
    <>
      <section className="rounded-[26px] border border-[#f1e6d2] bg-gradient-to-br from-[#fff9ee] via-white to-[#fbfaff] p-[24px] shadow-[0_24px_60px_-48px_rgba(180,130,40,.45)]" aria-labelledby="preview-title">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex rounded-full bg-[#ffebc7] px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[#9a5b12] uppercase">{t.liveBadge}</span>
          {place && <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success"><span aria-hidden className="size-1.5 rounded-full bg-success" />{t.updatedLive}</span>}
        </div>
        <h2 id="preview-title" className="mt-4 text-[24px] font-bold tracking-[-0.03em]">{place ? t.foundTitle : t.previewTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-grey">{place ? t.foundSub : t.previewEmpty}</p>
        <div className="mt-[20px]">
          {place ? (
            <ListingCard place={place} services={services} market={market} disciplines={disciplines} />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#dcdff0] bg-white/70 p-4" aria-hidden>
              <div className="grid grid-cols-[1.1fr_1fr] gap-3">
                <div className="h-[96px] rounded-xl bg-[#eceef6]" />
                <MapPlaceholder />
              </div>
              <div className="mt-4 h-3 w-2/3 rounded-full bg-[#eceef6]" />
              <div className="mt-2.5 h-3 w-1/3 rounded-full bg-[#f5deb0]" />
              <div className="mt-2.5 h-3 w-4/5 rounded-full bg-[#eceef6]" />
            </div>
          )}
        </div>
      </section>
      <section className="rounded-[22px] border border-[#ecedf5] bg-white p-[24px]" aria-labelledby="next-title">
        <h2 id="next-title" className="text-[17px] font-bold">{t.whatNext}</h2>
        <ol className="mt-[18px] space-y-[14px] text-sm">
          {t.nextSteps.map((text, i) => (
            <li key={text} className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#e3e6f2] text-xs font-semibold text-ink-grey">{i + 2}</span>
              <span className="text-ink">{text}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );

  return (
    <SetupFrame step={1} title={t.title} intro={t.intro} aside={preview} hasClinic={!!initial}>
      <form className="flex flex-col gap-[20px] rounded-[24px] border border-[#ecedf5] bg-white p-[20px] shadow-[0_24px_60px_-44px_rgba(76,70,180,.4)] sm:p-[28px]" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field
          id="clinic-search"
          label={t.searchLabel}
          required
          hint={t.searchHint}
          icon={<Search size={16} aria-hidden />}
          trailing={<span className="grid size-9 place-items-center rounded-lg bg-[#eeefff] text-primary" aria-hidden>{searching ? <span className="size-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /> : <Sparkle size={15} />}</span>}
        >
          <input
            id="clinic-search"
            value={place ? place.name : query}
            onChange={(e) => { setPlace(null); setMarket(null); setQuery(e.target.value); }}
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            autoFocus
            className={inputClass}
            aria-describedby="clinic-search-hint"
          />
        </Field>

        {!place && query.trim().length >= 2 && (
          <ul className="-mt-2 divide-y divide-[#f0f1f7] overflow-hidden rounded-[12px] border border-[#e3e6f2] bg-white shadow-[0_18px_40px_-24px_rgba(14,21,38,.3)]" aria-label="Matching listings" aria-busy={searching}>
            {searching && results.length === 0 && <li className="p-3.5 text-sm text-ink-grey">{copy.common.loading}</li>}
            {!searching && results.length === 0 && <li className="p-3.5 text-sm text-ink-grey">No clinic matched. Try the exact name on your Google listing.</li>}
            {results.map((r) => (
              <li key={r.placeId}>
                <button type="button" onClick={() => pick(r)} className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-[#f4f3ff]">
                  <MapPin size={16} className="shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    <span className="block truncate text-[12.5px] text-ink-grey">{r.address}</span>
                  </span>
                  {r.rating !== undefined && <span className="shrink-0 font-mono text-xs text-ink-grey tabular-nums">{r.rating.toFixed(1)} · {r.reviewCount}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {looksNonClinic && (
          <div className="rounded-[12px] border border-[#f5c2c7] bg-[#fff5f5] p-4 text-sm">
            <p className="font-semibold text-[#b42318]">{t.confirmBusiness}</p>
            <label className="mt-2 flex min-h-9 items-center gap-2 font-medium">
              <input type="checkbox" checked={businessConfirmed} onChange={(e) => setBusinessConfirmed(e.target.checked)} className="size-4 accent-primary" />
              {t.confirmBusinessYes}
            </label>
          </div>
        )}

        <Field id="website" label="Website" optional hint={t.websiteHint} error={websiteError} icon={<Globe size={16} aria-hidden />}>
          <span className="self-stretch border-r border-[#e3e6f2] bg-[#fafbfe] px-4 text-[15px] leading-[46px] text-ink">https://</span>
          <input id="website" aria-invalid={!!websiteError} aria-describedby={websiteError ? "website-error" : "website-hint"} value={website.replace(/^https?:\/\//, "")} onChange={(e) => setWebsite(e.target.value ? `https://${e.target.value.replace(/^https?:\/\//, "")}` : "")} placeholder="yourclinic.com" className={inputClass} />
        </Field>

        {suggestion && (
          <div className="rounded-[14px] border border-primary/30 bg-[#f6f5ff] p-4" role="group" aria-label="Suggested listing">
            <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">We think this is you</p>
            <p className="mt-2 text-[15px] font-semibold">{suggestion.name}</p>
            <p className="text-[12.5px] text-ink-grey">{suggestion.address}</p>
            <div className="mt-3 flex gap-2.5">
              <button type="button" onClick={() => { setQuery(""); pick(suggestion); }} className="min-h-9 rounded-full bg-primary px-4 text-sm font-semibold text-white">Use this</button>
              <button type="button" onClick={() => { setDismissedHost(websiteHost(typedSite)); setSuggestion(null); }} className="min-h-9 rounded-full border border-[#e3e6f2] bg-white px-4 text-sm font-medium">Not me</button>
            </div>
          </div>
        )}

        <div className="grid gap-[20px] sm:grid-cols-2">
          <Field id="instagram" label="Instagram" optional error={instagramError} icon={<span className="text-[15px] font-semibold" aria-hidden>@</span>}>
            <input id="instagram" aria-invalid={!!instagramError} aria-describedby={instagramError ? "instagram-error" : undefined} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="yourclinic or its profile link" maxLength={120} autoComplete="off" className={inputClass} />
          </Field>
          <Field id="phone" label="Phone" optional icon={<Phone size={16} aria-hidden />}>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(416) 555-0123" maxLength={40} autoComplete="tel" className={inputClass} />
          </Field>
        </div>

        <fieldset>
          <legend className="text-[14.5px] font-semibold">{t.openedLabel}<span className="ml-1 font-normal text-ink-grey">(optional)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2.5" role="radiogroup">
            {openedOptions.map((o) => (
              <button key={o.key} type="button" role="radio" aria-checked={opened === o.key} onClick={() => setOpened(o.key)} className={clsx("min-h-[44px] rounded-full border px-[18px] text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", opened === o.key ? "border-primary bg-primary font-semibold text-white" : "border-[#e3e6f2] bg-white text-ink-grey hover:border-primary/40")}>
                {t.openedOptions[o.key]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-ink-grey">{t.openedHint}</p>
        </fieldset>

        <Field id="address" label="Address" required hint="Street + city + province/state + postal/zip code. Filled from your Google listing; edit it if it is wrong." icon={<MapPin size={16} aria-hidden />}>
          <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 100 Main St, Toronto, ON, M5V 2T6" autoComplete="street-address" className={inputClass} />
        </Field>

        <fieldset>
          <legend className="text-[14.5px] font-semibold">{t.disciplinesLabel} <span className="text-[#e5484d]" aria-hidden>*</span></legend>
          <p className="mt-1 text-[12.5px] text-ink-grey">{t.disciplinesHint}</p>
          <div className="mt-3">
            <ServiceSearch value={disciplines} onChange={changeDisciplines} autoFilled={autoFilled} />
          </div>
        </fieldset>

        <Field id="services" label={t.servicesLabel} optional hint={t.servicesHint} icon={<Search size={16} aria-hidden />}>
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
          <div className="-mt-2 flex flex-wrap gap-2">
            {services.map((sv) => (
              <span key={sv} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[#eeefff] pl-3.5 text-sm font-medium text-primary">
                {sv}
                <button type="button" onClick={() => setServices(services.filter((x) => x !== sv))} aria-label={`Remove ${sv}`} className="grid size-9 place-items-center rounded-full hover:text-alert"><X size={14} /></button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-1 flex flex-col-reverse gap-4 border-t border-[#ecedf5] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-grey" aria-live="polite">{websiteError ? "Check the website address, or leave it blank." : instagramError ? "Check the Instagram profile, or leave it blank." : ready ? t.statusReady : looksNonClinic && !businessConfirmed && place ? "Confirm this listing is your clinic to continue." : t.statusMissing}</p>
          <PrimaryButton type="submit" disabled={!ready || busy}>{busy ? t.starting : initial ? "Save and continue" : t.start}</PrimaryButton>
        </div>
      </form>
    </SetupFrame>
  );
}

function MapPlaceholder() {
  return (
    <svg viewBox="0 0 120 96" preserveAspectRatio="xMidYMid slice" className="h-[96px] w-full rounded-xl" aria-hidden>
      <rect width="120" height="96" fill="#eef2ec" />
      <path d="M0 40 H120 M0 72 H120 M35 0 V96 M82 0 V96" stroke="#ffffff" strokeWidth="7" />
      <path d="M0 40 H120 M35 0 V96" stroke="#f3dc9a" strokeWidth="3.5" />
      <rect x="6" y="8" width="20" height="14" rx="3" fill="#cfe6c4" />
      <rect x="92" y="74" width="22" height="14" rx="3" fill="#cfe6c4" />
      <path d="M58 24c-7 0-12 5-12 11 0 8 12 19 12 19s12-11 12-19c0-6-5-11-12-11Z" fill="#4f46e5" />
      <circle cx="58" cy="35" r="4" fill="#fff" />
    </svg>
  );
}
