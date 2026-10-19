import { Scale, ShieldCheck, Sprout } from "lucide-react";
import { copy } from "@/lib/copy";

const icons = [ShieldCheck, Scale, Sprout];

export function EvidencePromise() {
  const t = copy.landing.promise;
  return (
    <section className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="promise-title">
      <h2 id="promise-title" className="text-center text-2xl font-semibold tracking-tight md:text-3xl">{t.title}</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {t.items.map((item, i) => {
          const Icon = icons[i];
          return (
            <div key={item.title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success"><Icon size={20} aria-hidden /></span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
