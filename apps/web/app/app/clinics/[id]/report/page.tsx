import type { Metadata } from "next";
import { EmptyReport } from "@/components/report/EmptyReport";
import { ReportPage } from "@/components/report/ReportPage";
import { PageHeader } from "@/components/ui/PageHeader";
import { getClinic, getInProgress, getLatestReport } from "@/lib/api";

export const metadata: Metadata = { title: "Report – ClinX" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, latest, inProgress] = await Promise.all([getClinic(id), getLatestReport(id), getInProgress(id)]);
  if (!latest) {
    return (
      <>
        <PageHeader title="Your report" />
        <EmptyReport clinicId={id} inProgress={inProgress} />
      </>
    );
  }
  return <ReportPage clinic={clinic} analysis={latest.analysis} report={latest.report} inProgress={inProgress} />;
}
