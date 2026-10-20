import type { Metadata } from "next";
import { Dashboard } from "@/components/report/Dashboard";
import { EmptyReport } from "@/components/report/EmptyReport";
import { PageHeader } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { getClinic, getInProgress, getLatestReport } from "@/lib/api";

export const metadata: Metadata = { title: "Dashboard – ClinX" };

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, latest] = await Promise.all([getClinic(id), getLatestReport(id)]);
  if (!latest) {
    return (
      <>
        <PageHeader title={copy.dashboard.title} />
        <EmptyReport clinicId={id} inProgress={await getInProgress(id)} />
      </>
    );
  }
  return <Dashboard clinic={clinic} analysis={latest.analysis} report={latest.report} />;
}
