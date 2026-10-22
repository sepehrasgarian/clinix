import { Clock, Search } from "lucide-react";
import type { Analysis } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { cleanWebsite } from "@/lib/website";

/** The right column while scanning: what the report will answer, the facts found so far, and how long it takes. */
export function ScanAside({ analysis, fallback }: { analysis: Analysis; fallback: { name: string; address: string; website?: string } }) {
  const t = copy.onboarding.scanning;
  const scan = analysis.scan;
  const rows: [string, string | undefined][] = [
    ["Clinic", scan?.place.name ?? fallback.name],
    ["Address", scan?.place.address ?? fallback.address],
    ["Website", cleanWebsite(scan?.place.website ?? fallback.website)?.replace(/^https?:\/\//, "")],
    ["Rating", scan?.place.rating !== undefined ? `${scan.place.rating.toFixed(1)}★` : undefined],
    ["Reviews", scan?.place.reviewCount?.toString()],
    ["Services found", scan ? String(scan.understanding.services.length) : undefined],
    ["Nearby clinics", scan && scan.nearby.length > 0 ? `${scan.nearby.length}${scan.nearbyCapped ? "+" : ""}` : undefined],
  ];
  return (
    <>
      <section className="rounded-[26px] bg-gradient-to-br from-[#1d1a4d] to-[#2c2670] p-[24px] text-white">
        <h2 className="flex items-center gap-2 text-[18px] font-bold"><Search size={17} aria-hidden />{t.willAnswer}</h2>
        <ol className="mt-4 space-y-3 text-[14px] leading-snug text-white/85">
          {t.questions.map((q, i) => <li key={q} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold">{i + 1}</span>{q}</li>)}
        </ol>
        {scan?.hints[0] && (
          <div className="mt-5 rounded-2xl bg-white/10 p-4">
            <p className="text-[11.5px] font-semibold tracking-wider text-white/70 uppercase">{t.spotted}</p>
            <p className="mt-1.5 text-[14px] font-medium">{scan.hints[0].text}</p>
          </div>
        )}
      </section>
      <section className="rounded-[26px] border border-[#ecedf5] bg-white p-[24px]" aria-labelledby="live-preview">
        <h2 id="live-preview" className="text-[18px] font-bold">{t.livePreview}</h2>
        <dl className="mt-3 divide-y divide-[#eef0f6]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-[14px]">
              <dt className="text-ink-grey">{label}</dt>
              <dd className="text-right font-semibold">{value ?? <span className="inline-block h-3.5 w-20 animate-pulse rounded bg-[#eceef6] align-middle"><span className="sr-only">{t.waiting}</span></span>}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="flex gap-3 rounded-[22px] border border-[#e6e3ff] bg-gradient-to-br from-[#f6f5ff] to-[#fbfaff] p-[20px]">
        <Clock size={18} className="mt-0.5 shrink-0 text-[#6d5cf5]" aria-hidden />
        <div>
          <h2 className="text-[15.5px] font-bold">{t.duration}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-grey">{t.durationText}</p>
        </div>
      </section>
    </>
  );
}
