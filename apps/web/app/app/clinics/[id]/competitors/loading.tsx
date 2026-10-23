import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading competitors" className="flex flex-col gap-4">
      <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-9 w-96 max-w-full" /><Skeleton className="h-4 w-[28rem] max-w-full" /></div>
      <Skeleton className="h-10 w-full max-w-2xl" />
      <div className="divide-y divide-[#eef0f6] rounded-[18px] border border-[#e5e9f2] bg-white">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-4 p-4"><Skeleton className="size-11" /><Skeleton className="h-4 w-56" /><Skeleton className="ml-auto h-4 w-40" /></div>)}
      </div>
    </div>
  );
}
