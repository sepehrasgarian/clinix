import type { Metadata } from "next";
import { ActionPlan } from "@/components/report/ActionPlan";
import { EmptyReport } from "@/components/report/EmptyReport";
import { PageHeader } from "@/components/ui/PageHeader";
import { copy } from "@/lib/copy";
import { getClinic, getInProgress, getLatestReport } from "@/lib/api";

export const metadata: Metadata = { title: "Action plan" };

export default async function ActionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, latest] = await Promise.all([getClinic(id), getLatestReport(id)]);
  if (!latest) return <EmptyReport clinicId={id} inProgress={await getInProgress(id)} />;
  return (
    <>
      <PageHeader title={copy.actions.title} intro="Work top to bottom; your next report shows what changed." />
      <ActionPlan report={latest.report} clinicId={id} analysisId={latest.analysis.id} clinicName={clinic.name} />
    </>
  );
}
