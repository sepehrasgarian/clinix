import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { getLanding } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLanding()).login.title };
}

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="bg-surface pt-[88px] pb-[97px] lg:pt-[96px]">
        <div className="pt-[88px]"><LoginPanel /></div>
      </main>
      <Footer banner={false} />
    </>
  );
}
