import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BlogArt } from "@/components/blog/BlogArt";
import { BackToTop } from "@/components/landing/BackToTop";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { blogPosts, findPost, formatPostDate } from "@/lib/blog";
import { getLanding } from "@/lib/i18n/server";
import { getLang } from "@/lib/i18n/server";
import { LANG_INFO } from "@/lib/i18n/languages";

type Params = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => blogPosts.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = findPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function BlogPostPage({ params }: Params) {
  const post = findPost((await params).slug);
  if (!post) notFound();
  const t = (await getLanding()).blog;
  const locale = LANG_INFO[await getLang()].locale;
  return (
    <>
      <Nav />
      <main className="bg-[#f7f8fc] pt-[88px] pb-[clamp(4.5rem,7vw,6.5rem)] lg:pt-[96px]">
        <article className="mx-auto w-[min(820px,100%-3rem)] pt-12">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"><ArrowLeft size={14} aria-hidden />{t.back}</Link>
          <p className="mt-8 text-xs font-bold tracking-[0.2em] text-[#4f46e5] uppercase">{post.category}</p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.04em]">{post.title}</h1>
          <p className="mt-4 text-sm text-faint"><time dateTime={post.date}>{formatPostDate(post.date, locale)}</time> · {post.minutes} {t.minutes}</p>
          <div className="mt-8 overflow-hidden rounded-[22px]"><BlogArt art={post.art} className="aspect-[16/9] w-full" /></div>
          <p className="mt-8 text-lg leading-relaxed text-ink-grey">{post.excerpt}</p>
          <p className="mt-6 rounded-2xl border border-line bg-white p-5 text-[15px] text-ink-grey">{t.soon}</p>
        </article>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
