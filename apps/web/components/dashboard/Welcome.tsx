import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DISCIPLINE_LABELS, type Clinic } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import type { CompetitorRow } from "@/lib/dashboard";
import { formatKm } from "@/lib/format";
import { panel } from "./panel";

/** State A: nothing has been analyzed yet. What Clinx will do, which clinic it is about, and one way forward. */
export function Welcome({ clinic, competitors }: { clinic: Clinic; competitors: CompetitorRow[] }) {
  const t = copy.dashboard.welcome;
  return (
    <section className={`${panel} grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]`} aria-labelledby="welcome-title">
      <div>
        <h2 id="welcome-title" className="text-[24px] leading-tight font-bold tracking-tight">{t.title}</h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{t.text}</p>
        <Link href="/start" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#4338ca] to-[#5b5cf0] px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-14px_rgba(67,56,202,.9)] hover:brightness-110">{t.action} <ArrowRight size={16} aria-hidden /></Link>
      </div>
      <div className="rounded-2xl border border-[#eef0f7] bg-[#fbfbff] p-5">
        <p className="text-xs font-semibold tracking-[0.12em] text-faint uppercase">{t.clinic}</p>
        <p className="mt-1 font-semibold">{clinic.name}</p>
        <p className="text-[13px] text-muted">{clinic.address}, {clinic.city}</p>
        <p className="mt-2 text-[13px] text-muted">{clinic.disciplines.map((d) => DISCIPLINE_LABELS[d]).join(" · ")}{clinic.services.length > 0 && ` · ${clinic.services.length} ${t.services}`}</p>
        {competitors.length > 0 && (
          <>
            <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-faint uppercase">{t.competitors}</p>
            <ul className="mt-1 space-y-1 text-[13.5px]">
              {competitors.slice(0, 4).map((c) => <li key={c.placeId} className="flex justify-between gap-3"><span className="truncate">{c.name}</span><span className="shrink-0 text-muted tabular-nums">{formatKm(c.distanceKm)}</span></li>)}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
