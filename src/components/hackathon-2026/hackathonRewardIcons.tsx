/** Brand-style icons for hackathon prize callouts (Claude burst, Amazon gift tile). */

export function ClaudeBurstIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="14.6"
          y="2"
          width="2.8"
          height="12"
          rx="1.4"
          fill="#e8704a"
          transform={`rotate(${i * 30} 16 16)`}
        />
      ))}
    </svg>
  );
}

export function AmazonGiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 32" className={className} aria-hidden>
      <text x="4" y="21" fontSize="17" fontWeight="700" fill="#fff" fontFamily="Arial, Helvetica, sans-serif">
        amazon
      </text>
      <path d="M6 24.5 Q28 31 50 24.5" fill="none" stroke="#ff9900" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M44 22.5 L50.5 24.2 L48.8 28"
        fill="none"
        stroke="#ff9900"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
