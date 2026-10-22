"use client";

import { useEffect, useRef } from "react";
import { Globe, MapPin, Phone, Star, X } from "lucide-react";
import { DISCIPLINE_LABELS, type CompetitorCandidate } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { formatKm } from "@/lib/format";
import { cleanWebsite } from "@/lib/website";
import { PrimaryButton } from "./SetupFrame";

/** The side sheet for one candidate: what we know about it, why it was suggested, and the choose / remove action. */
export function CompetitorDetails({ candidate: c, selected, locked, onToggle, onClose }: { candidate: CompetitorCandidate; selected: boolean; locked: boolean; onToggle: () => void; onClose: () => void }) {
  const { place } = c;
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const site = cleanWebsite(place.website);
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#161a3a]/35" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={place.name} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-white p-[28px] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[22px] leading-tight font-bold">{place.name}</h2>
          <button ref={close} type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full border border-[#e3e6f2] hover:bg-[#f4f5fa]"><X size={16} aria-hidden /></button>
        </div>
        <dl className="mt-5 space-y-3 text-[14px]">
          <div className="flex gap-3"><dt className="sr-only">Address</dt><MapPin size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden /><dd>{place.address || "Address not listed"} <span className="text-ink-grey">· {formatKm(c.distanceKm)} from your clinic</span></dd></div>
          {place.rating !== undefined && <div className="flex gap-3"><dt className="sr-only">Rating</dt><Star size={16} className="mt-0.5 shrink-0 fill-[#f5a524] text-[#f5a524]" aria-hidden /><dd><b>{place.rating.toFixed(1)}</b>{place.reviewCount !== undefined && <span className="text-ink-grey"> · {place.reviewCount} {copy.common.reviews} on Google</span>}</dd></div>}
          {site && <div className="flex gap-3"><dt className="sr-only">Website</dt><Globe size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden /><dd><a href={site} target="_blank" rel="noreferrer" className="text-primary hover:underline">{site.replace(/^https?:\/\//, "")}</a></dd></div>}
          {place.phone && <div className="flex gap-3"><dt className="sr-only">Phone</dt><Phone size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden /><dd>{place.phone}</dd></div>}
        </dl>
        <h3 className="mt-6 text-[13px] font-semibold tracking-wider text-ink-grey uppercase">Overlapping services</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">{c.disciplines.map((d) => <span key={d} className="rounded-full bg-[#eeefff] px-3 py-1 text-[13px] font-medium text-primary">{DISCIPLINE_LABELS[d]}</span>)}</div>
        <h3 className="mt-6 text-[13px] font-semibold tracking-wider text-ink-grey uppercase">Why we suggested it</h3>
        <p className="mt-2 text-[14px] leading-relaxed">{c.reason}</p>
        <p className="mt-1 text-[13px] text-ink-grey">{copy.onboarding.competitors.flags[c.flag]}</p>
        <div className="mt-auto pt-8">
          {locked && !selected && <p className="mb-3 text-[13px] text-ink-grey">You have chosen the maximum for this discipline. Remove one to swap.</p>}
          <PrimaryButton onClick={onToggle} disabled={locked && !selected}>{selected ? "Remove from selection" : "Select as competitor"}</PrimaryButton>
        </div>
      </aside>
    </div>
  );
}
