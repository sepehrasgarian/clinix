"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { Recommendation } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { setRecommendationStatus } from "@/lib/api";

const NEXT: Record<Recommendation["status"], Recommendation["status"] | null> = { todo: "in_progress", in_progress: "done", done: null };

/** The buttons that move an action between To do, In progress and Done. Saved on the report. */
export function ActionStatus({ clinicId, analysisId, recommendation, compact }: { clinicId: string; analysisId: string; recommendation: Recommendation; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const move = async (status: Recommendation["status"]) => {
    setBusy(true);
    setError(null);
    try {
      await setRecommendationStatus(clinicId, analysisId, recommendation.id, status);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };
  const next = NEXT[recommendation.status];
  return (
    <div className={clsx("flex flex-wrap items-center gap-2", compact ? "mt-1" : "mt-3")}>
      {next && (
        <button type="button" disabled={busy} onClick={() => move(next)} className="min-h-9 rounded-lg border border-primary/30 bg-primary-soft px-3 text-xs font-semibold text-primary disabled:opacity-50">
          {next === "in_progress" ? copy.actions.startAction : copy.actions.markDone}
        </button>
      )}
      {recommendation.status !== "todo" && (
        <button type="button" disabled={busy} onClick={() => move("todo")} className="min-h-9 rounded-lg px-2 text-xs text-muted hover:text-ink disabled:opacity-50">
          {copy.actions.reopen}
        </button>
      )}
      {error && <span role="alert" className="text-xs text-alert">{error}</span>}
    </div>
  );
}
