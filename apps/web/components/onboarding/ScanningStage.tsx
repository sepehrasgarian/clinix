import type { Analysis } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { copy } from "@/lib/copy";
import { ListingCard } from "./ListingCard";
import { PhaseList } from "./PhaseList";
import { PrimaryButton, SetupFrame } from "./SetupFrame";

export function ScanningStage({ analysis, onRetry, retrying }: { analysis: Analysis; onRetry: () => void; retrying?: boolean }) {
  const failed = analysis.status === "failed";
  return (
    <SetupFrame
      step={1}
      title={copy.onboarding.scanning.title}
      intro={copy.onboarding.scanning.intro}
      status={failed ? analysis.error : undefined}
      action={failed ? <PrimaryButton onClick={onRetry} disabled={retrying}>{copy.onboarding.scanning.retry}</PrimaryButton> : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <PhaseList phases={analysis.phases} />
            {failed && <p className="mt-4 rounded-lg bg-alert-soft p-3 text-sm text-alert">{copy.onboarding.scanning.failed} {analysis.error}</p>}
          </Card>
          {analysis.scan?.hints[0] && (
            <Card className="border-primary/30 bg-primary-soft/40 p-5">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">{copy.onboarding.scanning.spotted}</p>
              <p className="mt-1 font-medium">{analysis.scan.hints[0].text}</p>
            </Card>
          )}
          <Card className="p-6">
            <h2 className="font-semibold">{copy.onboarding.scanning.willAnswer}</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted">
              {copy.onboarding.scanning.questions.map((q, i) => (
                <li key={q} className="flex gap-3"><span className="font-mono text-primary">{i + 1}</span>{q}</li>
              ))}
            </ol>
          </Card>
        </div>
        <ListingCard place={analysis.scan?.place ?? null} services={analysis.scan?.understanding.services.slice(0, 8) ?? []} />
      </div>
    </SetupFrame>
  );
}
