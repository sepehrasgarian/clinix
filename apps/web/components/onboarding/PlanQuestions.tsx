import clsx from "clsx";
import { ArrowLeft, Building2, Lightbulb, LineChart, MapPin, Minus, PanelTop, Plus, Search, Sparkles, UserPlus } from "lucide-react";
import { DISCIPLINE_LABELS, type Discipline } from "@clinix/contracts";
import { ANALYTICS_QUESTION, GOALS, type GoalId } from "@/lib/planFinder";
import { PrimaryButton } from "./SetupFrame";

export const MAX_LOCATIONS = 10;
const card = "rounded-[22px] border border-[#ecedf5] bg-white p-[28px] shadow-[0_24px_60px_-44px_rgba(76,70,180,.4)]";
const ghost = "inline-flex h-[44px] items-center gap-2 rounded-full border border-[#dfe2f1] bg-white px-[20px] text-[14px] font-semibold hover:border-primary/40";

function Footer({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-7 flex items-center justify-between gap-3">
      <button type="button" onClick={onBack} className={ghost}><ArrowLeft size={15} aria-hidden />Back</button>
      {children}
    </div>
  );
}

/** First question: the clinic as we have it, its disciplines, and how many locations. */
export function SetupQuestion({ clinic, disciplines, locations, onLocations, onEdit, onBack, onNext }: { clinic: { name: string; address: string }; disciplines: Discipline[]; locations: number; onLocations: (n: number) => void; onEdit: () => void; onBack: () => void; onNext: () => void }) {
  return (
    <section className={card} aria-labelledby="q-setup">
      <h2 id="q-setup" className="text-[18px] font-bold">Your clinic setup</h2>
      <p className="mt-1 text-[13.5px] text-ink-grey">One question before we look at your goals.</p>
      <div className="mt-5 rounded-[16px] bg-[#f6f7fb] px-4 py-3"><p className="text-[14px] font-bold">{clinic.name}</p><p className="mt-0.5 text-[13px] text-ink-grey">{clinic.address}</p></div>
      <div className="mt-6 flex items-center justify-between gap-3"><h3 className="text-[14.5px] font-bold">Disciplines you offer</h3><button type="button" onClick={onEdit} className="text-[13px] font-semibold text-primary hover:underline">Edit</button></div>
      <p className="mt-1 text-[13px] text-ink-grey">As you told us. Each one is compared with its own local competitors.</p>
      <div className="mt-3 flex flex-wrap gap-2">{disciplines.map((d) => <span key={d} className="rounded-full bg-[#f0f1f7] px-3.5 py-1.5 text-[13px] font-medium">{DISCIPLINE_LABELS[d]}</span>)}</div>
      <h3 className="mt-6 text-[14.5px] font-bold" id="loc-label">How many locations do you have?</h3>
      <div role="group" aria-labelledby="loc-label" className="mt-3 inline-flex items-center rounded-full border border-[#dfe2f1] bg-white">
        <button type="button" aria-label="Fewer locations" disabled={locations <= 1} onClick={() => onLocations(locations - 1)} className="grid size-[44px] place-items-center text-ink disabled:text-faint"><Minus size={16} aria-hidden /></button>
        <output aria-live="polite" className="w-12 text-center text-[18px] font-bold tabular-nums">{locations}</output>
        <button type="button" aria-label="More locations" disabled={locations >= MAX_LOCATIONS} onClick={() => onLocations(locations + 1)} className="grid size-[44px] place-items-center text-ink disabled:text-faint"><Plus size={16} aria-hidden /></button>
      </div>
      <Footer onBack={onBack}><PrimaryButton pill onClick={onNext}>Continue</PrimaryButton></Footer>
    </section>
  );
}

const ICONS: Record<GoalId, typeof Search> = { patients: UserPlus, competitors: Search, google: MapPin, seo: PanelTop, geo: Sparkles, growth: Lightbulb, track: LineChart, compare: Building2 };

/** Second question: what the owner wants help with, any number of goals. */
export function GoalsQuestion({ goals, onToggle, onBack, onNext }: { goals: GoalId[]; onToggle: (g: GoalId) => void; onBack: () => void; onNext: () => void }) {
  return (
    <section className={card} aria-labelledby="q-goals">
      <h2 id="q-goals" className="text-[18px] font-bold">What would you like Clinx to help you achieve?</h2>
      <p className="mt-1 text-[13.5px] text-ink-grey">Choose all that apply.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Goals">
        {GOALS.map((g) => {
          const on = goals.includes(g.id);
          const Icon = ICONS[g.id];
          return (
            <button key={g.id} type="button" role="checkbox" aria-checked={on} onClick={() => onToggle(g.id)} className={clsx("flex items-start gap-4 rounded-[18px] border p-[14px] text-left transition-colors", on ? "border-primary bg-[#f7f7ff]" : "border-[#e8eaf3] bg-white hover:border-[#cfd3ea]")}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f0f1f7] text-ink" aria-hidden><Icon size={15} /></span>
              <span className="min-w-0 flex-1"><span className="block text-[14.5px] leading-snug font-bold">{g.title}</span><span className="mt-0.5 block text-[13px] leading-snug text-ink-grey">{g.sub}</span></span>
              <span className={clsx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-primary bg-primary" : "border-[#d3d7e6]")} aria-hidden>{on && <span className="size-1.5 rounded-full bg-white" />}</span>
            </button>
          );
        })}
      </div>
      <Footer onBack={onBack}><PrimaryButton pill onClick={onNext} disabled={goals.length === 0}>Continue</PrimaryButton></Footer>
    </section>
  );
}

/** Third question, only when it can change the plan: whether to connect analytics. */
export function DetailsQuestion({ analytics, onAnswer, onBack, onNext }: { analytics: boolean | null; onAnswer: (yes: boolean) => void; onBack: () => void; onNext: () => void }) {
  const pill = (on: boolean) => clsx("h-[44px] rounded-full border px-6 text-[14px] font-semibold", on ? "border-primary bg-[#eeefff] text-primary" : "border-[#dfe2f1] bg-white hover:border-primary/40");
  return (
    <section className={card} aria-labelledby="q-details">
      <h2 id="q-details" className="text-[18px] font-bold">A few details</h2>
      <p className="mt-1 text-[13.5px] text-ink-grey">Only what changes which plan fits.</p>
      <div className="mt-5 rounded-[18px] border border-[#ecedf5] p-[18px]" role="group" aria-labelledby="ga-q">
        <h3 id="ga-q" className="text-[15px] font-bold">{ANALYTICS_QUESTION}</h3>
        <p className="mt-1 text-[13px] text-ink-grey">Your own traffic and search data in each report, so actions are checked against real visits.</p>
        <div className="mt-4 flex gap-3">
          <button type="button" aria-pressed={analytics === true} onClick={() => onAnswer(true)} className={pill(analytics === true)}>Yes</button>
          <button type="button" aria-pressed={analytics === false} onClick={() => onAnswer(false)} className={pill(analytics === false)}>Not now</button>
        </div>
      </div>
      <Footer onBack={onBack}><PrimaryButton pill onClick={onNext} disabled={analytics === null}>See my recommendation</PrimaryButton></Footer>
    </section>
  );
}
