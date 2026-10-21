"use client";

import clsx from "clsx";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogArt } from "@/components/blog/BlogArt";
import { formatPostDate, type BlogPost } from "@/lib/blog";
import { useLang, useLanding } from "@/components/i18n/LangProvider";

/** One article card. The featured one lays the cover beside the text on wide screens. */
export function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const t = useLanding().blog;
  const { locale } = useLang();
  return (
    <article className={clsx("group overflow-hidden rounded-[22px] border border-[#ecedf5] bg-white shadow-[0_22px_50px_-40px_rgba(76,70,180,.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_60px_-34px_rgba(76,70,180,.5)]", featured ? "grid md:grid-cols-[1.1fr_1fr]" : "flex flex-col")}>
      <Link href={`/blog/${post.slug}`} aria-label={post.title} className={clsx("relative block overflow-hidden", featured ? "min-h-[260px]" : "aspect-[16/9]")}>
        <BlogArt art={post.art} className="absolute inset-0 size-full" />
        <span className="absolute top-4 left-4 rounded-full border border-white/20 bg-[#0b1230]/70 px-3 py-1 text-[10.5px] font-bold tracking-[0.16em] text-white uppercase backdrop-blur">{post.category}</span>
      </Link>
      <div className={clsx("flex flex-col", featured ? "justify-center p-8 md:p-10" : "flex-1 p-6")}>
        <p className="text-xs text-faint"><time dateTime={post.date}>{formatPostDate(post.date, locale)}</time> · {post.minutes} {t.minutes}</p>
        <h2 className={clsx("mt-3 font-bold tracking-[-0.03em] text-ink", featured ? "text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.12]" : "text-[19px] leading-snug")}>
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link>
        </h2>
        <p className={clsx("mt-3 text-ink-grey", featured ? "text-[15px] leading-relaxed" : "flex-1 text-[14px] leading-relaxed")}>{post.excerpt}</p>
        <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">{t.read} <ArrowRight size={14} aria-hidden /></Link>
      </div>
    </article>
  );
}
