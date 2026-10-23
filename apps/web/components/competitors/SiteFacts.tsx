import type { Report } from "@clinix/contracts";
import { Pill } from "@/components/ui/Pill";

/** What the rival's own website says: services (gaps highlighted), booking, hours, billing, offers, team. */
export function SiteFacts({ competitor: c }: { competitor: Report["competitors"][number] }) {
  if (c.siteStatus === "no_website") return <p className="text-sm text-muted md:col-span-2">No website on file for this clinic.</p>;
  if (c.siteStatus === "unreadable" || !c.site) return <p className="text-sm text-muted md:col-span-2">We couldn&apos;t read their website this time.</p>;
  const s = c.site;
  const gap = new Set(c.servicesNotOnYourSite);
  const facts = [
    s.booking ? (s.booking.online ? `Books online${s.booking.tool ? ` with ${s.booking.tool}` : ""}` : "Books by phone only") : null,
    s.hours ? `Hours: ${s.hours}` : null,
    s.directBilling === true ? "Direct billing" : null,
    s.newPatientOffer ? `New patients: ${s.newPatientOffer}` : null,
    s.telehealth ? "Virtual appointments" : null,
    s.languages.length > 1 ? `Languages: ${s.languages.join(", ")}` : null,
    s.team.length ? `${s.team.length} practitioners named` : null,
    s.accessibility.length ? s.accessibility.join(", ") : null,
    s.locationsCount && s.locationsCount > 1 ? `${s.locationsCount} locations` : null,
    s.pricingShown === true ? "Shows prices on their site" : null,
    s.freshness ? `Latest content: ${s.freshness}` : null,
    ...s.trustSignals,
  ].filter((f): f is string => !!f);
  return (
    <div className="md:col-span-2">
      <p className="text-xs font-semibold tracking-wide text-faint uppercase">On their website</p>
      {s.services.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Services on their site">
          {s.services.map((svc) => (
            <li key={svc}><Pill tone={gap.has(svc) ? "warning" : "neutral"}>{svc}{gap.has(svc) ? " · not on your site" : ""}</Pill></li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">Not found on their site.</p>
      )}
      {facts.length > 0 && (
        <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {facts.map((f) => <li key={f} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-faint" />{f}</li>)}
        </ul>
      )}
    </div>
  );
}
