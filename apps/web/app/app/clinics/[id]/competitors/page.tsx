import type { Metadata } from "next";
import { CompetitorsSection } from "@/components/report/CompetitorsSection";
import { EmptyReport } from "@/components/report/EmptyReport";
import { PageHeader } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { getClinic, getInProgress, getLatestReport } from "@/lib/api";

export const metadata: Metadata = { title: "Competitors – ClinX" };

export default async function CompetitorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, latest] = await Promise.all([getClinic(id), getLatestReport(id)]);
  if (!latest) return <EmptyReport clinicId={id} inProgress={await getInProgress(id)} />;
  return (
    <>
      <PageHeader title={copy.competitors.title} intro={copy.competitors.intro} />
      <CompetitorsSection report={latest.report} disciplines={clinic.disciplines} />
    </>
  );
}
