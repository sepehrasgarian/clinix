import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getChat, listClinics } from "@/lib/api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [clinic] = await listClinics();
  if (!clinic) redirect("/app/onboarding");
  const chat = await getChat();
  return (
    <AppShell clinic={clinic} chat={chat}>
      {children}
    </AppShell>
  );
}
