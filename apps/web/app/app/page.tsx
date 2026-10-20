import { redirect } from "next/navigation";
import { listClinics } from "@/lib/api";

/** /app opens the dashboard of the clinic analysed most recently. */
export default async function AppIndex() {
  const clinics = await listClinics();
  const latest = [...clinics].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];
  redirect(`/app/clinics/${latest.id}`);
}
