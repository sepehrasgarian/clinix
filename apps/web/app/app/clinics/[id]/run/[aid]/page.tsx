import type { Metadata } from "next";
import { RunClient } from "./RunClient";
import { getAnalysis, getClinic } from "@/lib/api";

export const metadata: Metadata = { title: "Your report" };

export default async function RunPage({ params }: { params: Promise<{ id: string; aid: string }> }) {
  const { id, aid } = await params;
  const [{ clinic }, analysis] = await Promise.all([getClinic(id), getAnalysis(id, aid)]);
  return <RunClient clinic={clinic} analysis={analysis} />;
}
