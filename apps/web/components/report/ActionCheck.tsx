"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check } from "lucide-react";
import type { Recommendation } from "@clinix/contracts";
import { setRecommendationStatus } from "@/lib/api";

/** The saved tick used by "Your next 3 moves", the action plan and the dashboard. */
export function ActionCheck({ clinicId, analysisId, recommendation, label }: { clinicId: string; analysisId: string; recommendation: Recommendation; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const done = optimistic ?? recommendation.status === "done";
  const toggle = async () => {
    setBusy(true);
    setOptimistic(!done);
    try {
      await setRecommendationStatus(clinicId, analysisId, recommendation.id, done ? "todo" : "done");
      router.refresh();
    } catch {
      setOptimistic(null);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label ?? (done ? `Done: ${recommendation.title}` : `Mark done: ${recommendation.title}`)}
      disabled={busy}
      onClick={toggle}
      className={clsx("grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors", done ? "border-success bg-success text-white" : "border-line bg-card hover:border-primary", busy && "opacity-60")}
    >
      {done && <Check size={14} aria-hidden />}
    </button>
  );
}
