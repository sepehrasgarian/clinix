import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { getLanding } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLanding()).login.title };
}

/** The old /login address shows the sign-in form. */
export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="bg-surface pt-[88px] pb-[97px] lg:pt-[96px]">
        <div className="pt-[88px]"><AuthPanel mode="sign-in" /></div>
      </main>
      <Footer banner={false} />
    </>
  );
}
