"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import type { Clinic } from "@clinix/contracts";
import { startAnalysis } from "@/lib/api";

const STORAGE_KEY = "clinix.onboarding";

/**
 * Starts a new analysis for the clinic and opens setup on it, so the owner confirms services and competitors again.
 * One request per click; the button is disabled while it runs, so a double click cannot create two analyses.
 */
export function RunAnalysisButton({ clinic }: { clinic: Clinic }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const analysis = await startAnalysis(clinic.id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ clinic, analysisId: analysis.id, claimed: true }));
      } catch {
        /* without storage, setup starts from the clinic form */
      }
      router.push("/start");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't start a new analysis just now.");
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={run} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe2f1] bg-white px-5 text-sm font-semibold text-[#101a35] hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" /> : <RefreshCw size={16} strokeWidth={1.5} aria-hidden />}Run new analysis
      </button>
      {error && <p role="alert" className="text-xs font-medium text-alert">{error}</p>}
    </div>
  );
}
