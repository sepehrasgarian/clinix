import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setDevUser } from "@/lib/identity";
import { BackToTop } from "@/components/landing/BackToTop";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { Reveal } from "@/components/landing/Reveal";

const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  act(() => { window.dispatchEvent(new Event("scroll")); });
};

afterEach(() => scrollTo(0));

describe("landing nav", () => {
  it("links to each section and to the start flow", () => {
    render(<Nav />);
    for (const id of ["features", "how-it-works", "numbers"]) {
      expect(document.querySelector(`a[href="/#${id}"]`)).not.toBeNull();
    }
    expect(document.querySelector('a[href="/blog"]')).not.toBeNull();
    expect(document.querySelector('a[href="/pricing"]')).not.toBeNull();
    expect(screen.getAllByRole("link", { name: /book a demo/i })[0]).toHaveAttribute("href", "/demo");
  });
  it("gains a border once scrolled and opens a menu on small screens", () => {
    render(<Nav />);
    const bar = screen.getByRole("banner");
    expect(bar.className).toContain("border-transparent");
    scrollTo(900);
    expect(bar.className).toContain("border-line");
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link", { name: /contact/i })).toHaveLength(2);
  });
});

describe("back to top", () => {
  it("only appears after the first screen and scrolls up", () => {
    window.scrollTo = (() => {}) as typeof window.scrollTo;
    render(<BackToTop />);
    expect(screen.queryByRole("button", { name: /back to top/i })).toBeNull();
    scrollTo(1200);
    expect(screen.getByRole("button", { name: /back to top/i })).toBeInTheDocument();
  });
});

describe("footer", () => {
  it("repeats the main call to action and offers the newsletter with explicit consent", () => {
    const { container } = render(<Footer />);
    expect(screen.getByRole("link", { name: /book a live demo/i })).toHaveAttribute("href", "/demo");
    expect(screen.getByLabelText(/enter your email/i)).toBeRequired();
    expect(screen.getByRole("checkbox")).toBeRequired();
    expect(container.textContent).not.toMatch(/\bAI\b|Anthropic|Apify|SurrealDB|Google Places/i);
  });
});

describe("reveal", () => {
  it("keeps content in the document and marks it shown when no observer exists", () => {
    render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello").className).toContain("in");
  });
});

describe("login or account in the nav", () => {
  beforeEach(() => window.localStorage.clear());
  it("offers Login to a visitor with no account, and never My Account", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/sign-in");
    expect(screen.queryByRole("link", { name: /my account/i })).toBeNull();
  });
  it("shows My Account, linking to the app, once there is a user", () => {
    window.localStorage.setItem("clinix.user", "dev");
    render(<Nav />);
    expect(screen.getByRole("link", { name: /my account/i })).toHaveAttribute("href", "/app");
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
  });
  it("follows the change at once when someone signs in, without a reload", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    act(() => setDevUser("dev"));
    expect(screen.getByRole("link", { name: /my account/i })).toBeInTheDocument();
  });
});
