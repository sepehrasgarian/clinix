import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("animate-pulse rounded-lg bg-line/70", className)} />;
}

/** Placeholder for a report page while the server renders it. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="space-y-2"><Skeleton className="h-7 w-72" /><Skeleton className="h-4 w-96" /></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
