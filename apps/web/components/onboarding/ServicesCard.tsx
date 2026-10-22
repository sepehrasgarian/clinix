"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export const MAX_SERVICES = 12;

/**
 * "Did we get your services right?": what we read on the site as chips to remove, and a field to add what we missed.
 * The services decide who counts as a competitor, one service at a time.
 */
export function ServicesCard({ services, onChange }: { services: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const s = draft.trim();
    if (s && !services.some((x) => x.toLowerCase() === s.toLowerCase()) && services.length < MAX_SERVICES) onChange([...services, s]);
    setDraft("");
  };
  return (
    <section className="rounded-[24px] border border-[#ecedf5] bg-white p-[24px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" aria-labelledby="services-right">
      <h2 id="services-right" className="text-[18px] font-bold">Did we get your services right?</h2>
      <p className="mt-1 text-[13.5px] text-ink-grey">We look for your competitors service by service — remove anything wrong, add anything we missed.</p>
      {services.length === 0 ? (
        <p className="mt-4 text-sm text-ink-grey italic">None yet — add some below.</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Services">
          {services.map((s) => (
            <li key={s} className="inline-flex items-center gap-1 rounded-full bg-[#eeefff] py-0.5 pr-1 pl-3.5 text-[13px] font-medium text-primary">
              {s}
              <button type="button" onClick={() => onChange(services.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="grid size-7 place-items-center rounded-full hover:bg-white"><X size={13} aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
      <form className="mt-4 flex gap-3" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <label htmlFor="add-service" className="sr-only">Add a missing service</label>
        <input id="add-service" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a missing service" className="field-input h-[48px] min-w-0 flex-1 rounded-full border border-[#e3e6f2] bg-white px-5 text-[15px] outline-none placeholder:text-[#9aa3bd] focus:border-primary focus:ring-4 focus:ring-primary/12" />
        <button type="submit" className="inline-flex h-[48px] items-center gap-1.5 rounded-full border border-[#e3e6f2] bg-white px-5 text-sm font-semibold hover:border-primary/40"><Plus size={14} aria-hidden />Add</button>
      </form>
    </section>
  );
}
