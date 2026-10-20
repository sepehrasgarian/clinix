"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Analysis, Clinic } from "@clinix/contracts";
import { RunView } from "@/components/report/RunView";

/** Refreshes the server-rendered analysis every few seconds while it runs. */
export function RunClient({ clinic, analysis, ms = 3000 }: { clinic: Clinic; analysis: Analysis; ms?: number }) {
  const router = useRouter();
  const running = analysis.status !== "succeeded" && analysis.status !== "failed";
  useEffect(() => {
    if (!running) return;
    const handle = setInterval(() => router.refresh(), ms);
    return () => clearInterval(handle);
  }, [router, ms, running]);
  return <RunView clinic={clinic} analysis={analysis} onRefresh={() => router.refresh()} />;
}
