"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { copy, fill } from "@/lib/copy";

/**
 * The setup frame: a left rail with the progress ring and the step list, the step's content in
 * the middle, and an action bar with a status line. On phones the rail collapses to one line and
 * the action bar sticks to the bottom.
 */
export function SetupFrame({
  step,
  back,
  title,
  intro,
  status,
  action,
  aside,
  children,
}: {
  step: number; // 1-based
  /** Where Back goes: a step change in the flow (`onClick`) or a page (`href`). */
  back?: { label: string; href?: string; onClick?: () => void };
  title: string;
  intro?: string;
  status?: string;
  action?: ReactNode;
  /** Right-hand column (the live preview). */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const steps = copy.onboarding.steps;
  const progress = (step - 1) / steps.length;
  return (
    <div className="min-h-screen bg-surface md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-card md:sticky md:top-0 md:h-screen md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-3 px-5 py-4 md:flex-col md:items-stretch md:gap-6 md:py-6">
          <Logo surface="light" variant="classic" height={22} />
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
            <svg viewBox="0 0 36 36" className="size-9 shrink-0" aria-hidden>
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-line)" strokeWidth="4" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${Math.max(progress, 0.08) * 94.2} 94.2`} transform="rotate(-90 18 18)" />
            </svg>
            <span>
              <span className="block text-sm font-semibold">Setup in progress</span>
              <span className="block text-xs text-muted">{fill(copy.onboarding.stepOf, { n: String(step), total: String(steps.length) })}</span>
            </span>
          </div>
          <ol className="hidden md:flex md:flex-col md:gap-1" aria-label="Setup steps">
            {steps.map((label, i) => {
              const n = i + 1;
              const state = n < step ? "done" : n === step ? "current" : "todo";
              return (
                <li key={label} aria-current={state === "current" ? "step" : undefined} className={clsx("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm", state === "current" && "border border-line bg-surface font-semibold shadow-[var(--shadow-card)]", state !== "current" && "text-muted")}>
                  <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full border-2", state === "done" && "border-success bg-success text-white", state === "current" && "border-primary", state === "todo" && "border-line")}>
                    {state === "done" ? <Check size={12} aria-hidden /> : state === "current" ? <span className="size-2.5 rounded-full bg-primary" /> : null}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
          <p className="hidden text-xs text-muted md:block">A few minutes to set up your clinic and get your first look.</p>
          <Link href="/" className="hidden min-h-9 items-center text-xs text-muted hover:text-ink md:mt-auto md:inline-flex">{copy.onboarding.saveExit}</Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <main className="flex-1 px-4 py-6 md:px-10 md:py-8">
          {back &&
            (back.onClick ? (
              <button type="button" onClick={back.onClick} className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm text-muted hover:text-ink">
                <ArrowLeft size={16} aria-hidden /> {copy.common.back} to {back.label}
              </button>
            ) : (
              <Link href={back.href ?? "/"} className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm text-muted hover:text-ink">
                <ArrowLeft size={16} aria-hidden /> {copy.common.back} to {back.label}
              </Link>
            ))}
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {intro && <p className="mt-1 max-w-2xl text-muted">{intro}</p>}
          <div className={clsx("mt-6 grid gap-6", aside && "xl:grid-cols-[minmax(0,1fr)_360px]")}>
            <div className="min-w-0">{children}</div>
            {aside && <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">{aside}</div>}
          </div>
        </main>
        {(status || action) && (
          <div className="sticky bottom-0 border-t border-line bg-card/95 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-10">
              <p className="text-sm text-muted" aria-live="polite">{status}</p>
              <div>{action}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PrimaryButton({ children, disabled, onClick, type = "button" }: { children: ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(67,56,202,.8)] disabled:cursor-not-allowed disabled:opacity-40">
      {children} <span aria-hidden>→</span>
    </button>
  );
}

/** A labelled input with a leading icon, matching the setup mockup. */
export function Field({ id, label, optional, required, hint, icon, children }: { id: string; label: string; optional?: boolean; required?: boolean; hint?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label} {required && <span className="text-alert" aria-hidden>*</span>} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      <div className="mt-1.5 flex min-h-12 items-stretch overflow-hidden rounded-xl border border-line bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {icon && <span className="grid w-12 shrink-0 place-items-center border-r border-line text-faint">{icon}</span>}
        <div className="flex min-w-0 flex-1 items-center">{children}</div>
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export const inputClass = "min-h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-faint";
