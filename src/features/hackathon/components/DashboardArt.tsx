import { cn } from "@/lib/utils";

/**
 * Hero illustration: laptop + checklist + trophy + paper planes, recreated as SVG
 * so it stays crisp and each piece can float independently. Swap this component
 * for a photo (e.g. the event group photo) without touching the hero layout.
 */
export function DashboardArt({ className }: Readonly<{ className?: string }>) {
  return (
    <div className={cn("relative aspect-[300/230] w-full select-none", className)} aria-hidden>
      {/* Glow pool */}
      <div className="absolute inset-x-[8%] bottom-[2%] h-[38%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(70,90,255,0.55),transparent_70%)] blur-xl" />

      {/* Laptop */}
      <svg viewBox="0 0 200 150" className="hk-bob-3 absolute bottom-[4%] left-[2%] w-[70%] drop-shadow-[0_18px_30px_rgba(60,60,255,0.45)]">
        <defs>
          <linearGradient id="hk-art-lid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8f7bff" />
            <stop offset="1" stopColor="#3b4cff" />
          </linearGradient>
          <linearGradient id="hk-art-screen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a1f6b" />
            <stop offset="1" stopColor="#0b1140" />
          </linearGradient>
          <linearGradient id="hk-art-base" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6d7cff" />
            <stop offset="0.5" stopColor="#a9b4ff" />
            <stop offset="1" stopColor="#5a63f0" />
          </linearGradient>
          <filter id="hk-art-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* lid */}
        <path d="M38 14 L150 6 Q158 5.5 158.6 13 L163 92 Q163.5 99 156 99.5 L46 106 Q38.5 106.5 38 99 Z" fill="url(#hk-art-lid)" />
        <path d="M45 20 L150 12.5 L154.5 90 L49.5 97 Z" fill="url(#hk-art-screen)" />
        {/* </> glyph */}
        <g filter="url(#hk-art-glow)" stroke="#8fd3ff" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M86 42 L75 54 L87 66" />
          <path d="M116 40 L127 52 L115 64" />
          <path d="M106 36 L96 70" />
        </g>
        {/* base / keyboard */}
        <path d="M30 104 L166 96 L190 124 Q192 130 185 131 L22 140 Q14 140.5 16 134 Z" fill="url(#hk-art-base)" />
        <path d="M40 107 L160 100 L172 116 L36 124 Z" fill="#3c43c9" opacity="0.55" />
        {Array.from({ length: 4 }).map((_, r) => (
          <path
            key={r}
            d={`M${44 - r * 2} ${109 + r * 4} L${160 + r * 3} ${102 + r * 4}`}
            stroke="#c9d0ff"
            strokeOpacity="0.35"
            strokeWidth="1.2"
            strokeDasharray="5 2.2"
          />
        ))}
        <path d="M84 126 L116 124 L117 131 L85 133 Z" fill="#8a96ff" opacity="0.8" />
      </svg>

      {/* Checklist card */}
      <svg viewBox="0 0 90 70" className="hk-bob-1 absolute left-[40%] top-[2%] w-[34%] -rotate-[8deg] drop-shadow-[0_14px_24px_rgba(20,120,255,0.45)]">
        <rect x="2" y="2" width="86" height="66" rx="9" fill="#0d2350" stroke="#3aa6ff" strokeWidth="2" />
        {[16, 36].map((y) => (
          <g key={y}>
            <rect x="11" y={y - 7} width="14" height="14" rx="3" fill="none" stroke="#2fe0b0" strokeWidth="2.2" />
            <path d={`M14 ${y} l3.5 3.5 l6.5 -8`} fill="none" stroke="#2fe0b0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="31" y={y - 4} width="48" height="4" rx="2" fill="#4fb4ff" />
            <rect x="31" y={y + 2} width="32" height="3" rx="1.5" fill="#4fb4ff" opacity="0.5" />
          </g>
        ))}
        <rect x="11" y="52" width="64" height="4" rx="2" fill="#4fb4ff" opacity="0.4" />
      </svg>

      {/* Small card */}
      <svg viewBox="0 0 60 40" className="hk-bob-2 absolute right-[16%] top-[47%] w-[20%] -rotate-[6deg] drop-shadow-[0_10px_20px_rgba(20,120,255,0.45)]">
        <rect x="2" y="2" width="56" height="36" rx="7" fill="#123a7a" stroke="#4fb4ff" strokeWidth="1.8" />
        <rect x="10" y="12" width="38" height="4" rx="2" fill="#8fd3ff" />
        <rect x="10" y="21" width="28" height="4" rx="2" fill="#8fd3ff" opacity="0.55" />
      </svg>

      {/* Trophy */}
      <svg viewBox="0 0 64 70" className="hk-trophy absolute right-[1%] top-[10%] w-[19%]" style={{ "--hk-accent": "170 120 255" } as React.CSSProperties}>
        <defs>
          <linearGradient id="hk-art-cup" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d6b8ff" />
            <stop offset="1" stopColor="#8a4bff" />
          </linearGradient>
        </defs>
        <path d="M16 12c-7 0-10 4-9 9 1 7 7 11 13 12M48 12c7 0 10 4 9 9-1 7-7 11-13 12" fill="none" stroke="url(#hk-art-cup)" strokeWidth="4" strokeLinecap="round" />
        <path d="M14 6h36v16c0 11-8 19-18 19S14 33 14 22V6z" fill="url(#hk-art-cup)" />
        <path d="M32 13l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#5b2bc4" opacity="0.85" />
        <rect x="27" y="40" width="10" height="10" rx="2" fill="url(#hk-art-cup)" />
        <rect x="18" y="50" width="28" height="9" rx="3" fill="url(#hk-art-cup)" />
      </svg>

      {/* Paper planes */}
      <PaperPlane className="hk-bob-2 absolute left-[20%] top-[6%] w-[11%] -rotate-[18deg]" />
      <PaperPlane className="hk-bob-1 absolute bottom-[14%] right-[2%] w-[17%] rotate-[-8deg]" />

      {/* Sparkles */}
      <Sparkle className="absolute left-[4%] top-[48%] w-[4%] text-[#4fb4ff]" />
      <Sparkle className="absolute left-[33%] top-[14%] w-[3%] text-[#8fd3ff]" />
      <Sparkle className="absolute right-[3%] top-[44%] w-[4%] text-[#ffd45e]" />
      <span className="absolute left-[14%] top-[28%] size-1 rounded-full bg-[#8fd3ff] shadow-[0_0_6px_2px_rgba(143,211,255,0.6)]" />
      <span className="absolute right-[30%] top-[6%] size-1 rounded-full bg-[#c9b8ff] shadow-[0_0_6px_2px_rgba(201,184,255,0.6)]" />
    </div>
  );
}

function PaperPlane({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 48 40" className={cn("drop-shadow-[0_8px_16px_rgba(140,90,255,0.5)]", className)}>
      <path d="M2 18 L46 2 L30 38 L22 24 Z" fill="#b69bff" />
      <path d="M22 24 L46 2 L16 21 Z" fill="#7d5cf0" />
      <path d="M22 24 L24 34 L30 38 Z" fill="#6a48e0" />
    </svg>
  );
}

function Sparkle({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 20 20" className={cn("animate-pulse", className)} fill="currentColor">
      <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" />
    </svg>
  );
}
