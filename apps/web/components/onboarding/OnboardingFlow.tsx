"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Analysis, Clinic, ClinicInput } from "@clinix/contracts";
import { addCompetitor, claimClinic, confirmCompetitors, confirmServices, createClinic, getAnalysis, retryAnalysis, startAnalysis } from "@/lib/api";
import { DEV_USER_ID, getGuestId, isGuest, setDevUser } from "@/lib/identity";
import { ClinicForm } from "./ClinicForm";
import { CompetitorsStage } from "./CompetitorsStage";
import { FoundStage } from "./FoundStage";
import { ScanningStage } from "./ScanningStage";

const STORAGE_KEY = "clinix.onboarding";
const POLL_MS = 2500;

type Saved = { clinic: Clinic; analysisId: string };

/**
 * Drives setup from step 1 to the start of the deep analysis. The analysis status decides
 * which stage renders, so a refresh or a return visit resumes in the right place.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState(true);

  // Browser-only state (saved progress, guest or user) is read after mount, on the next tick.
  useEffect(() => {
    const handle = setTimeout(() => {
      setGuest(isGuest());
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setSaved(JSON.parse(raw) as Saved);
      } catch {
        /* a stale or blocked storage just means we start at step 1 */
      }
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  const persist = (value: Saved | null) => {
    setSaved(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const refresh = useCallback(async () => {
    if (!saved) return;
    try {
      setAnalysis(await getAnalysis(saved.clinic.id, saved.analysisId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't reach our servers just now.");
    }
  }, [saved]);

  // Poll while the pipeline is working; stop at checkpoints and terminal states.
  useEffect(() => {
    if (!saved) return;
    const first = setTimeout(refresh, 0);
    const active = !analysis || analysis.status === "queued" || analysis.status === "running";
    const handle = active ? setInterval(refresh, POLL_MS) : undefined;
    return () => {
      clearTimeout(first);
      if (handle) clearInterval(handle);
    };
  }, [saved, analysis, refresh]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmitClinic = (input: ClinicInput) =>
    run(async () => {
      const clinic = await createClinic(input);
      const a = await startAnalysis(clinic.id);
      persist({ clinic, analysisId: a.id });
      setAnalysis(a);
    });

  if (!saved || !analysis) {
    return (
      <>
        <ClinicForm onSubmit={onSubmitClinic} busy={busy} />
        {error && <p role="alert" className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-alert-soft px-4 py-2 text-sm text-alert">{error}</p>}
      </>
    );
  }

  const { clinic } = saved;

  if (analysis.stage === "quick_scan" && (analysis.status === "queued" || analysis.status === "running" || analysis.status === "failed")) {
    return <ScanningStage analysis={analysis} disciplines={clinic.disciplines} retrying={busy} onRetry={() => run(async () => setAnalysis(await retryAnalysis(clinic.id, analysis.id)))} />;
  }
  if (analysis.status === "awaiting_services" && analysis.scan) {
    // Until Clerk lands on Day 4, "create an account" signs in as the dev user and claims the guest clinic.
    const createAccount = () =>
      run(async () => {
        const guestId = getGuestId();
        setDevUser(DEV_USER_ID);
        const claimed = await claimClinic(clinic.id, guestId);
        persist({ clinic: claimed, analysisId: analysis.id });
        setGuest(false);
      });
    return (
      <FoundStage
        analysis={analysis}
        disciplines={clinic.disciplines}
        busy={busy}
        guest={guest}
        onCreateAccount={createAccount}
        onContinue={(services) => run(async () => setAnalysis(await confirmServices(clinic.id, analysis.id, services)))}
      />
    );
  }
  if (analysis.stage === "discovery" && analysis.status !== "awaiting_competitors") {
    return <ScanningStage analysis={analysis} disciplines={clinic.disciplines} retrying={busy} onRetry={() => run(async () => setAnalysis(await retryAnalysis(clinic.id, analysis.id)))} />;
  }
  if (analysis.status === "awaiting_competitors" && analysis.discovery) {
    return (
      <CompetitorsStage
        analysis={analysis}
        disciplines={clinic.disciplines}
        busy={busy}
        onAdd={async (q) => setAnalysis({ ...analysis, discovery: await addCompetitor(clinic.id, analysis.id, q) })}
        onConfirm={(placeIds) =>
          run(async () => {
            await confirmCompetitors(clinic.id, analysis.id, placeIds);
            persist(null);
            router.push(`/app/clinics/${clinic.id}/run/${analysis.id}`);
          })
        }
      />
    );
  }
  // Deep stage or finished: hand over to the run view.
  router.replace(`/app/clinics/${clinic.id}/run/${analysis.id}`);
  return null;
}
