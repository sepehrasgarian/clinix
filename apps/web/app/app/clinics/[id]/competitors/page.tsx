import type { Metadata } from "next";
import { CompetitorList } from "@/components/competitors/CompetitorList";
import { EmptyReport } from "@/components/report/EmptyReport";
import { getClinic, getInProgress, getLatestReport } from "@/lib/api";

export const metadata: Metadata = { title: "Competitors" };

export default async function CompetitorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ clinic }, latest] = await Promise.all([getClinic(id), getLatestReport(id)]);
  if (!latest) return <EmptyReport clinicId={id} inProgress={await getInProgress(id)} />;
  const place = latest.analysis.scan?.place;
  return (
    <>
      <header className="mb-6">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#66718b] uppercase">Competitors</p>
        <h1 className="mt-1 text-[clamp(28px,3vw,36px)] leading-[1.1] font-semibold tracking-[-0.03em] text-[#101936]">Local competitors near your clinic</h1>
        <p className="mt-2 max-w-3xl text-[15px] text-[#66718b]">Explore nearby clinics, compare their online presence, and identify where your clinic stands in the local market.</p>
      </header>
      <CompetitorList report={latest.report} disciplines={clinic.disciplines} you={{ reviews: place?.reviewCount, rating: place?.rating, services: latest.analysis.scan?.understanding.services.length }} findingsHref={`/app/clinics/${id}/findings`} />
    </>
  );
}
