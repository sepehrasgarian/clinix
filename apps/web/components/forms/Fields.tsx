import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export const inputClass = "h-[44px] w-full rounded-2xl border border-[#e3e6ee] bg-white px-4 text-[15px] text-ink outline-none placeholder:text-[#9aa3bd] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20";

/** A label above a control. `ok` adds a green tick once the value is valid. */
export function Field({ id, label, ok, children }: { id: string; label: string; ok?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-ink">{label}{ok && <Check size={14} className="text-success" aria-label="valid" />}</label>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

export type Option = { value: string; label: string; lang?: string };

/** A native select with the app's chevron. Shows `placeholder` until a value is chosen. */
export function Select({ id, value, onChange, options, placeholder }: { id: string; value: string; onChange: (v: string) => void; options: readonly Option[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={clsx(inputClass, "appearance-none pr-10", value === "" && "text-[#6b7487]")}>
        {value === "" && placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} lang={o.lang}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink" />
    </div>
  );
}
