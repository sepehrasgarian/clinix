import { ClipboardCheck, ListChecks, MapPinned, Search } from "lucide-react";
import { copy } from "@/lib/copy";

const icons = [Search, MapPinned, ClipboardCheck, ListChecks];

export function HowItWorks() {
  const t = copy.landing.how;
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="how-title">
      <h2 id="how-title" className="text-center text-2xl font-semibold tracking-tight md:text-3xl">{t.title}</h2>
      <ol className="mt-12 grid gap-6 md:grid-cols-4">
        {t.steps.map((s, i) => {
          const Icon = icons[i];
          return (
            <li key={s.title} className="rounded-[var(--radius-card)] border border-line bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><Icon size={20} aria-hidden /></span>
                <span className="font-mono text-sm text-faint">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
