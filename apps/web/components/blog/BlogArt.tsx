import type { BlogArt as ArtKey } from "@/lib/blog";
import { scenes } from "@/components/blog/ArtScenes";

const tints: Record<ArtKey, [string, string, string]> = {
  report: ["#0b1230", "#1b2a6b", "#3b82f6"],
  reviews: ["#0b1230", "#1e2260", "#f59e0b"],
  audit: ["#0b1230", "#1d2a63", "#e9a23b"],
  geo: ["#0a0d24", "#22134f", "#a855f7"],
  competitors: ["#0b1030", "#231a63", "#f3c163"],
  website: ["#0f0b26", "#3b1457", "#ec4899"],
  locations: ["#0b1230", "#1a2860", "#3b82f6"],
};

/** Cover illustration drawn in code: dark gradient, glass panels, one glowing accent per topic. Decorative. */
export function BlogArt({ art, className }: { art: ArtKey; className?: string }) {
  const [from, to, glow] = tints[art];
  const Scene = scenes[art];
  return (
    <svg aria-hidden viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        <linearGradient id={`bg-${art}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
        <radialGradient id={`glow-${art}`} cx=".5" cy=".55" r=".6"><stop offset="0" stopColor={glow} stopOpacity=".38" /><stop offset="1" stopColor={glow} stopOpacity="0" /></radialGradient>
        <linearGradient id="g-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#60a5fa" /><stop offset="1" stopColor="#2563eb" /></linearGradient>
        <linearGradient id="g-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fdba74" /><stop offset="1" stopColor="#ea580c" /></linearGradient>
        <linearGradient id="g-violet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c084fc" /><stop offset="1" stopColor="#7c3aed" /></linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="800" height="450" fill={`url(#bg-${art})`} />
      <rect width="800" height="450" fill={`url(#glow-${art})`} />
      <Scene />
    </svg>
  );
}
