import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PhaseList } from "@/components/onboarding/PhaseList";
import { copy } from "@/lib/copy";
import { getAnalysis } from "@/lib/api";
import { RunPoller } from "./RunPoller";

export default async function RunPage({ params }: { params: Promise<{ id: string; aid: string }> }) {
  const { id, aid } = await params;
  const analysis = await getAnalysis(id, aid);
  const done = analysis.status === "succeeded";
  return (
    <>
      <PageHeader title={done ? copy.onboarding.run.done : copy.onboarding.run.title} intro={done ? undefined : copy.onboarding.run.intro}>
        {done && <Link href={`/app/clinics/${id}/findings`} className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-white">{copy.onboarding.run.open}</Link>}
      </PageHeader>
      <Card className="max-w-xl p-6">
        <PhaseList phases={analysis.phases} />
        {analysis.status === "failed" && <p className="mt-4 rounded-lg bg-alert-soft p-3 text-sm text-alert">{analysis.error}</p>}
      </Card>
      {!done && analysis.status !== "failed" && <RunPoller />}
    </>
  );
}
