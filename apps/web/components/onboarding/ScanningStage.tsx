import { AlertTriangle, Lightbulb, MessageSquareQuote, RotateCw, Search, Trophy } from "lucide-react";
import type { Analysis, Discipline } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { copy } from "@/lib/copy";
import { ListingCard } from "./ListingCard";
import { PhaseTimeline } from "./PhaseTimeline";
import { PrimaryButton, SetupFrame } from "./SetupFrame";
import { Sticker } from "./Sticker";
import { WaitingRadar } from "./WaitingRadar";

const questionIcons = [Search, MessageSquareQuote, Trophy];

export function ScanningStage({ analysis, disciplines = [], onRetry, retrying }: { analysis: Analysis; disciplines?: Discipline[]; onRetry: () => void; retrying?: boolean }) {
  const failed = analysis.status === "failed";
  const discovery = analysis.stage === "discovery";
  const aside = (
    <>
      <Card className="p-5">
        <div className="flex items-center gap-3">
          {disciplines.slice(0, 3).map((d) => <Sticker key={d} discipline={d} size={36} />)}
          <div>
            <h2 className="font-semibold">{analysis.scan?.place.name ?? "Your clinic"}</h2>
            <p className="text-xs text-muted">{analysis.scan ? "Found on Google" : "Looking it up…"}</p>
          </div>
        </div>
        <div className="mt-4">
          {analysis.scan ? (
            <ListingCard place={analysis.scan.place} services={analysis.scan.understanding.services.slice(0, 8)} />
          ) : (
            <div className="space-y-2" aria-hidden>
              <div className="h-28 animate-pulse rounded-xl bg-line/60" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-line/70" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-line/50" />
            </div>
          )}
        </div>
      </Card>
      {analysis.scan?.hints[0] && (
        <Card className="border-[#f5b942]/50 bg-[#fff8e6] p-5">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#8a5a00] uppercase"><Lightbulb size={14} aria-hidden /> {copy.onboarding.scanning.spotted}</p>
          <p className="mt-2 font-medium">{analysis.scan.hints[0].text}</p>
        </Card>
      )}
    </>
  );

  return (
    <SetupFrame
      step={discovery ? 2 : 1}
      title={discovery ? "Finding your competitors" : copy.onboarding.scanning.title}
      intro={discovery ? "Searching nearby and ranking who really competes for your patients. About thirty seconds." : copy.onboarding.scanning.intro}
      status={failed ? analysis.error : undefined}
      action={failed ? <PrimaryButton onClick={onRetry} disabled={retrying}>{copy.onboarding.scanning.retry}</PrimaryButton> : undefined}
      aside={aside}
    >
      <div className="flex flex-col gap-5">
        {!failed && (
          <Card className="p-6">
            <WaitingRadar stage={analysis.stage} clinicName={analysis.scan?.place.name} />
          </Card>
        )}
        {failed && (
          <Card className="border-alert/30 bg-alert-soft p-5" role="alert">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-alert text-white"><AlertTriangle size={16} aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-alert">{copy.onboarding.scanning.failed}</p>
                <p className="mt-0.5 text-sm text-ink">{analysis.error}</p>
                <button type="button" onClick={onRetry} disabled={retrying} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50">
                  <RotateCw size={16} aria-hidden className={retrying ? "animate-spin" : ""} /> {retrying ? "Retrying…" : copy.onboarding.scanning.retry}
                </button>
              </div>
            </div>
          </Card>
        )}
        <Card className="p-6">
          <PhaseTimeline phases={analysis.phases} />
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold">{copy.onboarding.scanning.willAnswer}</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {copy.onboarding.scanning.questions.map((q, i) => {
              const Icon = questionIcons[i];
              return (
                <li key={q} className="rounded-xl border border-line bg-surface/60 p-4">
                  <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary"><Icon size={16} aria-hidden /></span>
                  <p className="mt-3 text-sm leading-snug">{q}</p>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </SetupFrame>
  );
}
