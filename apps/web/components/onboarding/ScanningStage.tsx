import { AlertTriangle, RotateCw } from "lucide-react";
import type { Analysis, PhaseId } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { ClinicCard } from "./ClinicCard";
import { ScanAside } from "./ScanAside";
import { ScanTimeline } from "./ScanTimeline";
import { PrimaryButton, SetupFrame } from "./SetupFrame";

const QUICK_SCAN: PhaseId[] = ["validate", "enrich", "understand"];

/** Step 2 while the quick scan (or the competitor search) runs: the clinic, the live steps and a preview of what was found. */
export function ScanningStage({
  analysis,
  clinic,
  onRetry,
  onBack,
  retrying,
}: {
  analysis: Analysis;
  clinic: { name: string; address: string; website?: string };
  onRetry: () => void;
  onBack?: () => void;
  retrying?: boolean;
}) {
  const t = copy.onboarding.scanning;
  const failed = analysis.status === "failed";
  const discovery = analysis.stage === "discovery";
  const place = analysis.scan?.place ?? { placeId: "", name: clinic.name, address: clinic.address, website: clinic.website };

  return (
    <SetupFrame
      step={2}
      back={{ label: copy.onboarding.steps[0], onClick: onBack, href: "/start" }}
      title={discovery ? t.discoveryTitle : t.title}
      intro={discovery ? t.discoveryIntro : t.intro}
      note={t.note}
      status={failed ? analysis.error : undefined}
      action={failed ? <PrimaryButton onClick={onRetry} disabled={retrying}>{t.retry}</PrimaryButton> : undefined}
      aside={<ScanAside analysis={analysis} fallback={clinic} />}
      asideWidth={520}
    >
      <div className="flex flex-col gap-[24px]">
        <ClinicCard place={place} />
        {failed && (
          <div className="rounded-[22px] border border-alert/30 bg-alert-soft p-5" role="alert">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-alert text-white"><AlertTriangle size={16} aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-alert">{t.failed}</p>
                <p className="mt-0.5 text-sm text-ink">{analysis.error}</p>
                <button type="button" onClick={onRetry} disabled={retrying} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50">
                  <RotateCw size={16} aria-hidden className={retrying ? "animate-spin" : ""} /> {retrying ? "Retrying…" : t.retry}
                </button>
              </div>
            </div>
          </div>
        )}
        <ScanTimeline phases={analysis.phases} ids={discovery ? ["discover"] : QUICK_SCAN} />
        <p className="text-[13.5px] text-ink-grey">{t.notYours} <a className="font-semibold text-primary hover:underline" href="mailto:support@clinx.app">{t.tellUs}</a></p>
      </div>
    </SetupFrame>
  );
}
