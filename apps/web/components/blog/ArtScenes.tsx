import type { BlogArt } from "@/lib/blog";

const glass = { fill: "rgba(255,255,255,.12)", stroke: "rgba(255,255,255,.28)", strokeWidth: 1.5 } as const;
const Star = ({ x, y, s = 1, fill = "#f3c163" }: { x: number; y: number; s?: number; fill?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-12 3.5-3.7 12.5-3.2 5.6 2.6 7.8 11.3 0 6.6-7.8 11.3-5.6 2.6-12.5-3.2-3.5-3.7Z" fill={fill} />
);
const Sparkle = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-16Q1.5-1.5 16 0 1.5 1.5 0 16-1.5 1.5-16 0-1.5-1.5 0-16Z" fill="#f3c163" />;
const Check = ({ x, y, r = 16, fill }: { x: number; y: number; r?: number; fill: string }) => (
  <g><circle cx={x} cy={y} r={r} fill={fill} /><path d={`M${x - r * 0.45} ${y}l${r * 0.3} ${r * 0.32} ${r * 0.6}-${r * 0.7}`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></g>
);

function Report() {
  return (
    <g>
      <rect x="120" y="85" width="430" height="285" rx="34" {...glass} />
      {[60, 95, 130, 175, 215].map((h, i) => <rect key={h} x={175 + i * 62} y={330 - h} width="42" height={h} rx="8" fill="url(#g-blue)" />)}
      <polyline points="170,250 260,215 340,225 430,165 505,120" fill="none" stroke="#f3c163" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
      <path d="M470 112 512 112 512 154" fill="none" stroke="#f3c163" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="580" y="105" width="110" height="235" rx="26" {...glass} />
      {["#ef4444", "#f59e0b", "#3b82f6", "#3b82f6"].map((c, i) => <g key={c + i}><circle cx="615" cy={150 + i * 50} r="9" fill={c} /><rect x="633" y={146 + i * 50} width="36" height="8" rx="4" fill="rgba(255,255,255,.35)" /></g>)}
    </g>
  );
}

function Reviews() {
  return (
    <g>
      {[[-14, 150, 150], [-8, 270, 120], [-2, 390, 105], [6, 510, 120], [12, 620, 150]].map(([r, x, y], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x - 62} y={y - 42} width="124" height="84" rx="20" {...glass} />
          {[0, 1, 2, 3, 4].slice(0, 5 - (i % 2)).map((n) => <Star key={n} x={x - 40 + n * 20} y={y} s={0.8} />)}
        </g>
      ))}
      <rect x="395" y="215" width="70" height="165" rx="12" fill="url(#g-orange)" /><rect x="480" y="260" width="62" height="120" rx="12" fill="url(#g-violet)" />
      {[0, 1, 2, 3, 4].map((n) => <g key={n} transform={`rotate(${-8 + n * 4} ${200 + n * 90} 330)`}><rect x={150 + n * 90} y="300" width="100" height="62" rx="16" {...glass} /><Star x={200 + n * 90} y={331} s={0.8} /></g>)}
    </g>
  );
}

function Audit() {
  return (
    <g>
      <rect x="470" y="85" width="210" height="260" rx="28" {...glass} />
      {[0, 1, 2, 3].map((n) => <g key={n}><Check x={505} y={130 + n * 55} r={14} fill="#22c55e" /><rect x="535" y={122 + n * 55} width={n === 3 ? 90 : 110} height="16" rx="8" fill="rgba(255,255,255,.4)" /></g>)}
      <rect x="130" y="205" width="200" height="140" rx="10" fill="#e6c9a0" /><polygon points="115,210 230,140 345,210" fill="#b9814c" />
      {[0, 1].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={150 + c * 55} y={230 + r * 50} width="34" height="34" rx="4" fill="#ffe29a" />))}
      <circle cx="330" cy="215" r="75" fill="rgba(255,255,255,.1)" stroke="#e9a23b" strokeWidth="14" /><line x1="385" y1="270" x2="440" y2="330" stroke="#a9701f" strokeWidth="20" strokeLinecap="round" />
    </g>
  );
}

function Geo() {
  return (
    <g>
      <rect x="290" y="70" width="220" height="90" rx="38" {...glass} /><polygon points="360,160 345,190 395,160" fill="rgba(255,255,255,.16)" />
      <Sparkle x={210} y={120} s={1} /><Sparkle x={600} y={150} s={1} />
      <rect x="130" y="215" width="540" height="165" rx="32" {...glass} />
      <Check x={185} y={262} r={22} fill="#a855f7" /><rect x="230" y="245" width="390" height="36" rx="18" fill="url(#g-violet)" />
      {[0, 1, 2].map((n) => [0, 1].map((r) => <rect key={`${n}${r}`} x={165 + n * 150} y={315 + r * 32} width="110" height="20" rx="10" fill="rgba(255,255,255,.3)" />))}
    </g>
  );
}

function Competitors() {
  const blocks = [[60, 250, 70, 110], [140, 280, 60, 80], [210, 230, 70, 130], [520, 240, 70, 120], [600, 270, 60, 90], [670, 225, 70, 135], [100, 330, 80, 50], [620, 340, 90, 45]];
  return (
    <g>
      {blocks.map(([x, y, w, h], i) => <g key={i}><rect x={x} y={y} width={w} height={h} rx="6" fill="#1d2a6b" stroke="rgba(255,255,255,.15)" />{[0, 1, 2].map((n) => <rect key={n} x={x + 12 + (n % 2) * 26} y={y + 14 + Math.floor(n / 2) * 24} width="14" height="12" rx="2" fill="#6d5cf5" opacity=".7" />)}</g>)}
      {[190, 150, 110].map((rx, i) => <ellipse key={rx} cx="400" cy="345" rx={rx} ry={rx * 0.3} fill="none" stroke="#f3c163" strokeWidth={5 - i} opacity={1 - i * 0.18} filter="url(#glow)" />)}
      <rect x="350" y="255" width="100" height="90" rx="8" fill="#e8d3b0" /><polygon points="340,260 400,215 460,260" fill="#a56a3a" /><rect x="385" y="290" width="30" height="55" rx="4" fill="#ffd77a" />
      <path d="M400 150c-26 0-44 18-44 42 0 30 44 66 44 66s44-36 44-66c0-24-18-42-44-42Z" fill="url(#g-blue)" filter="url(#glow)" /><circle cx="400" cy="190" r="15" fill="#fff" />
    </g>
  );
}

function Website() {
  return (
    <g>
      <rect x="290" y="65" width="150" height="320" rx="30" {...glass} /><rect x="312" y="95" width="106" height="125" rx="12" fill="rgba(255,255,255,.22)" /><rect x="312" y="235" width="106" height="14" rx="7" fill="rgba(255,255,255,.35)" /><rect x="312" y="335" width="106" height="30" rx="15" fill="#ec4899" filter="url(#glow)" />
      <rect x="470" y="140" width="210" height="190" rx="24" {...glass} />
      {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => <rect key={`${r}${c}`} x={490 + c * 34} y={190 + r * 28} width="22" height="16" rx="4" fill={r === 1 && c === 2 ? "#ec4899" : "rgba(255,255,255,.3)"} />))}
      <Check x={668} y={322} r={24} fill="#ec4899" />
      <rect x="110" y="250" width="150" height="62" rx="31" {...glass} /><circle cx="150" cy="281" r="16" fill="none" stroke="#fff" strokeWidth="5" /><line x1="162" y1="293" x2="176" y2="307" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M262 285C330 330 400 380 470 300" fill="none" stroke="#f9a8d4" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" />
    </g>
  );
}

function Locations() {
  return (
    <g>
      <path d="M150 300C220 180 280 150 340 175S460 260 520 190" fill="none" stroke="#f3c163" strokeWidth="6" strokeLinecap="round" filter="url(#glow)" />
      {[[150, 165, [40, 70, 55]], [300, 105, [70, 100, 85]], [450, 190, [55, 40, 75]]].map(([x, y, hs], i) => (
        <g key={i}><rect x={x as number} y={y as number} width="150" height="150" rx="24" {...glass} />{(hs as number[]).map((h, n) => <rect key={n} x={(x as number) + 28 + n * 38} y={(y as number) + 125 - h} width="24" height={h} rx="6" fill="url(#g-blue)" />)}<circle cx={(x as number) + 75} cy={(y as number) - 8} r="9" fill="#fff" stroke="#f3c163" strokeWidth="4" /></g>
      ))}
      <rect x="640" y="105" width="85" height="215" rx="24" {...glass} />
      {["#ef4444", "#f59e0b", "#3b82f6", "#3b82f6"].map((c, i) => <g key={c + i}><circle cx="665" cy={145 + i * 45} r="8" fill={c} /><rect x="680" y={141 + i * 45} width="26" height="8" rx="4" fill="rgba(255,255,255,.35)" /></g>)}
    </g>
  );
}

export const scenes: Record<BlogArt, () => React.JSX.Element> = { report: Report, reviews: Reviews, audit: Audit, geo: Geo, competitors: Competitors, website: Website, locations: Locations };
