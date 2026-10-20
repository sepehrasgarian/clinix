import Link from "next/link";
import type { Analysis } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { PhaseList } from "@/components/onboarding/PhaseList";
import { copy } from "@/lib/copy";

/** What every report screen shows before the first report exists: the real state of the work, never a placeholder report. */
export function EmptyReport({ clinicId, inProgress }: { clinicId: string; inProgress: Analysis | null }) {
  if (!inProgress) {
    return (
      <Card className="max-w-xl p-6">
        <h2 className="font-semibold">{copy.report.noneTitle}</h2>
        <p className="mt-1 text-sm text-muted">{copy.report.noneText}</p>
        <Link href="/start" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">{copy.report.start}</Link>
      </Card>
    );
  }
  const waiting = inProgress.status === "awaiting_services" || inProgress.status === "awaiting_competitors";
  const failed = inProgress.status === "failed";
  return (
    <Card className="max-w-xl p-6">
      <h2 className="font-semibold">{waiting ? copy.report.waitingTitle : failed ? copy.report.failedTitle : copy.report.runningTitle}</h2>
      <p className="mt-1 text-sm text-muted">{waiting ? copy.report.waitingText : failed ? inProgress.error : copy.report.runningText}</p>
      <div className="mt-4"><PhaseList phases={inProgress.phases} /></div>
      <Link href={waiting ? "/start" : `/app/clinics/${clinicId}/run/${inProgress.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">
        {waiting ? copy.report.continueSetup : copy.report.openRun}
      </Link>
    </Card>
  );
}
