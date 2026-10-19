import type { Finding, Recommendation } from "@clinix/contracts";

export type Tone = "neutral" | "primary" | "success" | "warning" | "alert";

export const formatDate = (iso: string, locale = "en-CA"): string =>
  new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

export const formatKm = (km: number): string => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

/** Colour carries meaning: a competitor's strength is a problem for the owner, their weakness is an opening. */
export function toneForFinding(f: Pick<Finding, "kind" | "competitorPlaceId">): Tone {
  const aboutOwner = f.competitorPlaceId === null;
  switch (f.kind) {
    case "strength":
      return aboutOwner ? "success" : "alert";
    case "weakness":
      return aboutOwner ? "alert" : "success";
    case "switching_reason":
      return "alert";
    case "unmet_demand":
      return "primary";
    case "admin_friction":
    case "access":
      return "warning";
  }
}

export const toneForLevel = (level: Recommendation["impact"]): Tone => (level === "high" ? "success" : level === "medium" ? "warning" : "neutral");

export const scoreTone = (score: number): Tone => (score >= 70 ? "success" : score >= 45 ? "warning" : "alert");
