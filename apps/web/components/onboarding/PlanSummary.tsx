import { Building2, Layers, Pencil, Target } from "lucide-react";
import { DISCIPLINE_LABELS, type Discipline } from "@clinix/contracts";
import { cityFromAddress } from "@/lib/overview";
import { GOALS, type GoalId } from "@/lib/planFinder";

const MAX_PRIORITIES = 3;

/** What Clinx knows about the clinic, taken from the owner's own answers: locations, disciplines and goals. */
export function PlanSummary({ address, locations, disciplines, goals, onEdit }: { address: string; locations: number; disciplines: Discipline[]; goals: GoalId[]; onEdit: () => void }) {
  const city = cityFromAddress(address);
  const titles = goals.map((g) => GOALS.find((x) => x.id === g)!.title);
  return (
    <section className="rounded-[22px] border border-[#ecedf5] bg-white p-[22px] shadow-[0_18px_44px_-34px_rgba(76,70,180,.4)]" aria-labelledby="setup-summary">
      <div className="flex items-center justify-between gap-3">
        <h2 id="setup-summary" className="text-[17px] font-bold">Your clinic setup</h2>
        <button type="button" onClick={onEdit} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dfe2f1] bg-white px-4 text-[13px] font-semibold text-primary hover:border-primary/40"><Pencil size={13} aria-hidden />Edit</button>
      </div>
      <dl className="mt-4 grid gap-5 md:grid-cols-3 md:divide-x md:divide-[#eef0f6]">
        <Area icon={<Building2 size={16} />} label="Locations"><p className="text-[24px] leading-none font-bold">{locations}</p>{city && <p className="mt-1.5 text-[13px] text-ink-grey">{city}</p>}</Area>
        <Area icon={<Layers size={16} />} label="Disciplines"><p className="text-[24px] leading-none font-bold">{disciplines.length}</p><p className="mt-1.5 text-[13px] text-ink-grey">{disciplines.map((d) => DISCIPLINE_LABELS[d]).join(", ")}</p></Area>
        <Area icon={<Target size={16} />} label="Growth priorities">
          <ul className="list-disc space-y-0.5 pl-4 text-[13.5px]">{titles.slice(0, MAX_PRIORITIES).map((t) => <li key={t}>{t}</li>)}</ul>
          {titles.length > MAX_PRIORITIES && <p className="mt-1 text-[12.5px] text-ink-grey">+{titles.length - MAX_PRIORITIES} more</p>}
        </Area>
      </dl>
    </section>
  );
}

function Area({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5 md:px-5 md:first:pl-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eeefff] text-primary" aria-hidden>{icon}</span>
      <div className="min-w-0"><dt className="mb-1.5 text-[12.5px] text-ink-grey">{label}</dt><dd>{children}</dd></div>
    </div>
  );
}
