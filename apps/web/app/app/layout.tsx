import { redirect } from "next/navigation";
import { listClinics } from "@/lib/api";

/** Everything under /app needs at least one clinic; the shell itself lives under /app/clinics/[id]. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const clinics = await listClinics();
  if (clinics.length === 0) redirect("/start");
  return children;
}
