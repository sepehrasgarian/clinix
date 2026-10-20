import Link from "next/link";
import { ArrowRight, Building2, ListChecks, ShieldCheck, Star } from "lucide-react";
import { fixtureReport } from "@clinix/contracts/fixtures";
import { Pill } from "@/components/ui/Pill";
import { copy } from "@/lib/copy";
import { scoreTone, toneForLevel } from "@/lib/format";

/** "Real analysis. Not a sales pitch." with a market-overview card built from the sample report. */
export function AnalysisPreview() {
  const t = copy.landing.analysis;
  const r = fixtureReport;
  const dims = r.scorecard.dimensions.filter((d) => ["rating", "review_count", "review_velocity", "owner_responsiveness"].includes(d.key));
  const top = [...r.recommendations].filter((x) => x.status !== "done").sort((a, b) => (b.impact === "high" ? 1 : 0) - (a.impact === "high" ? 1 : 0)).slice(0, 3);
  const tiles = [
    { icon: Building2, value: r.competitors.length, label: t.tiles.competitors, note: t.tileNotes.competitors, tone: "success" as const },
    { icon: ShieldCheck, value: r.ledger.kept, label: t.tiles.findings, note: t.tileNotes.findings, tone: "primary" as const },
    { icon: ListChecks, value: r.recommendations.length, label: t.tiles.actions, note: t.tileNotes.actions, tone: "primary" as const },
    { icon: Star, value: r.ledger.rejected, label: t.tiles.setAside, note: t.tileNotes.setAside, tone: "warning" as const },
  ];
  const fill = { success: "bg-success", warning: "bg-warning", alert: "bg-alert", neutral: "bg-faint", primary: "bg-primary" };

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[2fr_3fr]">
        <div>
          <p className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold tracking-[0.18em] text-primary uppercase">{t.eyebrow}</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            {t.headline1}
            <br />
            <span className="bg-gradient-to-r from-[#f5b942] via-[#e9a3c9] to-[#6d5cf5] bg-clip-text text-transparent">{t.headline2}</span>
          </h2>
          <p className="mt-5 text-lg text-muted">{t.text}</p>
          <ol className="mt-8 space-y-6">
            {t.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-mono text-sm text-white">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="block text-sm text-muted">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/start" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5b942] px-6 font-semibold text-[#0b0f1f] hover:bg-[#f7c55e]">
              {t.cta} <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href="/app/clinics/clinic_demo/findings" className="inline-flex min-h-12 items-center gap-1 font-medium text-primary">
              {t.sample} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-card p-6 shadow-[0_30px_80px_-30px_rgba(14,21,38,.25)]" data-testid="market-overview">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">{t.card.title}</h3>
              <p className="text-sm text-muted">{t.card.sub}</p>
            </div>
            <span className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted">{t.card.badge}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {tiles.map(({ icon: Icon, value, label, note, tone }) => (
              <div key={label} className="rounded-xl border border-line bg-surface/60 p-4">
                <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary"><Icon size={16} aria-hidden /></span>
                <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">{value}</p>
                <p className="text-xs text-muted">{label}</p>
                <span className="mt-2 inline-block"><Pill tone={tone}>{note}</Pill></span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line p-4">
              <p className="font-semibold">{t.card.position}</p>
              <ul className="mt-3 space-y-3">
                {dims.map((d) => (
                  <li key={d.key} className="grid grid-cols-[1fr_auto_2rem] items-center gap-3 text-sm">
                    <span className="text-muted">{d.label}</span>
                    <span className="h-2 w-28 overflow-hidden rounded-full bg-surface"><span className={`block h-full rounded-full ${fill[scoreTone(d.score)]}`} style={{ width: `${d.score}%` }} /></span>
                    <span className="text-right font-mono tabular-nums">{d.score}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{t.card.opportunities}</p>
                <span className="text-xs font-medium text-primary">{t.card.seeAll} →</span>
              </div>
              <ul className="mt-3 space-y-3">
                {top.map((x) => (
                  <li key={x.id} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium leading-snug">{x.title}</span>
                      <Pill tone={toneForLevel(x.impact)}>{x.impact}</Pill>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{x.rationale}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
