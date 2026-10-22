"use client";

import { useState } from "react";
import { MapPin, Plus, Search } from "lucide-react";
import type { Place } from "@clinix/contracts";
import { searchClinics } from "@/lib/api";

type Verdict = { place: Place; note?: string };

/**
 * Add a clinic we missed: search Google listings near the owner, preview the match, then confirm. Only a verified listing can
 * be added (reviews are read from it); the owner's own clinic and clinics already in the list are recognised, not duplicated.
 */
export function AddCompetitor({ city, ownPlaceId, knownIds, onAdd, onExisting }: { city: string; ownPlaceId?: string; knownIds: string[]; onAdd: (pick: { placeId: string }) => Promise<void>; onExisting: (placeId: string) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Verdict[] | null>(null);
  const [picked, setPicked] = useState<Place | null>(null);
  const [state, setState] = useState<"idle" | "searching" | "adding">("idle");
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (q.trim().length < 2) return;
    setState("searching"); setError(null); setPicked(null);
    try {
      const found = await searchClinics(q.trim(), city);
      setResults(found.map((place) => ({ place, note: place.placeId === ownPlaceId ? "This is your own clinic" : knownIds.includes(place.placeId) ? "Already in the list" : undefined })));
    } catch {
      setResults(null); setError("We couldn't search right now. Try again in a moment.");
    } finally { setState("idle"); }
  };
  const confirm = async (place: Place) => {
    setState("adding"); setError(null);
    try { await onAdd({ placeId: place.placeId }); setPicked(null); setResults(null); setQ(""); }
    catch (e) { setError(e instanceof Error ? e.message : "We couldn't add that clinic."); }
    finally { setState("idle"); }
  };

  return (
    <section className="rounded-[22px] border border-dashed border-[#d3d7ec] bg-white/70 p-[20px]" aria-labelledby="add-title">
      <h2 id="add-title" className="text-[16px] font-bold">Add a clinic we missed</h2>
      <p className="mt-0.5 text-[13px] text-ink-grey">Search for it by name. We only add clinics we can find on Google, so its reviews can be read.</p>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void search(); }}>
        <label className="flex min-h-[46px] flex-1 items-center gap-2.5 rounded-xl border border-[#e3e6f2] bg-white px-3.5 focus-within:border-primary">
          <Search size={16} className="text-faint" aria-hidden /><span className="sr-only">Clinic name</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Clinic name" className="field-input w-full bg-transparent text-[14px] outline-none placeholder:text-[#9aa3bd]" />
        </label>
        <button type="submit" disabled={state !== "idle"} className="min-h-[46px] rounded-xl border border-[#dfe2f1] bg-white px-5 text-[14px] font-semibold text-primary disabled:opacity-50">{state === "searching" ? "Searching…" : "Search"}</button>
      </form>
      {error && <p role="alert" className="mt-3 text-[13px] text-alert">{error}</p>}
      {results && results.length === 0 && <p className="mt-3 text-[13px] text-ink-grey">We couldn&apos;t verify a clinic with that name near you. Check the spelling or add the area.</p>}
      {results && results.length > 0 && !picked && (
        <ul className="mt-3 divide-y divide-[#eef0f6] rounded-xl border border-[#ecedf5] bg-white">
          {results.map(({ place, note }) => (
            <li key={place.placeId}>
              <button type="button" onClick={() => (note === "Already in the list" ? onExisting(place.placeId) : setPicked(place))} disabled={note === "This is your own clinic"} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#f8f8fe] disabled:opacity-60">
                <MapPin size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden />
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{place.name}</span><span className="block truncate text-[12.5px] text-ink-grey">{place.address}</span></span>
                {note && <span className="shrink-0 text-[12px] font-semibold text-ink-grey">{note}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {picked && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-[#f7f7ff] p-4" data-testid="add-preview">
          <p className="text-[12px] font-semibold tracking-wider text-primary uppercase">Verified on Google</p>
          <p className="mt-1 text-[15px] font-bold">{picked.name}</p>
          <p className="text-[13px] text-ink-grey">{picked.address}</p>
          {picked.rating !== undefined && <p className="mt-1 text-[13px] text-ink-grey">{picked.rating.toFixed(1)}★{picked.reviewCount !== undefined && ` · ${picked.reviewCount} reviews`}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => void confirm(picked)} disabled={state === "adding"} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[13.5px] font-semibold text-white disabled:opacity-50"><Plus size={14} aria-hidden />{state === "adding" ? "Adding…" : "Add as competitor"}</button>
            <button type="button" onClick={() => setPicked(null)} className="min-h-10 rounded-xl px-4 text-[13.5px] font-semibold text-ink-grey hover:text-ink">Back to results</button>
          </div>
        </div>
      )}
    </section>
  );
}
