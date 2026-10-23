import { AppShell } from "@/components/shell/AppShell";
import { getClinic, getLatestReport, listClinics } from "@/lib/api";
import { distinctClinics } from "@/lib/clinics";

export default async function ClinicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, clinics, latest] = await Promise.all([getClinic(id), listClinics(), getLatestReport(id)]);
  const competitorNames = Object.fromEntries(latest?.report.competitors.map((c) => [c.placeId, c.name]) ?? []);
  return (
    <AppShell clinic={clinic} clinics={distinctClinics(clinics, clinic.id)} competitorNames={competitorNames} locked={!latest} site={latest?.analysis.scan?.place.website} hasChanges={(latest?.report.diff?.newFindingIds.length ?? 0) > 0}>
      {children}
    </AppShell>
  );
}
