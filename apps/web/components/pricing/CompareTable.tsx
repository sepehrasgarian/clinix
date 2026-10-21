"use client";

import { Check, ChevronDown, Minus } from "lucide-react";
import { useState } from "react";
import { useLanding } from "@/components/i18n/LangProvider";


/** "Compare plans in detail": a button that opens a feature-by-plan table. */
export function CompareTable() {
  const page = useLanding().pricingPage;
  const t = page.compare;
  const names = page.plans.map((p) => p.name);
  const [open, setOpen] = useState(false);
  return (
    <section className="mx-auto w-[min(1000px,100%-3rem)] text-center" aria-labelledby="compare-title">
      <h2 id="compare-title" className="text-3xl font-bold tracking-[-0.03em]">{t.title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-grey">{t.text}</p>
      <button type="button" aria-expanded={open} aria-controls="compare-table" onClick={() => setOpen((o) => !o)} className="mt-7 inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-[#3730a3] shadow-sm hover:bg-surface">
        {open ? t.hide : t.show}<ChevronDown size={15} className={open ? "rotate-180" : ""} aria-hidden />
      </button>
      {open && (
        <div id="compare-table" className="mt-8 overflow-x-auto rounded-3xl border border-[#ecedf5] bg-white text-left shadow-[0_22px_50px_-40px_rgba(76,70,180,.4)]">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-[#ecedf5]"><th scope="col" className="p-4 text-xs font-bold tracking-[0.16em] text-faint uppercase">{t.feature}</th>{names.map((n) => <th key={n} scope="col" className="p-4 text-center font-bold">{n}</th>)}</tr></thead>
            <tbody>
              {t.rows.map((r) => (
                <tr key={r.label} className="border-b border-[#f1f2f7] last:border-0">
                  <th scope="row" className="p-4 font-medium">{r.label}</th>
                  {r.values.map((v, i) => (
                    <td key={names[i]} className="p-4 text-center">
                      {typeof v === "string" ? <span className="font-semibold">{v}</span> : v ? <Check size={16} className="mx-auto text-success" aria-label={t.yes} /> : <Minus size={16} className="mx-auto text-[#c9cedd]" aria-label={t.no} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
