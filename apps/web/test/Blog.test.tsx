import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BlogPostPage, { generateStaticParams } from "@/app/blog/[slug]/page";
import { BlogArt } from "@/components/blog/BlogArt";
import { PostCard } from "@/components/blog/PostCard";
import { blogPosts, findPost, formatPostDate } from "@/lib/blog";

describe("blog data", () => {
  it("has the seven topics, newest first, with unique slugs and cover art", () => {
    expect(blogPosts).toHaveLength(7);
    expect(new Set(blogPosts.map((p) => p.slug)).size).toBe(7);
    expect(new Set(blogPosts.map((p) => p.art)).size).toBe(7);
    const dates = blogPosts.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
  it("formats dates as the cards show them", () => {
    expect(formatPostDate("2026-10-25")).toBe("October 25, 2026");
  });
  it("finds a post by slug and returns nothing for an unknown one", () => {
    expect(findPost("geo-for-clinics")?.category).toBe("GEO");
    expect(findPost("nope")).toBeUndefined();
  });
});

describe("post card", () => {
  it("shows category, date, reading time and a link to the article", () => {
    render(<PostCard post={blogPosts[1]} />);
    expect(screen.getByText("Reputation")).toBeInTheDocument();
    expect(screen.getByText(/October 24, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/8 min read/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read article/i })).toHaveAttribute("href", `/blog/${blogPosts[1].slug}`);
  });
  it("gives each cover its own gradient ids so covers do not borrow each other's colours", () => {
    const { container } = render(<><BlogArt art="report" /><BlogArt art="geo" /></>);
    const ids = [...container.querySelectorAll("linearGradient[id^='bg-'], radialGradient[id^='glow-']")].map((n) => n.id);
    expect(ids).toEqual(["bg-report", "glow-report", "bg-geo", "glow-geo"]);
  });
});

describe("article page", () => {
  it("lists a static route per post", () => {
    expect(generateStaticParams()).toHaveLength(7);
  });
  it("says plainly that the full article is not up yet", async () => {
    render(await BlogPostPage({ params: Promise.resolve({ slug: "geo-for-clinics" }) }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/GEO for clinics/);
    expect(screen.getByText(/full article is being finished/i)).toBeInTheDocument();
  });
});
