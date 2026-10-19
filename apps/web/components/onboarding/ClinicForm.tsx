"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";
import { DISCIPLINE_LABELS, Discipline, type ClinicInput, type Place } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { getMarketCard, searchClinics, type MarketCard } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ListingCard } from "./ListingCard";
import { PrimaryButton, SetupFrame } from "./SetupFrame";

const openedOptions = [
  { key: "new", value: () => `${new Date().getFullYear()}` },
  { key: "recent", value: () => `${new Date().getFullYear() - 1}` },
  { key: "established", value: () => `${new Date().getFullYear() - 3}` },
] as const;

/** Step 1 of 4. Pure UI: `onSubmit` receives a valid ClinicInput. */
const NON_CLINIC_TYPES = new Set(["hospital", "pharmacy", "drugstore", "supermarket", "store", "insurance_agency", "school"]);

export function ClinicForm({
  onSubmit,
  busy,
  search = searchClinics,
  marketCard = getMarketCard,
}: {
  onSubmit: (input: ClinicInput) => void;
  busy?: boolean;
  search?: typeof searchClinics;
  marketCard?: typeof getMarketCard;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Toronto");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [website, setWebsite] = useState("");
  const [opened, setOpened] = useState<(typeof openedOptions)[number]["key"] | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [servicesText, setServicesText] = useState("");
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

  const services = servicesText.split(",").map((s) => s.trim()).filter(Boolean);
  const ready = !!place && disciplines.length > 0 && (!looksNonClinic || businessConfirmed);
  const toggleDiscipline = (d: Discipline) => {
    setMarket(null);
    setDisciplines((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : cur.length < 4 ? [...cur, d] : cur));
  };

  const submit = () => {
    if (!place) return;
    const [street, cityPart] = place.address.split(",").map((s) => s.trim());
    onSubmit({
      name: place.name,
      address: street || place.address,
      city: cityPart?.replace(/\s+ON.*$/, "") || city,
      province: "ON",
      website: (website || place.website || undefined)?.trim() || undefined,
      phone: place.phone,
      disciplines,
      services,
      opened: opened ? openedOptions.find((o) => o.key === opened)!.value() : undefined,
      businessTypeConfirmed: looksNonClinic ? businessConfirmed : undefined,
    });
  };

  return (
    <SetupFrame
      step={1}
      title={copy.onboarding.title}
      intro={copy.onboarding.intro}
      status={ready ? copy.onboarding.statusReady : copy.onboarding.statusMissing}
      action={<PrimaryButton onClick={submit} disabled={!ready || busy}>{busy ? copy.onboarding.starting : copy.onboarding.start}</PrimaryButton>}
    >
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="clinic-search" className="block text-sm font-medium">{copy.onboarding.searchLabel}</label>
              <div className="relative mt-1">
                <Search aria-hidden size={16} className="pointer-events-none absolute top-3.5 left-3 text-faint" />
                <input
                  id="clinic-search"
                  value={place ? place.name : query}
                  onChange={(e) => { setPlace(null); setMarket(null); setQuery(e.target.value); }}
                  placeholder="e.g. Yonge Finch Dental Centre"
                  autoComplete="off"
                  className="min-h-11 w-full rounded-lg border border-line bg-card pr-3 pl-9 text-sm"
                  aria-describedby="clinic-search-hint"
                />
              </div>
              <p id="clinic-search-hint" className="mt-1 text-xs text-muted">{copy.onboarding.searchHint}</p>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium">{copy.onboarding.cityLabel}</label>
              <input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-line bg-card px-3 text-sm sm:w-40" />
            </div>
          </div>

          {!place && (query.trim().length >= 2) && (
            <ul className="divide-y divide-line rounded-xl border border-line bg-card" aria-label="Matching listings" aria-busy={searching}>
              {searching && results.length === 0 && <li className="p-3 text-sm text-muted">{copy.common.loading}</li>}
              {!searching && results.length === 0 && <li className="p-3 text-sm text-muted">No clinic matched. Try the exact name on your Google listing.</li>}
              {results.map((r) => (
                <li key={r.placeId}>
                  <button type="button" onClick={() => { setPlace(r); setWebsite(r.website ?? ""); }} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-surface">
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

          <div>
            <label htmlFor="website" className="block text-sm font-medium">{copy.onboarding.websiteLabel}</label>
            <input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="mt-1 min-h-11 w-full rounded-lg border border-line bg-card px-3 text-sm" aria-describedby="website-hint" />
            <p id="website-hint" className="mt-1 text-xs text-muted">{copy.onboarding.websiteHint}</p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">{copy.onboarding.openedLabel}</legend>
            <p className="mt-1 text-xs text-muted">{copy.onboarding.openedHint}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
              {openedOptions.map((o) => (
                <button key={o.key} type="button" role="radio" aria-checked={opened === o.key} onClick={() => setOpened(o.key)} className={clsx("min-h-11 rounded-full border px-4 text-sm", opened === o.key ? "border-primary bg-primary-soft text-primary" : "border-line bg-card")}>
                  {copy.onboarding.openedOptions[o.key]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">{copy.onboarding.disciplinesLabel}</legend>
            <p className="mt-1 text-xs text-muted">{copy.onboarding.disciplinesHint}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Discipline.options.filter((d) => d !== "other").map((d) => {
                const idx = disciplines.indexOf(d);
                return (
                  <button key={d} type="button" aria-pressed={idx >= 0} onClick={() => toggleDiscipline(d)} className={clsx("min-h-11 rounded-full border px-4 text-sm", idx >= 0 ? "border-primary bg-primary-soft text-primary" : "border-line bg-card")}>
                    {idx === 0 && <span className="mr-1 font-mono text-xs">1</span>}{DISCIPLINE_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="services" className="block text-sm font-medium">{copy.onboarding.servicesLabel}</label>
            <input id="services" value={servicesText} onChange={(e) => setServicesText(e.target.value)} placeholder="cleaning, Invisalign, emergency dentistry" className="mt-1 min-h-11 w-full rounded-lg border border-line bg-card px-3 text-sm" aria-describedby="services-hint" />
            <p id="services-hint" className="mt-1 text-xs text-muted">{copy.onboarding.servicesHint}</p>
          </div>
        </form>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <ListingCard place={place} services={services} market={market} disciplines={disciplines} />
          <Card className="p-5">
            <h2 className="text-sm font-semibold">{copy.onboarding.whatNext}</h2>
            <ol className="mt-2 space-y-1.5 text-sm text-muted">
              {copy.onboarding.nextSteps.map((t, i) => (
                <li key={t} className="flex gap-2"><span className="font-mono text-faint">{i + 1}</span>{t}</li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </SetupFrame>
  );
}
