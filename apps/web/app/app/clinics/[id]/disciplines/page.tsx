import type { Metadata } from "next";
import { DisciplineTabs } from "@/components/report/DisciplineTabs";
import { EmptyReport } from "@/components/report/EmptyReport";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { getClinic, getInProgress, getLatestReport } from "@/lib/api";

export const metadata: Metadata = { title: "Disciplines – ClinX" };

export default async function DisciplinesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, latest] = await Promise.all([getClinic(id), getLatestReport(id)]);
  return (
    <>
      <PageHeader title={copy.disciplines.title} intro={copy.disciplines.intro} />
      {!latest ? (
        <EmptyReport clinicId={id} inProgress={await getInProgress(id)} />
      ) : latest.report.disciplines.length === 0 ? (
        <EmptyState text={copy.disciplines.none} />
      ) : (
        <DisciplineTabs report={latest.report} analysis={latest.analysis} clinicName={clinic.name} clinicId={id} analysisId={latest.analysis.id} />
      )}
    </>
  );
}
