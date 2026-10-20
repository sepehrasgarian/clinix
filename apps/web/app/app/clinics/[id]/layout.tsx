import { AppShell } from "@/components/shell/AppShell";
import { getClinic, getLatestReport, listClinics } from "@/lib/api";

export default async function ClinicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, clinics, latest] = await Promise.all([getClinic(id), listClinics(), getLatestReport(id)]);
  const competitorNames = Object.fromEntries(latest?.report.competitors.map((c) => [c.placeId, c.name]) ?? []);
  return (
    <AppShell clinic={clinic} clinics={clinics} competitorNames={competitorNames}>
      {children}
    </AppShell>
  );
}
