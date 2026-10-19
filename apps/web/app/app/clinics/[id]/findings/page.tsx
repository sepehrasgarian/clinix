import type { Metadata } from "next";
import { FindingsExplorer } from "@/components/findings/FindingsExplorer";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { getClinic, getReport, reviewsOf } from "@/lib/api";

export const metadata: Metadata = { title: "Findings – Clinix" };

export default async function FindingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, report] = await Promise.all([getClinic(id), getReport(id)]);
  const reviews = reviewsOf(report);
  return (
    <>
      <PageHeader title={copy.findings.title} intro={copy.findings.intro} />
      {report ? <FindingsExplorer report={report} reviews={reviews} clinicName={clinic.name} /> : <EmptyState text="Your first report is on its way." />}
    </>
  );
}
