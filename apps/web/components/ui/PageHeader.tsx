import type { ReactNode } from "react";

export function PageHeader({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {intro && <p className="mt-1 text-muted">{intro}</p>}
      </div>
      {children}
    </header>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-line p-8 text-center text-muted">{text}</div>;
}
