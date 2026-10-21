import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

const files = {
  /** The Clinx.app wordmark used on the marketing pages: 1385 x 373. */
  wordmark: { light: "/clinx-app-logo.png", dark: "/clinx-app-logo-light.png", ratio: 1385 / 373, alt: "Clinx.app" },
  /** The original ClinX logo used inside the app (sidebar, setup): 1057 x 346. */
  classic: { light: "/clinx-logo-dark.png", dark: "/clinx-logo.png", ratio: 1057 / 346, alt: "ClinX" },
} as const;

/**
 * The logo. `surface` picks the artwork for the background it sits on (ink letters for light, white for dark),
 * `variant` picks the family, and `height` is the rendered height in pixels.
 */
export function Logo({ surface = "dark", variant = "wordmark", height = 28, href = "/", className }: { surface?: "dark" | "light"; variant?: keyof typeof files; height?: number; href?: string; className?: string }) {
  const f = files[variant];
  const width = Math.round(height * f.ratio);
  return (
    <Link href={href} aria-label={`${f.alt} home`} className={clsx("inline-flex items-center", className)}>
      <Image src={f[surface]} alt={f.alt} width={width} height={height} priority className="block" style={{ height, width }} />
    </Link>
  );
}
