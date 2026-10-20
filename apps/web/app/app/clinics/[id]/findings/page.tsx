import type { Metadata } from "next";
import { FindingsExplorer } from "@/components/findings/FindingsExplorer";
import { EmptyReport } from "@/components/report/EmptyReport";
import { PageHeader } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { getClinic, getInProgress, getLatestReport } from "@/lib/api";

export const metadata: Metadata = { title: "Findings – ClinX" };

export default async function FindingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, latest] = await Promise.all([getClinic(id), getLatestReport(id)]);
  return (
    <>
      <PageHeader title={copy.findings.title} intro={copy.findings.intro} />
      {latest ? <FindingsExplorer report={latest.report} reviews={latest.report.reviews} clinicName={clinic.name} disciplines={clinic.disciplines} /> : <EmptyReport clinicId={id} inProgress={await getInProgress(id)} />}
    </>
  );
}
