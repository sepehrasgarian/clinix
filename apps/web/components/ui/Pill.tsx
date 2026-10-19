import clsx from "clsx";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/format";

const tones: Record<Tone, string> = {
  neutral: "bg-surface text-muted border-line",
  primary: "bg-primary-soft text-primary border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  alert: "bg-alert-soft text-alert border-transparent",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

/** A small coloured dot for meaning: problem, strength, context. */
export function Dot({ tone }: { tone: Tone }) {
  const colour = { neutral: "bg-faint", primary: "bg-primary", success: "bg-success", warning: "bg-warning", alert: "bg-alert" }[tone];
  return <span aria-hidden className={clsx("inline-block size-2 rounded-full", colour)} />;
}
