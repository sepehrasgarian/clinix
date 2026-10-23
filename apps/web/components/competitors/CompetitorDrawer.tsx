"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { DISCIPLINE_LABELS, type Report } from "@clinix/contracts";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { compareReviews, type Competitor } from "@/lib/competitorList";
import { formatKm } from "@/lib/format";
import { Comparison, Rating } from "./CompetitorRows";
import { SiteFacts } from "./SiteFacts";

const heading = "text-xs font-semibold tracking-[0.08em] text-[#66718b] uppercase";

/** One competitor in full: where it stands against the clinic, what its patients say, and its site. Only kept findings are shown. */
export function CompetitorDrawer({ competitor: c, report, yours, yourServices, findingsHref, onClose }: { competitor: Competitor; report: Report; yours: { reviews?: number; rating?: number }; yourServices?: number; findingsHref: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const findings = report.findings.filter((f) => f.competitorPlaceId === c.placeId && f.status === "kept");
  const strengths = findings.filter((f) => f.kind === "strength");
  const gaps = findings.filter((f) => f.kind === "weakness" || f.kind === "admin_friction" || f.kind === "unmet_demand");
  const review = findings.flatMap((f) => f.evidence).map((e) => report.reviews.find((r) => r.id === e.reviewId)).find(Boolean);
  const cmp = compareReviews(c.reviewCount, yours.reviews);
  const rows: [string, string, string][] = [
    ["Google reviews", yours.reviews?.toLocaleString("en-CA") ?? "–", c.reviewCount?.toLocaleString("en-CA") ?? "–"],
    ["Google rating", yours.rating?.toFixed(1) ?? "–", c.rating?.toFixed(1) ?? "–"],
    ["Services on their site", yourServices?.toString() ?? "–", c.site ? String(c.site.services.length) : "–"],
  ];
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#101936]/25" role="dialog" aria-modal="true" aria-labelledby="competitor-title" onClick={onClose}>
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[#e5e9f2] p-6">
          <div className="min-w-0">
            <p className={heading}>Competitor</p>
            <h2 id="competitor-title" className="mt-1 text-xl leading-snug font-semibold text-[#101936]">{c.name}</h2>
            <p className="mt-1 text-sm text-[#66718b]">{formatKm(c.distanceKm)} away · {c.disciplines.map((d) => DISCIPLINE_LABELS[d]).join(" · ")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-[#f7f8fc]"><X size={18} strokeWidth={1.5} /></button>
        </div>
        <div className="flex-1 space-y-7 overflow-y-auto p-6">
          <section aria-label="Overview" className="flex flex-wrap items-center gap-x-8 gap-y-3"><Rating c={c} /><Comparison c={c} yours={yours.reviews} /></section>
          <section>
            <h3 className={heading}>You compared with this clinic</h3>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-xs text-[#66718b]"><th scope="col" className="py-1.5 text-left font-medium">Measure</th><th scope="col" className="py-1.5 text-right font-medium">You</th><th scope="col" className="py-1.5 text-right font-medium">Them</th></tr></thead>
              <tbody>{rows.map(([label, you, them]) => <tr key={label} className="border-t border-[#eef0f6]"><th scope="row" className="py-2 text-left font-normal text-[#66718b]">{label}</th><td className="py-2 text-right font-semibold tabular-nums">{you}</td><td className="py-2 text-right font-semibold tabular-nums">{them}</td></tr>)}</tbody>
            </table>
            {cmp.kind !== "unknown" && <p className="mt-2 text-xs text-[#66718b]">Review counts are the totals on Google, not the reviews Clinx read ({c.reviewsAnalyzed} for this clinic).</p>}
          </section>
          <section>
            <h3 className={heading}>What their patients say</h3>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <div><p className="text-sm font-semibold text-[#101936]">Strengths</p><ul className="mt-1.5 space-y-1.5 text-sm">{strengths.length ? strengths.slice(0, 4).map((f) => <li key={f.id}>{f.claim}</li>) : <li className="text-[#66718b]">None found.</li>}</ul></div>
              <div><p className="text-sm font-semibold text-[#101936]">Gaps you can use</p><ul className="mt-1.5 space-y-1.5 text-sm">{gaps.length ? gaps.slice(0, 4).map((f) => <li key={f.id}>{f.claim}</li>) : <li className="text-[#66718b]">None found.</li>}</ul></div>
            </div>
            {review && <div className="mt-4"><EvidenceCard review={review} quote={review.text.slice(0, 140)} sourceName={c.name} /></div>}
          </section>
          <section className="grid"><SiteFacts competitor={c} /></section>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-[#e5e9f2] p-6">
          <Link href={findingsHref} className="inline-flex min-h-11 items-center rounded-xl bg-[#5145e8] px-5 text-sm font-semibold text-white hover:bg-[#4338ca]">View complete analysis</Link>
          {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary">Their website <ExternalLink size={14} aria-hidden /></a>}
        </div>
      </div>
    </div>
  );
}
