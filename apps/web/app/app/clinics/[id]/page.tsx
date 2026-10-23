import type { Metadata } from "next";
import { Dashboard } from "@/components/report/Dashboard";
import { getClinic } from "@/lib/api";
import { resolveDashboard } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { clinic, analyses } = await getClinic(id);
  const { hero, latest } = resolveDashboard(analyses);
  return <Dashboard clinic={clinic} hero={hero} latest={latest} />;
}
