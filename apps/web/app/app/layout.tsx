import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getLatestReport, listClinics } from "@/lib/api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [clinic] = await listClinics();
  if (!clinic) redirect("/start");
  const latest = await getLatestReport(clinic.id);
  const competitorNames = Object.fromEntries(latest?.report.competitors.map((c) => [c.placeId, c.name]) ?? []);
  return (
    <AppShell clinic={clinic} competitorNames={competitorNames}>
      {children}
    </AppShell>
  );
}
