"use client";

/** The competitors could not be loaded: say so, and let the owner try again. */
export default function CompetitorsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-[18px] border border-[#e5e9f2] bg-white p-10 text-center">
      <h1 className="text-lg font-semibold text-[#101936]">We couldn&apos;t load your competitors</h1>
      <p className="mt-1 text-sm text-[#66718b]">Nothing was lost. Check your connection and try again.</p>
      <button type="button" onClick={reset} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#5145e8] px-5 text-sm font-semibold text-white hover:bg-[#4338ca]">Try again</button>
    </div>
  );
}
