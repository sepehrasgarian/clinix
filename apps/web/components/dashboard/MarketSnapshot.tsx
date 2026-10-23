"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, BarChart3 } from "lucide-react";
import { copy } from "@/lib/copy";
import { median } from "@/lib/report";
import type { MarketSnapshot as Snapshot } from "@/lib/dashboard";
import { panel } from "./panel";

type Tab = "reviews" | "rating" | "visibility" | "coverage";

/** One metric at a time, each on its own scale: review counts against the largest count, ratings against 5. Sorted by the metric. */
function Bars({ rows, max, format, median }: { rows: { name: string; isYou: boolean; value: number }[]; max: number; format: (n: number) => string; median: number | null }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  return (
    <ul className="mt-4 space-y-3" aria-live="polite">
      {sorted.map((r) => (
        <li key={r.name + r.isYou} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] items-center gap-3 text-[13px]">
          <span tabIndex={0} className={clsx("truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary", r.isYou && "font-semibold text-primary")} title={r.name}>{r.isYou ? `Your clinic (${r.name})` : r.name}</span>
          <span className="relative h-2 rounded-full bg-[#eef0f7]"><span className={clsx("block h-full rounded-full", r.isYou ? "bg-primary" : "bg-[#c3c7da]")} style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />{median !== null && <span aria-hidden className="absolute -top-2 -bottom-2 border-l border-dashed border-[#8a93a3]" style={{ left: `${Math.min(100, (median / max) * 100)}%` }} />}</span>
          <span className={clsx("w-10 text-right tabular-nums", r.isYou && "font-semibold")}>{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Two figures patients compare in Google Maps, each from one source and one definition. No blended score. */
export function MarketSnapshot({ snapshot, reportHref }: { snapshot: Snapshot; reportHref: string }) {
  const t = copy.dashboard.market;
  const [tab, setTab] = useState<Tab>("reviews");
  const rated = snapshot.rows.filter((r) => r.rating !== undefined).map((r) => ({ name: r.name, isYou: r.isYou, value: r.rating! }));
  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: "reviews", label: t.reviews },
    { key: "rating", label: t.rating, disabled: rated.length < 2 },
    { key: "visibility", label: t.visibility, disabled: true },
    { key: "coverage", label: t.coverage, disabled: snapshot.coverage.length < 2 },
  ];
  const active = tabs.find((x) => x.key === tab && !x.disabled)?.key ?? "reviews";
  const coverageRivals = snapshot.coverage.filter((c) => !c.isYou).map((c) => c.value);
  const coverageMedian = coverageRivals.length ? median(coverageRivals) : null;
  const medianOf = { reviews: snapshot.medianReviews.toLocaleString("en-CA"), rating: snapshot.medianRating?.toFixed(1) ?? "–", visibility: "–", coverage: String(median(snapshot.coverage.filter((c) => !c.isYou).map((c) => c.value))) };
  return (
    <section className={`${panel} p-6`} aria-labelledby="market-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1f0ff] text-primary" aria-hidden><BarChart3 size={19} strokeWidth={1.5} /></span>
          <div><h2 id="market-title" className="text-[18px] font-semibold text-[#111b35]">{t.title}</h2><p className="text-[13px] text-muted">{t.sub}</p></div>
        </div>
        <Link href={reportHref} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary">{t.open} <ArrowRight size={14} aria-hidden /></Link>
      </div>
      <div role="tablist" aria-label={t.title} className="mt-4 flex flex-wrap gap-1.5">
        {tabs.map((x) => (
          <button key={x.key} type="button" role="tab" id={`market-tab-${x.key}`} aria-selected={active === x.key} aria-controls="market-panel" disabled={x.disabled} title={x.disabled ? t.notMeasured : undefined} onClick={() => setTab(x.key)} className={clsx("min-h-9 rounded-lg px-3.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-45", active === x.key ? "border-b-2 border-primary bg-[#f1f0ff] text-primary" : "text-muted hover:bg-[#f7f8fc]")}>{x.label}</button>
        ))}
      </div>
      <div role="tabpanel" id="market-panel" aria-labelledby={`market-tab-${active}`}>
        {active === "reviews"
          ? <Bars rows={snapshot.rows.map((r) => ({ name: r.name, isYou: r.isYou, value: r.reviewCount }))} max={snapshot.maxReviews} format={(n) => n.toLocaleString("en-CA")} median={snapshot.medianReviews} />
          : active === "rating" ? <Bars rows={rated} max={5} format={(n) => n.toFixed(1)} median={snapshot.medianRating} />
            : <Bars rows={snapshot.coverage} max={Math.max(1, ...snapshot.coverage.map((c) => c.value))} format={(n) => String(n)} median={coverageMedian} />}
        <p className="mt-4 text-xs text-muted">{t.rivalMedian}: {medianOf[active]}</p>
      </div>
    </section>
  );
}
