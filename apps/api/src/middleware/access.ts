import type { Clinic } from "@clinix/contracts";
import type { AuthVariables } from "./auth.js";

/**
 * Who may do what with a clinic. The owner can do everything. Inside an organization, an
 * administrator can do everything too; a member (front desk) can read the report, ask questions
 * and tick actions, but never start an analysis or change the setup.
 */
export const canManage = (who: Pick<AuthVariables, "userId" | "orgId" | "orgRole">, clinic: Clinic): boolean =>
  clinic.ownerId === who.userId || (!!clinic.orgId && clinic.orgId === who.orgId && who.orgRole === "admin");

export const OWNER_ONLY = { error: "Only the clinic owner or an administrator can do this.", code: "owner_required" } as const;
