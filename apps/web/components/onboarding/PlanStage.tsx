"use client";

import { useState } from "react";
import type { Discipline } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { needsDetails, recommendedPlan, type GoalId, type Needs } from "@/lib/planFinder";
import { recommendPlan, type PlanId } from "@/lib/pricing";
import { SetupFrame } from "./SetupFrame";
import { PlanResult, type Billing } from "./PlanResult";
import { PlanSteps, type PlanStep } from "./PlanSteps";
import { DetailsQuestion, GoalsQuestion, SetupQuestion } from "./PlanQuestions";

export type { Billing };
export type PlanDraft = { locations: number; goals: GoalId[]; analytics: boolean | null };
export const emptyDraft: PlanDraft = { locations: 1, goals: [], analytics: null };

/** The plan that covers this many disciplines: Essential has one, Growth up to four, Scale up to six. */
export const planFor = (disciplineCount: number): PlanId => recommendPlan({ disciplines: disciplineCount <= 1 ? 0 : disciplineCount <= 4 ? 1 : 2 }).plan;

const NOTES: Record<PlanStep, { label: string; text: string }> = {
  setup: { label: "Why we ask", text: "Plans differ in how many locations and disciplines they cover. Your price depends on both, so the recommendation starts here." },
  goals: { label: "How this affects your plan", text: "Most goals are covered by every plan. Website SEO, GEO visibility and comparing locations need specific plans — we'll tell you which, and why." },
  details: { label: "Why these questions", text: "Each of these is a feature only some plans include. Answer “Not now” if you don't need it yet — you can change plans later." },
  result: { label: "Good to know", text: "You can change your plan at any time. Nothing is charged until you confirm payment on the next step." },
};

/**
 * Step 3: a short set of questions (setup, goals, and one detail when it matters) that ends in the least expensive plan that
 * fits, with its price, the reasons, and the other plans for comparison.
 */
export function PlanStage({ clinic, disciplines, plan, billing, draft = emptyDraft, onDraft, onChange, onBack, onEditClinic, onContinue }: {
  clinic: { name: string; address: string };
  disciplines: Discipline[];
  plan: PlanId;
  billing: Billing;
  draft?: PlanDraft;
  onDraft: (next: PlanDraft) => void;
  onChange: (next: { plan: PlanId; billing: Billing }) => void;
  onBack: () => void;
  onEditClinic: () => void;
  onContinue: () => void;
}) {
  const [step, setStep] = useState<PlanStep>("setup");
  const steps: PlanStep[] = needsDetails(draft.goals) || step === "details" ? ["setup", "goals", "details", "result"] : ["setup", "goals", "result"];
  const needs: Needs = { ...draft, disciplines: disciplines.length };
  const found = recommendedPlan(needs);
  const result = step === "result";
  const t = copy.onboarding.plan;
  const go = (s: PlanStep) => setStep(s);
  const afterGoals = () => (needsDetails(draft.goals) ? "details" : "result");
  const toggleGoal = (g: GoalId) => onDraft({ ...draft, goals: draft.goals.includes(g) ? draft.goals.filter((x) => x !== g) : [...draft.goals, g] });
  const finish = (to: PlanStep) => { onChange({ plan: recommendedPlan({ ...needs, analytics: needsDetails(draft.goals) ? draft.analytics : null }).plan, billing }); go(to); };
  const note = NOTES[step];

  return (
    <SetupFrame
      step={3}
      back={{ label: step === "setup" ? copy.onboarding.steps[1] : "", onClick: step === "setup" ? onBack : () => go(step === "result" ? (needsDetails(draft.goals) ? "details" : "goals") : step === "details" ? "goals" : "setup") }}
      eyebrow={`Step 3 of 5 — ${t.stepName}`}
      title={t.title}
      intro={result ? t.resultIntro : t.intro}
      aside={result ? undefined : <aside className="rounded-[24px] border border-[#e6e3ff] bg-[#fbfaff] p-[24px]"><p className="text-[13px] font-bold tracking-[0.14em] text-primary uppercase">{note.label}</p><p className="mt-3 text-[15px] leading-relaxed text-ink-grey">{note.text}</p></aside>}
      asideWidth={400}
    >
      {!result && <PlanSteps steps={steps} current={step} onGo={go} />}
      {step === "setup" && <SetupQuestion clinic={clinic} disciplines={disciplines} locations={draft.locations} onLocations={(n) => onDraft({ ...draft, locations: n })} onEdit={onEditClinic} onBack={onBack} onNext={() => go("goals")} />}
      {step === "goals" && <GoalsQuestion goals={draft.goals} onToggle={toggleGoal} onBack={() => go("setup")} onNext={() => (afterGoals() === "result" ? finish("result") : go("details"))} />}
      {step === "details" && <DetailsQuestion analytics={draft.analytics} onAnswer={(yes) => onDraft({ ...draft, analytics: yes })} onBack={() => go("goals")} onNext={() => finish("result")} />}
      {result && <PlanResult address={clinic.address} disciplines={disciplines} needs={{ ...needs, analytics: needsDetails(draft.goals) ? draft.analytics : null }} recommended={found.plan} beyond={found.beyond} plan={plan} billing={billing} onChange={onChange} onContinue={onContinue} onAdjust={() => go("goals")} onEdit={() => go("setup")} />}
    </SetupFrame>
  );
}
