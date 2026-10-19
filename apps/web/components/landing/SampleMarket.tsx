import { fixtureReport } from "@clinix/contracts/fixtures";
import { Stars } from "@/components/ui/Stars";
import { Dot } from "@/components/ui/Pill";
import { copy } from "@/lib/copy";
import { formatKm } from "@/lib/format";

/** A real-shaped sample built from the demo fixture. No fake map, no invented numbers beyond the sample. */
export function SampleMarket() {
  const t = copy.landing.sample;
  const r = fixtureReport;
  const kept = r.findings.filter((f) => f.status === "kept");
  return (
    <section className="bg-card py-20" aria-labelledby="sample-title">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <div>
          <h2 id="sample-title" className="text-2xl font-semibold tracking-tight md:text-3xl">{t.title}</h2>
          <p className="mt-3 text-muted">{t.text}</p>
          <ul className="mt-6 space-y-3">
            {kept.slice(0, 3).map((f) => (
              <li key={f.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5"><Dot tone={f.kind === "weakness" ? "success" : "alert"} /></span>
                <span>{f.claim}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-faint">{t.note}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">{t.cardTitle}</p>
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs text-success">{r.ledger.kept} {copy.findings.kept} · {r.ledger.rejected} {t.setAside}</span>
          </div>
          <ul className="mt-4 divide-y divide-line">
            <li className="flex items-center justify-between py-2.5 text-sm font-medium">
              <span>Your clinic</span>
              <span className="flex items-center gap-2 text-muted"><Stars rating={4.6} size={12} /> 4.6 · 128</span>
            </li>
            {r.competitors.map((c) => (
              <li key={c.placeId} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <span className="block">{c.name}</span>
                  <span className="block text-xs text-muted">{formatKm(c.distanceKm)} {copy.competitors.distance}</span>
                </span>
                <span className="flex items-center gap-2 text-muted"><Stars rating={c.rating ?? 0} size={12} /> {c.rating?.toFixed(1)} · {c.reviewCount}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-alert-soft p-3 text-sm text-alert">{r.scorecard.dimensions.find((d) => d.key === "owner_responsiveness")?.summary}</p>
        </div>
      </div>
    </section>
  );
}
