"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, BarChart3, Check, ChevronRight, CreditCard, ExternalLink, FileText, Lightbulb, MessageSquareText, Building2 } from "lucide-react";
import type { Clinic } from "@clinix/contracts";
import { formatDate } from "@/lib/format";
import { panel } from "./panel";

const STORAGE_KEY = "clinix.onboarding";

const STEPS = [
  { title: "Your clinic", short: "Your clinic", href: "/onboarding" },
  { title: "What we found", short: "What we found", href: "/start" },
  { title: "Plan & pricing", short: "Plan & pricing", href: "/start" },
  { title: "Payment", short: "Payment", href: "/start" },
  { title: "Connect", short: "Connect your data", href: "/start" },
] as const;

const PENDING_STEP = { plan: 3, payment: 4, connect: 5 } as const;

type Progress = { step: number; savedAt: string | null };

/** Where the owner left off: the saved setup tells the step, the clinic itself is always step 1 done. */
function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { step: 2, savedAt: null };
    const saved = JSON.parse(raw) as { pending?: { step: keyof typeof PENDING_STEP } };
    const file = saved.pending ? PENDING_STEP[saved.pending.step] : 2;
    return { step: file ?? 2, savedAt: null };
  } catch {
    return { step: 2, savedAt: null };
  }
}

const card = `${panel} flex flex-col p-6`;
const primaryBtn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4338ca] to-[#5b5cf0] px-6 text-[15px] font-semibold text-white shadow-[0_12px_26px_-14px_rgba(67,56,202,.95)] hover:brightness-110";
const outlineBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9dcf0] bg-white px-5 text-sm font-semibold text-primary hover:border-primary/50";
const badge = "w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold";

function Hospital() {
  return (
    <svg viewBox="0 0 280 170" className="h-36 w-auto" aria-hidden>
      <ellipse cx="140" cy="152" rx="120" ry="12" fill="#e6e8fb" />
      <path d="M62 150V84l78-34 78 34v66z" fill="#d9dcf8" />
      <path d="M140 50l78 34v66h-78z" fill="#c4c8f3" />
      <rect x="82" y="94" width="22" height="12" rx="3" fill="#eef0fe" />
      <rect x="82" y="114" width="22" height="12" rx="3" fill="#eef0fe" />
      <rect x="112" y="94" width="22" height="12" rx="3" fill="#eef0fe" />
      <rect x="150" y="94" width="22" height="12" rx="3" fill="#dde0fa" />
      <rect x="180" y="94" width="22" height="12" rx="3" fill="#dde0fa" />
      <rect x="124" y="120" width="30" height="30" rx="3" fill="#7c7fe6" />
      <circle cx="140" cy="30" r="22" fill="#fff" stroke="#c4c8f3" strokeWidth="2" />
      <path d="M140 19v22M129 30h22" stroke="#4338ca" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="34" cy="116" rx="12" ry="22" fill="#c9cdf5" /><rect x="32" y="130" width="3" height="20" fill="#aab0ee" />
      <ellipse cx="246" cy="112" rx="12" ry="24" fill="#c9cdf5" /><rect x="244" y="128" width="3" height="22" fill="#aab0ee" />
    </svg>
  );
}

function Tile({ icon: Icon }: { icon: typeof CreditCard }) {
  return <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eeefff] text-primary" aria-hidden><Icon size={22} /></span>;
}

/** The dashboard while setup is unfinished: where the owner is, what is already done, and one way forward. */
export function SetupDashboard({ clinic }: { clinic: Clinic }) {
  const [progress, setProgress] = useState<Progress>({ step: 2, savedAt: null });
  useEffect(() => {
    const handle = setTimeout(() => setProgress({ ...readProgress(), savedAt: new Date().toISOString() }), 0);
    return () => clearTimeout(handle);
  }, []);
  const { step } = progress;
  const current = STEPS[step - 1];
  const resume = current.href;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex items-center justify-between gap-6">
          <div className="min-w-0 max-w-xl">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Welcome to ClinX</p>
            <h1 className="mt-3 text-[clamp(28px,3.4vw,40px)] leading-[1.1] font-bold tracking-[-0.03em]">Let&apos;s get your clinic set up</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">You&apos;re one step away from powerful market insights and growth recommendations.</p>
          </div>
          <div className="hidden shrink-0 sm:block"><Hospital /></div>
        </header>

        <section className={`${panel} p-6 sm:p-8`} aria-labelledby="setup-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Setup in progress</p>
            {progress.savedAt && <p className="text-[13px] text-muted">Saved {formatDate(progress.savedAt)}</p>}
          </div>
          <h2 id="setup-title" className="mt-3 text-[26px] leading-tight font-bold tracking-tight">You left off at step {step} — {current.title}</h2>
          <p className="mt-2 text-[15px] text-muted">Your progress is saved. Continue where you left off, or review your information.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-6">
            <ol className="flex min-w-0 flex-1 items-start" aria-label="Setup steps">
              {STEPS.map((s, i) => {
                const n = i + 1;
                const state = n < step ? "done" : n === step ? "current" : "todo";
                return (
                  <li key={s.title} className="relative flex min-w-[72px] flex-1 flex-col items-center gap-2 text-center" aria-current={state === "current" ? "step" : undefined}>
                    {i > 0 && <span aria-hidden className={clsx("absolute top-[22px] right-1/2 left-[-50%] h-0.5", n <= step ? "bg-primary" : "bg-[#e3e5f0]")} />}
                    <span className={clsx("relative grid size-11 place-items-center rounded-full text-sm font-semibold", state === "done" && "bg-primary text-white", state === "current" && "bg-primary text-white ring-4 ring-primary/20", state === "todo" && "border border-[#d9dce8] bg-white text-muted")}>
                      {state === "done" ? <Check size={18} strokeWidth={3} aria-hidden /> : n}
                    </span>
                    <span className={clsx("text-[13px]", state === "current" ? "font-bold text-ink" : "text-muted")}>{s.title}</span>
                  </li>
                );
              })}
            </ol>
            <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
              <Link href={resume} className={`${primaryBtn} w-full sm:w-auto`}>Continue setup <ArrowRight size={17} aria-hidden /></Link>
              <Link href="/onboarding" className="text-[13px] text-muted underline underline-offset-2 hover:text-ink">Review details</Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className={card} aria-labelledby="clinic-card">
            <div className="flex items-start gap-4">
              <Tile icon={Building2} />
              <div><h3 id="clinic-card" className="text-[19px] font-bold">Your clinic</h3><span className={`${badge} mt-1.5 bg-[#e6f7ee] text-[#16875a]`}>Added</span></div>
            </div>
            <div className="mt-5 flex-1">
              <p className="font-semibold">{clinic.name}</p>
              <p className="text-[15px] text-muted">{clinic.address}, {clinic.city}</p>
            </div>
            <Link href="/onboarding" className={`${outlineBtn} mt-6 self-start`}>Review clinic details <ArrowRight size={15} aria-hidden /></Link>
          </section>

          <section className={card} aria-labelledby="billing-card">
            <div className="flex items-start gap-4">
              <Tile icon={CreditCard} />
              <div><h3 id="billing-card" className="text-[19px] font-bold">Subscription &amp; billing</h3><span className={`${badge} mt-1.5 bg-warning-soft text-warning`}>No active subscription</span></div>
            </div>
            <p className="mt-5 flex-1 text-[15px] leading-relaxed text-muted">Choose a plan to unlock your first analysis and start growing your clinic.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/start" className={primaryBtn}>View plans</Link>
              <Link href="/start" className={outlineBtn}>Billing settings</Link>
            </div>
          </section>

          <section className={card} aria-labelledby="invoice-card">
            <div className="flex items-start gap-4">
              <Tile icon={FileText} />
              <div><h3 id="invoice-card" className="text-[19px] font-bold">Invoices &amp; receipts</h3><span className={`${badge} mt-1.5 bg-[#f1f2f7] text-muted`}>No invoices yet</span></div>
            </div>
            <p className="mt-5 flex-1 text-[15px] leading-relaxed text-muted">Your invoices and payment receipts will appear here after you subscribe.</p>
            <Link href="/start" className={`${outlineBtn} mt-6 self-start`}>View billing</Link>
          </section>

          <section className={card} aria-labelledby="intel-card">
            <div className="flex items-start gap-4">
              <Tile icon={BarChart3} />
              <div><h3 id="intel-card" className="text-[19px] font-bold">Clinic intelligence</h3><span className={`${badge} mt-1.5 bg-warning-soft text-warning`}>Not available yet</span></div>
            </div>
            <p className="mt-5 flex-1 text-[15px] leading-relaxed text-muted">Once you complete setup and activate your plan, we&apos;ll analyze your market and show insights here.</p>
            <Link href="/demo" className="mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-[#f1f2f7] px-5 text-sm font-semibold text-ink hover:bg-[#e8eaf3]">See an example</Link>
          </section>
        </div>

        <section className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] border border-[#e3e5fb] bg-gradient-to-r from-[#f1f1ff] to-[#f8f7ff] p-6 sm:p-8">
          <div className="min-w-0 max-w-xl">
            <h2 className="text-[22px] font-bold tracking-tight">Unlock your clinic&apos;s growth potential</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">Complete your setup and get instant access to competitor insights, service opportunities, and personalized recommendations.</p>
          </div>
          <Link href={resume} className={primaryBtn}>Continue setup <ArrowRight size={17} aria-hidden /></Link>
        </section>
      </div>

      <aside className="flex flex-col gap-6" aria-label="Setup help">
        <div className="flex items-start gap-3 rounded-[20px] border border-[#f6e3b4] bg-[#fffaee] p-5">
          <Lightbulb size={22} aria-hidden className="mt-0.5 shrink-0 text-[#e5a50a]" />
          <p className="text-[15px] leading-relaxed"><span className="font-semibold">Finish your setup to unlock</span> competitor insights, personalized recommendations, and growth opportunities for your clinic.</p>
        </div>

        <section className={`${panel} p-6`} aria-labelledby="checklist-title">
          <h2 id="checklist-title" className="text-[20px] font-bold">Setup checklist</h2>
          <p className="mt-1 text-sm text-muted">{step - 1} of {STEPS.length} completed</p>
          <ul className="mt-4 divide-y divide-[#eef0f7]">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const state = n < step ? "done" : n === step ? "current" : "todo";
              return (
                <li key={s.title}>
                  <Link href={s.href} className={clsx("-mx-2 flex items-center gap-3 rounded-2xl px-2 py-3.5", state === "current" && "bg-[#eeefff]")}>
                    <span className={clsx("grid size-8 shrink-0 place-items-center rounded-full", state === "done" && "bg-[#22a06b] text-white", state === "current" && "border-2 border-primary", state === "todo" && "border border-[#d9dce8]")} aria-hidden>
                      {state === "done" && <Check size={15} strokeWidth={3} />}
                      {state === "current" && <span className="size-2.5 rounded-full bg-primary" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={clsx("block text-[15px]", state === "todo" ? "text-ink" : "font-semibold")}>{s.short}</span>
                      <span className={clsx("block text-[13px]", state === "current" ? "text-primary" : "text-muted")}>{state === "done" ? "Completed" : state === "current" ? "In progress" : "Not started"}</span>
                    </span>
                    {state !== "todo" && <ChevronRight size={16} aria-hidden className="shrink-0 text-faint" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${panel} p-6`} aria-labelledby="help-title">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#eeefff] text-primary" aria-hidden><MessageSquareText size={20} /></span>
            <h2 id="help-title" className="text-[20px] font-bold">Need help?</h2>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">Our team is here if you have any questions or need help with your setup.</p>
          <Link href="/contact" className="mt-4 flex min-h-12 items-center justify-between rounded-full border border-[#d9dcf0] px-5 text-[15px] font-semibold text-primary hover:border-primary/50">Contact support <ExternalLink size={16} aria-hidden /></Link>
        </section>
      </aside>
    </div>
  );
}
