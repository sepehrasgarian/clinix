import type { Analysis, ChatMessage, Clinic, ClinicInput, DiscoveryResult, Place, Report, Review } from "@clinix/contracts";
import { fixtureAnalysis, fixtureChat, fixtureClinic, fixtureReport, fixtureReviews } from "@clinix/contracts/fixtures";
import { identityHeaders } from "./identity";

/**
 * Data access for the app. `mock` renders from the shared fixtures with no network, so the UI
 * can be built and reviewed before the pipeline is finished. `real` talks to the API.
 */
export type ApiMode = "mock" | "real";
export const apiMode: ApiMode = process.env.NEXT_PUBLIC_API_MODE === "real" ? "real" : "mock";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

const headers = () => ({ ...identityHeaders(), "content-type": "application/json" });

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

async function parseError(res: Response): Promise<ApiError> {
  const err = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
  return new ApiError(err.error ?? `Request failed (${res.status})`, res.status, err.code);
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${apiUrl}/api${path}`, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiUrl}/api${path}`, { method: "POST", headers: headers(), body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export const photoUrl = (photoName: string) => `${apiUrl}/api/lookup/photo/${photoName}`;

// ---- Onboarding and analyses always talk to the API: the quick scan is the product. ----
// Only the report screens fall back to the fixture (until the deep stage produces real reports).

export const searchClinics = (q: string, city: string): Promise<Place[]> =>
  get<Place[]>(`/lookup/clinic-search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`);

export const createClinic = (input: ClinicInput): Promise<Clinic> => post<Clinic>("/clinics", input);

export type MarketCard = { nearby: number; leaderName?: string; leaderReviewCount?: number; averageRating?: number };
export const getMarketCard = (placeId: string, disciplines: string[]): Promise<MarketCard> =>
  get<MarketCard>(`/lookup/market-card?placeId=${encodeURIComponent(placeId)}&disciplines=${disciplines.join(",")}`);

/** A signed-in owner takes over the clinic they set up as a guest. */
export const claimClinic = (clinicId: string, guestId: string): Promise<Clinic> => post<Clinic>(`/clinics/${clinicId}/claim`, { guestId });

export const startAnalysis = (clinicId: string): Promise<Analysis> => post<Analysis>(`/clinics/${clinicId}/analyses`);

export async function getAnalysis(clinicId: string, analysisId: string): Promise<Analysis> {
  if (analysisId === fixtureAnalysis.id) return fixtureAnalysis;
  return get<Analysis>(`/clinics/${clinicId}/analyses/${analysisId}`);
}

export const confirmServices = (clinicId: string, analysisId: string, services: string[]): Promise<Analysis> =>
  post<Analysis>(`/clinics/${clinicId}/analyses/${analysisId}/services`, { services });

export const confirmCompetitors = (clinicId: string, analysisId: string, placeIds: string[]): Promise<Analysis> =>
  post<Analysis>(`/clinics/${clinicId}/analyses/${analysisId}/competitors`, { placeIds });

export const addCompetitor = (clinicId: string, analysisId: string, query: string): Promise<DiscoveryResult> =>
  post<DiscoveryResult>(`/clinics/${clinicId}/analyses/${analysisId}/competitors/add`, { query });

export const retryAnalysis = (clinicId: string, analysisId: string): Promise<Analysis> =>
  post<Analysis>(`/clinics/${clinicId}/analyses/${analysisId}/retry`);

export async function listClinics(): Promise<Clinic[]> {
  return apiMode === "mock" ? [fixtureClinic] : get<Clinic[]>("/clinics");
}

export async function getClinic(id: string): Promise<{ clinic: Clinic; analyses: Analysis[] }> {
  return apiMode === "mock" ? { clinic: fixtureClinic, analyses: [fixtureAnalysis] } : get(`/clinics/${id}`);
}

/** The latest finished report for a clinic, or null before the first analysis completes. */
export async function getReport(clinicId: string): Promise<Report | null> {
  if (apiMode === "mock") return fixtureReport;
  const { analyses } = await getClinic(clinicId);
  return analyses.find((a) => a.status === "succeeded" && a.report)?.report ?? null;
}

/** Reviews cited by a report. Real reports embed them; the fixture keeps them alongside. */
export function reviewsOf(report: Report | null): Review[] {
  return report?.reviews?.length ? report.reviews : fixtureReviews;
}

export async function getChat(): Promise<ChatMessage[]> {
  return fixtureChat;
}
