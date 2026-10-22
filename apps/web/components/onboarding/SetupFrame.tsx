"use client";

import Link from "next/link";
import { ArrowLeft, Check, LogOut, X } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useAccount } from "@/components/auth/useAccount";
import { Logo } from "@/components/ui/Logo";
import { copy, fill } from "@/lib/copy";

const RING = 2 * Math.PI * 15;
const backPill = "mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#e3e6f2] bg-white px-[18px] text-sm font-semibold shadow-sm hover:border-primary/40";

/** The progress ring: a grey track and an indigo-to-violet arc that fills step ÷ total of the circle. */
function ProgressRing({ share }: { share: number }) {
  return (
    <svg viewBox="0 0 38 38" className="size-[38px] shrink-0" aria-hidden>
      <defs>
        <linearGradient id="setup-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4f46e5" /><stop offset="1" stopColor="#8b7bff" /></linearGradient>
      </defs>
      <circle cx="19" cy="19" r="15" fill="none" stroke="#e6e8f4" strokeWidth="4" />
      <circle cx="19" cy="19" r="15" fill="none" stroke="url(#setup-ring)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${share * RING} ${RING}`} transform="rotate(-90 19 19)" />
    </svg>
  );
}

/** Who is setting up, with the two ways out. Exit keeps the work (it is saved as it goes). */
function RailAccount({ hasClinic }: { hasClinic: boolean }) {
  const account = useAccount();
  const t = copy.onboarding;
  const exitHref = account.signedIn && hasClinic ? "/app" : "/";
  return (
    <div className="mt-auto flex flex-col gap-2.5">
      {account.signedIn && account.email && (
        <div className="flex items-center gap-3 px-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eeefff] text-sm font-bold text-primary uppercase" aria-hidden>{account.email[0]}</span>
          <span className="min-w-0 truncate text-sm text-ink-grey">{account.email}</span>
        </div>
      )}
      <Link href={exitHref} className="flex min-h-[44px] items-center gap-[12px] rounded-2xl bg-white/80 px-[16px] text-sm font-semibold ring-1 ring-[#ecedf5] hover:bg-white">
        <LogOut size={16} className="text-ink-grey" aria-hidden />{hasClinic ? t.saveAndExit : t.exitSetup}
      </Link>
      {account.signedIn && <button type="button" onClick={account.signOut} className="min-h-9 px-4 text-left text-sm text-ink-grey hover:text-ink">{t.logOut}</button>}
    </div>
  );
}

/**
 * The setup frame: a left rail (logo, progress ring, step list, account), the step's content in the middle and the live
 * preview on the right. On phones the rail collapses to one line with the two ways out, and the action bar sticks to the bottom.
 */
export function SetupFrame({
  step,
  back,
  title,
  intro,
  status,
  action,
  aside,
  hasClinic = step > 1,
  asideWidth = 440,
  note,
  eyebrow,
  complete,
  children,
}: {
  step: number; // 1-based
  /** Where Back goes: a step change in the flow (`onClick`) or a page (`href`). */
  back?: { label: string; href?: string; onClick?: () => void };
  title: ReactNode;
  intro?: string;
  status?: string;
  action?: ReactNode;
  /** Right-hand column (the live preview). */
  aside?: ReactNode;
  /** True once the clinic exists: the exit button then says it saves. */
  hasClinic?: boolean;
  /** Width of the right-hand column in px: 440 on step 1, 480 on the overview, 520 while scanning. */
  asideWidth?: number;
  /** Replaces the line under the step list. */
  note?: string;
  /** Small caps line above the title, e.g. the step and its name. */
  eyebrow?: ReactNode;
  /** The last step: the rail says setup is complete instead of in progress. */
  complete?: boolean;
  children: ReactNode;
}) {
  const t = copy.onboarding;
  const steps = t.steps;
  const account = useAccount();
  return (
    <div className="min-h-screen bg-[#f8f9fd] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-[#eceef5] bg-gradient-to-b from-[#fbfbff] to-[#f4f5fc] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-[24px] lg:px-[20px] lg:py-[28px]">
        <Logo surface="light" height={30} href="/" className="mb-[12px] px-[8px]" />
        <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-[16px] py-[14px] ring-1 ring-[#ecedf5] shadow-[0_14px_34px_-24px_rgba(76,70,180,.45)]">
          <ProgressRing share={step / steps.length} />
          <span>
            <span className="block text-[13.5px] leading-tight font-semibold">{complete ? t.setupComplete : t.inProgress}</span>
            <span className="mt-0.5 block text-[12.5px] text-ink-grey">{fill(t.stepOf, { n: String(step), total: String(steps.length) })}</span>
          </span>
        </div>
        <ol className="flex flex-col gap-[1px]" aria-label="Setup steps">
          {steps.map((label, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "current" : "todo";
            return (
              <li key={label} aria-current={state === "current" ? "step" : undefined} className={clsx("relative flex items-center gap-[12px] rounded-xl px-[12px] py-[12px] text-sm", state === "current" ? "bg-white font-bold ring-1 ring-[#ecedf5] shadow-[0_10px_28px_-20px_rgba(76,70,180,.5)]" : state === "done" ? "text-ink" : "text-ink-grey")}>
                {state === "current" && <span aria-hidden className="absolute top-1 bottom-1 -left-[20px] w-[3px] rounded-r-full bg-primary" />}
                <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full", state === "done" && "bg-[#eeefff] text-primary", state === "current" && "border-2 border-primary", state === "todo" && "border border-[#d9dce8]")}>
                  {state === "done" ? <Check size={13} strokeWidth={3} aria-label="done" /> : state === "current" ? <span className="size-[9px] rounded-full bg-primary" /> : null}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-ink-grey">{note ?? t.stepNote}</p>
        <RailAccount hasClinic={hasClinic} />
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-[#eceef5] bg-white px-4 py-3 text-[13px] lg:hidden">
          <span className="text-ink-grey">{fill(t.stepOf, { n: String(step), total: String(steps.length) })} · <span className="font-semibold text-ink">{steps[step - 1]}</span></span>
          <span className="flex items-center gap-3">
            {account.signedIn && <button type="button" onClick={account.signOut} className="text-ink-grey">{t.logOut}</button>}
            <Link href={account.signedIn && hasClinic ? "/app" : "/"} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[#e3e6f2] px-3 font-semibold"><X size={13} aria-hidden />{t.exitSetup}</Link>
          </span>
        </div>
        <main style={{ "--aside": `${asideWidth}px` } as React.CSSProperties} className={clsx("mx-auto grid w-full max-w-[1440px] flex-1 content-start gap-[40px] px-[20px] pt-[28px] pb-[80px] sm:px-[32px] xl:px-[40px]", aside && "xl:grid-cols-[minmax(0,1fr)_var(--aside)]")}>
          <div className="min-w-0">
          {back &&
            (back.onClick ? (
              <button type="button" onClick={back.onClick} className={backPill}>
                <ArrowLeft size={16} aria-hidden /> {back.label ? `${copy.common.back} to ${back.label.toLowerCase()}` : copy.common.back}
              </button>
            ) : (
              <Link href={back.href ?? "/"} className={backPill}>
                <ArrowLeft size={16} aria-hidden /> {back.label ? `${copy.common.back} to ${back.label.toLowerCase()}` : copy.common.back}
              </Link>
            ))}
          {eyebrow && <p className="mb-3 text-[13px] font-bold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>}
          <h1 className="text-[clamp(32px,3.4vw,41.6px)] leading-[1.08] font-bold tracking-[-0.04em]">{title}</h1>
          {intro && <p className="mt-[16px] max-w-[720px] text-[16px] leading-[1.6] text-ink-grey">{intro}</p>}
          <div className="mt-[24px]">{children}</div>
          </div>
          {aside && <div className="flex flex-col gap-[20px] xl:sticky xl:top-[28px] xl:self-start">{aside}</div>}
        </main>
        {(status || action) && (
          <div className="sticky bottom-0 border-t border-[#eceef5] bg-white/95 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 xl:px-10">
              <p className="text-[13px] text-ink-grey" aria-live="polite">{status}</p>
              <div>{action}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PrimaryButton({ children, disabled, onClick, type = "button", pill }: { children: ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit"; /** Fully rounded and a little smaller, for the plan questions. */ pill?: boolean }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clsx("inline-flex items-center gap-2 bg-gradient-to-r from-[#4338ca] to-[#5b5cf0] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(67,56,202,.8)] transition-opacity disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none", pill ? "h-[44px] rounded-full px-[26px] text-[14px]" : "h-[48px] rounded-[12px] px-[32px] text-[15px]")}>
      {children} <span aria-hidden>→</span>
    </button>
  );
}

/**
 * A labelled input. The icon sits in its own cell on the left, an optional `trailing` control inside on the right.
 * Focus puts an indigo border and a soft ring around the whole row.
 */
export function Field({ id, label, optional, required, hint, error, icon, trailing, children }: { id: string; label: string; optional?: boolean; required?: boolean; hint?: string; error?: string; icon?: ReactNode; trailing?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[14.5px] font-semibold">
        {label}{required && <span className="ml-0.5 text-[#e5484d]" aria-hidden>*</span>}{optional && <span className="ml-1 font-normal text-ink-grey">(optional)</span>}
      </label>
      <div className={clsx("mt-2 flex min-h-[48px] items-stretch overflow-hidden rounded-[12px] border bg-white transition-shadow focus-within:ring-4", error ? "border-[#b42318] focus-within:border-[#b42318] focus-within:ring-[#b42318]/12" : "border-[#e3e6f2] focus-within:border-primary focus-within:ring-primary/12")}>
        {icon && <span className="grid w-[48px] shrink-0 place-items-center border-r border-[#e3e6f2] text-[#666e8c]">{icon}</span>}
        <div className="flex min-w-0 flex-1 items-center">{children}</div>
        {trailing && <span className="flex items-center pr-2">{trailing}</span>}
      </div>
      {error ? <p id={`${id}-error`} role="alert" className="mt-2 text-[12.5px] leading-normal font-medium text-[#b42318]">{error}</p> : hint && <p id={`${id}-hint`} className="mt-2 text-[12.5px] leading-normal text-ink-grey">{hint}</p>}
    </div>
  );
}

/** `field-input` turns off the global focus outline: the row around the input already shows focus. */
export const inputClass = "field-input min-h-[46px] w-full bg-transparent px-4 text-[15px] outline-none placeholder:text-[#9aa3bd]";
