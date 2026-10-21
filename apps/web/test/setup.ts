import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/** Components that use the router render without an app router in unit tests. Tests that need their own mock declare it. */
vi.mock("next/navigation", () => {
  const router = { refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() };
  return { useRouter: () => router, usePathname: () => "/", useSearchParams: () => new URLSearchParams(), redirect: vi.fn(), notFound: vi.fn() };
});
