import { Building2, ClipboardList, MapPin, MessageSquareQuote } from "lucide-react";
import { copy } from "@/lib/copy";

const icons = [Building2, MapPin, MessageSquareQuote, ClipboardList];
const dotColors = ["bg-[#f5b942] text-[#0b0f1f]", "bg-primary text-white", "bg-primary text-white", "bg-primary text-white"];

/** Four steps along a curved path. Odd steps sit above the line, even steps below. */
export function HowItWorks() {
  const t = copy.landing.how;
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-24" aria-labelledby="how-title">
      <p className="text-center text-xs font-semibold tracking-[0.18em] text-primary uppercase">{t.eyebrow}</p>
      <h2 id="how-title" className="mt-3 text-center text-4xl font-semibold tracking-tight md:text-5xl">
        {t.headline1} <span className="text-primary">{t.headline2}</span>
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted">{t.sub}</p>

      <div className="relative mt-16">
        <svg aria-hidden viewBox="0 0 1200 160" className="absolute inset-x-0 top-1/2 hidden h-40 w-full -translate-y-1/2 md:block" preserveAspectRatio="none">
          <defs>
            <linearGradient id="path" x1="0" x2="1">
              <stop offset="0" stopColor="#6d5cf5" />
              <stop offset="0.6" stopColor="#3b82f6" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M0,90 C150,20 250,140 400,80 S700,20 850,80 S1100,150 1200,60" fill="none" stroke="url(#path)" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <ol className="grid gap-6 md:grid-cols-4">
          {t.steps.map((s, i) => {
            const Icon = icons[i];
            const below = i % 2 === 1;
            return (
              <li key={s.title} className={`relative flex flex-col ${below ? "md:pt-24" : "md:pb-24"}`}>
                <span className={`absolute left-1/2 hidden size-10 -translate-x-1/2 place-items-center rounded-full font-mono text-xs font-semibold shadow-[0_0_0_8px_rgba(109,92,245,.12)] md:grid ${dotColors[i]} ${below ? "top-5" : "bottom-5"}`}>0{i + 1}</span>
                <div className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-start gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Icon size={20} aria-hidden /></span>
                    <div>
                      <h3 className="font-semibold leading-snug">{s.title}</h3>
                      <p className="mt-1 text-sm text-muted">{s.text}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface/70 px-3 py-2.5 text-sm">
                    <span>
                      <span className="block font-medium">{s.card}</span>
                      <span className="block text-xs text-muted">{s.cardSub}</span>
                    </span>
                    <span aria-hidden className="text-faint">›</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
