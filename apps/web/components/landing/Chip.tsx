import clsx from "clsx";
import type { ReactNode } from "react";

export type ChipTone = "success" | "primary" | "info" | "neutral" | "alert" | "warning";

const tones: Record<ChipTone, string> = {
  success: "bg-[#e3f7ee] text-[#138a5b]",
  primary: "bg-[#eee9ff] text-[#6d4ae0]",
  info: "bg-[#e4eeff] text-[#2f6fe0]",
  neutral: "bg-[#eef0f4] text-[#536078]",
  alert: "bg-[#fde7ea] text-[#d2304a]",
  warning: "bg-[#fff1d9] text-[#b7791f]",
};

/** Small status badge used across the landing cards. */
export function Chip({ tone, children, className }: { tone: ChipTone; children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center rounded-full px-[11px] py-[3px] text-[12px] font-semibold whitespace-nowrap", tones[tone], className)}>{children}</span>;
}
