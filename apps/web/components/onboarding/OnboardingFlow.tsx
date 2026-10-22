"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Analysis, Clinic, ClinicInput } from "@clinix/contracts";
import { addCompetitor, claimClinic, confirmCompetitors, confirmServices, createClinic, getAnalysis, retryAnalysis, startAnalysis, updateClinic } from "@/lib/api";
import { clerkEnabled, signUpUrl } from "@/lib/auth";
import { DEV_USER_ID, getGuestId, isGuest, setDevUser } from "@/lib/identity";
import { useSignedIn } from "@/components/auth/useSignedIn";
import { ClinicForm } from "./ClinicForm";
import { CompetitorsStage } from "./CompetitorsStage";
import { FoundStage } from "./FoundStage";
import { GetStartedStage } from "./GetStartedStage";
import type { BillingDraft } from "@/lib/billingForm";
import { PaymentStage } from "./PaymentStage";
import { PlanStage, planFor, type Billing, type PlanDraft } from "./PlanStage";
import { ScanningStage } from "./ScanningStage";
import type { PlanId } from "@/lib/pricing";

const STORAGE_KEY = "clinix.onboarding";
const POLL_MS = 2500;

/** Where the owner is after confirming competitors: the plan, payment and connect steps, before the analysis starts. */
type Pending = { placeIds: string[]; step: "plan" | "payment" | "connect"; plan: PlanId; billing: Billing };
type Saved = { clinic: Clinic; analysisId: string; claimed?: boolean; pending?: Pending; /** The competitors ticked so far, kept so Save and exit resumes where the owner stopped. */ draftPlaceIds?: string[]; /** The plan questions answered so far. */ planDraft?: PlanDraft; /** Invoice details entered at checkout (never card details). */ billingDraft?: BillingDraft };

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
  const signedIn = useSignedIn();
  /** Set when the owner presses Back: shows an earlier step than the analysis state implies. */
  const [backTo, setBackTo] = useState<"form" | "found" | null>(null);

  // Browser-only state (saved progress, guest or user) is read after mount, on the next tick.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (!clerkEnabled) setGuest(isGuest());
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setSaved(JSON.parse(raw) as Saved);
      } catch {
        /* a stale or blocked storage just means we start at step 1 */
      }
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  // With Clerk, "guest" follows the session and the claim; the stand-in keeps its own flag.
  const isGuestNow = clerkEnabled ? !signedIn || !saved?.claimed : guest;

  // With Clerk, the guest clinic is claimed as soon as the owner comes back signed in. Runs once per clinic.
  useEffect(() => {
    if (!clerkEnabled || !signedIn || !saved || saved.claimed) return;
    let cancelled = false;
    claimClinic(saved.clinic.id, getGuestId())
      .then((clinic) => {
        if (cancelled) return;
        const next = { ...saved, clinic, claimed: true };
        setSaved(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "We couldn't link this clinic to your account.");
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, saved]);

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
  // Keyed on the status, not the analysis object, so a refreshed object never restarts the timer.
  const status = analysis?.status ?? null;
  useEffect(() => {
    if (!saved) return;
    const first = setTimeout(refresh, 0);
    const active = status === null || status === "queued" || status === "running";
    const handle = active ? setInterval(refresh, POLL_MS) : undefined;
    return () => {
      clearTimeout(first);
      if (handle) clearInterval(handle);
    };
  }, [saved, status, refresh]);

  // Deep stage or finished: the run view takes over. Navigation happens in an effect, never during render.
  const handoff =
    saved && analysis && backTo === null && (analysis.stage === "deep" || analysis.status === "succeeded")
      ? `/app/clinics/${saved.clinic.id}/run/${analysis.id}`
      : null;
  useEffect(() => {
    if (handoff) router.replace(handoff);
  }, [handoff, router]);

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
      // Coming back from a later step to edit: the same clinic, changed. A first visit creates it.
      const clinic = saved?.clinic ? await updateClinic(saved.clinic.id, input) : await createClinic(input);
      const a = await startAnalysis(clinic.id); // a recent scan of the same listing is reused, so this is quick
      persist({ clinic, analysisId: a.id });
      setAnalysis(a);
      setBackTo(null);
    });

  if (!saved || !analysis || backTo === "form") {
    return (
      <>
        <ClinicForm onSubmit={onSubmitClinic} busy={busy} initial={saved && analysis && backTo === "form" ? { clinic: saved.clinic, place: analysis.scan?.place ?? null } : undefined} />
        {error && <p role="alert" className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-alert-soft px-4 py-2 text-sm text-alert">{error}</p>}
      </>
    );
  }

  const { clinic } = saved;

  if (analysis.stage === "quick_scan" && (analysis.status === "queued" || analysis.status === "running" || analysis.status === "failed")) {
    return <ScanningStage analysis={analysis} clinic={clinic} onBack={() => setBackTo("form")} retrying={busy} onRetry={() => run(async () => setAnalysis(await retryAnalysis(clinic.id, analysis.id)))} />;
  }
  if ((analysis.status === "awaiting_services" || (backTo === "found" && analysis.status === "awaiting_competitors")) && analysis.scan) {
    // With Clerk, "create an account" goes to sign-up and comes back here, where the guest clinic is claimed.
    // Without it, the development stand-in signs in and claims at once.
    const createAccount = () =>
      clerkEnabled
        ? router.push(signUpUrl("/start"))
        : run(async () => {
            const guestId = getGuestId();
            setDevUser(DEV_USER_ID);
            const claimed = await claimClinic(clinic.id, guestId);
            persist({ clinic: claimed, analysisId: analysis.id });
            setGuest(false);
          });
    return (
      <FoundStage
        analysis={analysis}
        clinicOpened={clinic.opened}
        busy={busy}
        guest={isGuestNow}
        onCreateAccount={createAccount}
        onBack={() => setBackTo("form")}
        onContinue={(services) =>
          run(async () => {
            setAnalysis(await confirmServices(clinic.id, analysis.id, services));
            setBackTo(null);
          })
        }
      />
    );
  }
  if (analysis.stage === "discovery" && analysis.status !== "awaiting_competitors") {
    return <ScanningStage analysis={analysis} clinic={clinic} onBack={() => setBackTo("form")} retrying={busy} onRetry={() => run(async () => setAnalysis(await retryAnalysis(clinic.id, analysis.id)))} />;
  }
  if (analysis.status === "awaiting_competitors" && saved.pending) {
    const pending = saved.pending;
    const go = (patch: Partial<Pending>) => persist({ ...saved, pending: { ...pending, ...patch } });
    if (pending.step === "plan") {
      return <PlanStage
          clinic={clinic}
          disciplines={clinic.disciplines}
          plan={pending.plan}
          billing={pending.billing}
          draft={saved.planDraft}
          onDraft={(planDraft) => persist({ ...saved, planDraft })}
          onChange={(next) => go(next)}
          onBack={() => persist({ ...saved, pending: undefined })}
          onEditClinic={() => { persist({ ...saved, pending: undefined }); setBackTo("form"); }}
          onContinue={() => go({ step: "payment" })}
        />;
    }
    if (pending.step === "payment") {
      return <PaymentStage
          clinic={clinic}
          plan={pending.plan}
          billing={pending.billing}
          draft={saved.billingDraft}
          onDraft={(billingDraft) => persist({ ...saved, billingDraft })}
          onBilling={(billing) => go({ billing })}
          onBack={() => go({ step: "plan" })}
          onContinue={() => go({ step: "connect" })}
        />;
    }
    return (
      <GetStartedStage
        clinic={clinic}
        place={analysis.scan?.place}
        locations={saved.planDraft?.locations ?? 1}
        competitors={pending.placeIds.length}
        busy={busy}
        error={error}
        onBack={() => go({ step: "payment" })}
        onStart={() =>
          run(async () => {
            await confirmCompetitors(clinic.id, analysis.id, pending.placeIds);
            persist(null);
            router.push(`/app/clinics/${clinic.id}/run/${analysis.id}`);
          })
        }
      />
    );
  }
  if (analysis.status === "awaiting_competitors" && analysis.discovery) {
    return (
      <CompetitorsStage
        analysis={analysis}
        disciplines={clinic.disciplines}
        busy={busy}
        onBack={() => setBackTo("found")}
        onAdd={async (pick) => setAnalysis({ ...analysis, discovery: await addCompetitor(clinic.id, analysis.id, pick) })}
        city={clinic.city}
        initialSelected={saved.draftPlaceIds}
        onSelectionChange={(ids) => persist({ ...saved, draftPlaceIds: ids })}
        onConfirm={(placeIds) => persist({ ...saved, pending: { placeIds, step: "plan", plan: planFor(clinic.disciplines.length), billing: "annual" } })}
      />
    );
  }
  return <p className="p-8 text-sm text-muted">Opening your report…</p>;
}
