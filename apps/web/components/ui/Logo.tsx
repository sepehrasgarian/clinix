import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

/**
 * The ClinX wordmark. Two files from the same artwork: white letters for dark surfaces and
 * ink letters for light ones, both with the gold X. `height` is the rendered height in pixels;
 * the files are 1057 x 346.
 */
export function Logo({ surface = "dark", height = 28, href = "/", className }: { surface?: "dark" | "light"; height?: number; href?: string; className?: string }) {
  const width = Math.round((height * 1057) / 346);
  const src = surface === "light" ? "/clinx-logo-dark.png" : "/clinx-logo.png";
  return (
    <Link href={href} aria-label="ClinX home" className={clsx("inline-flex items-center", className)}>
      <Image src={src} alt="ClinX" width={width} height={height} priority className="block" style={{ height, width }} />
    </Link>
  );
}
