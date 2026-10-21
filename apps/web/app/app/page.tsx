import { redirect } from "next/navigation";
import { listClinics } from "@/lib/api";

/** /app opens the dashboard of the clinic analysed most recently, or setup when there is none yet. */
export default async function AppIndex() {
  const clinics = await listClinics();
  const latest = [...clinics].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];
  redirect(latest ? `/app/clinics/${latest.id}` : "/onboarding");
}
