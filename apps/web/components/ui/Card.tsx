import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, interactive, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-card)]",
        interactive && "transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}
