import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <>
      <Nav />
      <main className="bg-surface pt-[88px] pb-[97px] lg:pt-[96px]">
        <div className="pt-[88px]"><AuthPanel mode="sign-up" /></div>
      </main>
      <Footer banner={false} />
    </>
  );
}
