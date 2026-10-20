import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { listClinics } from "@/lib/api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [clinic] = await listClinics();
  if (!clinic) redirect("/start");
  return <AppShell clinic={clinic}>{children}</AppShell>;
}
