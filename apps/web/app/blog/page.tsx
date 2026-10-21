import type { Metadata } from "next";
import { PostCard } from "@/components/blog/PostCard";
import { BackToTop } from "@/components/landing/BackToTop";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { blogPosts } from "@/lib/blog";
import { getLanding } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getLanding()).blog;
  return { title: t.title, description: t.sub };
}

export default async function BlogPage() {
  const t = (await getLanding()).blog;
  const [featured, ...rest] = blogPosts;
  return (
    <>
      <Nav />
      <main className="relative overflow-hidden bg-[#f7f8fc] pt-[88px] pb-[clamp(4.5rem,7vw,6.5rem)] lg:pt-[96px]">
        <div aria-hidden className="pointer-events-none absolute -left-72 top-40 size-[640px] rounded-full border border-[#e3e6f2]" />
        <div aria-hidden className="pointer-events-none absolute -right-72 top-10 size-[640px] rounded-full border border-[#f1e6d2]" />
        <div className="relative mx-auto w-[min(1240px,100%-3rem)]">
          <header className="pt-14 text-center lg:pt-16">
            <p className="text-xs font-bold tracking-[0.3em] text-[#4f46e5] uppercase">{t.eyebrow}</p>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[1.05] tracking-[-0.045em]">{t.headline1}<br /><span className="text-gradient-light">{t.headline2}</span></h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-ink-grey">{t.sub}</p>
          </header>
          <div className="mt-14 space-y-6">
            <PostCard post={featured} featured />
            <div className="grid gap-6 md:grid-cols-2">{rest.map((p) => <PostCard key={p.slug} post={p} />)}</div>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
