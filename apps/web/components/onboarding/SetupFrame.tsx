import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";
import { copy, fill } from "@/lib/copy";

/**
 * The shared frame for setup steps: step rail, named Back link, content, and an action bar
 * with a status line. On phones the rail collapses to one line and the bar sticks to the bottom.
 */
export function SetupFrame({
  step,
  back,
  title,
  intro,
  status,
  action,
  children,
}: {
  step: number; // 1-based
  back?: { href: string; label: string };
  title: string;
  intro?: string;
  status?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const steps = copy.onboarding.steps;
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link href="/app" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden className="inline-block size-5 rounded-md bg-primary" /> Clinix
          </Link>
          <ol className="hidden items-center gap-2 text-sm md:flex" aria-label="Setup steps">
            {steps.map((label, i) => {
              const n = i + 1;
              const state = n < step ? "done" : n === step ? "current" : "todo";
              return (
                <li key={label} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
                  <span
                    className={clsx(
                      "grid size-6 place-items-center rounded-full font-mono text-xs",
                      state === "done" && "bg-success text-white",
                      state === "current" && "bg-primary text-white",
                      state === "todo" && "border border-line text-faint",
                    )}
                  >
                    {state === "done" ? <Check size={12} aria-hidden /> : n}
                  </span>
                  <span className={clsx(state === "current" ? "font-medium" : "text-muted")}>{label}</span>
                  {n < steps.length && <span aria-hidden className="mx-1 h-px w-6 bg-line" />}
                </li>
              );
            })}
          </ol>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted md:hidden">{fill(copy.onboarding.stepOf, { n: String(step), total: String(steps.length) })} · {steps[step - 1]}</p>
            <Link href="/" className="min-h-9 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-ink">{copy.onboarding.saveExit}</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:px-8">
        {back && (
          <Link href={back.href} className="mb-4 inline-flex min-h-9 items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft size={16} aria-hidden /> {copy.common.back} to {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-muted">{intro}</p>}
        <div className="mt-6">{children}</div>
      </main>

      {(status || action) && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
            <p className="text-sm text-muted" aria-live="polite">{status}</p>
            <div>{action}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PrimaryButton({ children, disabled, onClick, type = "button" }: { children: ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="min-h-11 rounded-lg bg-primary px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
      {children}
    </button>
  );
}
