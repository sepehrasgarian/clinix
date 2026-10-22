import type { Analysis, ChatMessage, Clinic, ClinicInput, DiscoveryResult, Place, Recommendation, Report, Review } from "@clinix/contracts";
import { identityHeaders } from "./identity";

/**
 * Data access for the app. Every call goes to the API with the caller's identity.
 * Server components act as the dev user until Clerk lands; the browser sends its guest or user id.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

const headers = async () => ({ ...(await identityHeaders()), "content-type": "application/json" });

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
  const res = await fetch(`${apiUrl}/api${path}`, { headers: await headers(), cache: "no-store" });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

async function send<T>(method: "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiUrl}/api${path}`, { method, headers: await headers(), body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}
const post = <T,>(path: string, body?: unknown) => send<T>("POST", path, body);
const patch = <T,>(path: string, body?: unknown) => send<T>("PATCH", path, body);

export const listClinics = (): Promise<Clinic[]> => get<Clinic[]>("/clinics");

export const getClinic = (id: string): Promise<{ clinic: Clinic; analyses: Analysis[] }> => get(`/clinics/${id}`);

/** The latest finished report for a clinic, with the analysis it belongs to, or null before the first one completes. */
export async function getLatestReport(clinicId: string): Promise<{ report: Report; analysis: Analysis } | null> {
  const { analyses } = await getClinic(clinicId);
  const done = analyses.find((a) => a.status === "succeeded" && a.report);
  return done ? { report: done.report!, analysis: done } : null;
}

/** The analysis still in progress for a clinic, if any (for empty states that link to the run page). */
export async function getInProgress(clinicId: string): Promise<Analysis | null> {
  const { analyses } = await getClinic(clinicId);
  return analyses.find((a) => a.status !== "succeeded") ?? null;
}

export const setRecommendationStatus = (clinicId: string, analysisId: string, recommendationId: string, status: Recommendation["status"]): Promise<Recommendation> =>
  patch<Recommendation>(`/clinics/${clinicId}/analyses/${analysisId}/recommendations/${recommendationId}`, { status });

export const photoUrl = (photoName: string) => `${apiUrl}/api/photo/${photoName}`;
/** The clinic's logo, taken from its website by the API. A 404 means the site has none. */
/** The clinic's logo: by its website's domain when we have one (works before a listing is confirmed), else by listing. */
export const logoUrl = ({ site, placeId }: { site?: string | null; placeId?: string }) =>
  site ? `${apiUrl}/api/logo/site/${encodeURIComponent(site)}?v=2` : `${apiUrl}/api/logo/${encodeURIComponent(placeId ?? "")}?v=2`;

// ---- Onboarding ----

export const searchClinics = (q: string, city = ""): Promise<Place[]> =>
  get<Place[]>(`/lookup/clinic-search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`);

export const createClinic = (input: ClinicInput): Promise<Clinic> => post<Clinic>("/clinics", input);

/** The owner went back and changed their answers: the same clinic, not a new one. */
export const updateClinic = (clinicId: string, input: ClinicInput): Promise<Clinic> => patch<Clinic>(`/clinics/${clinicId}`, input);

export type MarketCard = {
  nearby: number;
  /** How far the market was searched, in km. */
  radiusKm?: number;
  leaderName?: string;
  leaderReviewCount?: number;
  averageRating?: number;
  yourReviews?: number;
  /** The clinic's place by review count among the clinics counted, itself included. */
  rank?: number;
  total?: number;
  /** How many times the leader's reviews exceed the clinic's own. */
  reviewGap?: number;
};
export const getMarketCard = (placeId: string, disciplines: string[]): Promise<MarketCard> =>
  get<MarketCard>(`/lookup/market-card?placeId=${encodeURIComponent(placeId)}&disciplines=${disciplines.join(",")}`);

/** A signed-in owner takes over the clinic they set up as a guest. */
export const claimClinic = (clinicId: string, guestId: string): Promise<Clinic> => post<Clinic>(`/clinics/${clinicId}/claim`, { guestId });

export const startAnalysis = (clinicId: string): Promise<Analysis> => post<Analysis>(`/clinics/${clinicId}/analyses`);

export const getAnalysis = (clinicId: string, analysisId: string): Promise<Analysis> => get<Analysis>(`/clinics/${clinicId}/analyses/${analysisId}`);

export const confirmServices = (clinicId: string, analysisId: string, services: string[]): Promise<Analysis> =>
  post<Analysis>(`/clinics/${clinicId}/analyses/${analysisId}/services`, { services });

export const confirmCompetitors = (clinicId: string, analysisId: string, placeIds: string[]): Promise<Analysis> =>
  post<Analysis>(`/clinics/${clinicId}/analyses/${analysisId}/competitors`, { placeIds });

export const addCompetitor = (clinicId: string, analysisId: string, pick: { placeId: string } | { query: string }): Promise<DiscoveryResult> =>
  post<DiscoveryResult>(`/clinics/${clinicId}/analyses/${analysisId}/competitors/add`, pick);

export const retryAnalysis = (clinicId: string, analysisId: string): Promise<Analysis> =>
  post<Analysis>(`/clinics/${clinicId}/analyses/${analysisId}/retry`);

// ---- Ask ClinX ----

export type ChatHistory = { messages: ChatMessage[]; reviews: Review[] };
export const getChatHistory = (clinicId: string): Promise<ChatHistory> => get<ChatHistory>(`/clinics/${clinicId}/chat`);
export const sendChatMessage = (clinicId: string, message: string): Promise<{ answer: ChatMessage; reviews: Review[] }> =>
  post(`/clinics/${clinicId}/chat`, { message });
