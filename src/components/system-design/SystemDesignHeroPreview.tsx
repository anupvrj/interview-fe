"use client";

/**
 * Kafka-style hub diagram. Surface colors align with system-design hero (blue/indigo).
 * Dashed Kafka → microservice edges use marching ants (`prefers-reduced-motion` disables).
 */
export function SystemDesignHeroPreview() {
  const stroke = "#3f3f46";
  const teal = "#4a9099";
  const tealDark = "#3d7a82";
  const orange = "#f59e0b";
  const sky = "#93c5fd";
  const skyFill = "#dbeafe";

  return (
    <>
      <style>{`
        @keyframes sd-hub-march {
          to {
            stroke-dashoffset: -32;
          }
        }
        .sd-hub-dash-msg {
          fill: none;
          stroke: ${stroke};
          stroke-width: 2.35;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 6 10;
          animation: sd-hub-march 2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .sd-hub-dash-msg {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="relative isolate z-10 mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-white via-muted to-indigo-50 shadow-lg shadow-primary/15 ring-1 ring-border"
        role="img"
        aria-label="Architecture diagram with load balancer, database, Kafka hub, cloud, cache, and microservices connected by arrows."
      >
        <div className="border-b border-border/60 bg-muted px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/55">
            Practice flow
          </div>
        </div>

        <div className="relative bg-muted p-3">
          <svg
            className="h-auto w-full max-w-full aspect-[420/318]"
            viewBox="0 0 420 318"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <marker id="sd-hub-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0 0 L8 4 L0 8 Z" fill={stroke} />
              </marker>
            </defs>

            {/* Diagram canvas — opaque blue-50 (no bleed from hero floaters) */}
            <rect x="8" y="6" width="404" height="276" rx="14" fill="#eff6ff" />

            {/* ——— Load balancer ——— */}
            <g transform="translate(210, 44)">
              <rect x="-22" y="-14" width="44" height="28" rx="4" fill="rgb(74 144 153 / 0.12)" stroke={teal} strokeWidth="2" />
              <line x1="-14" y1="-2" x2="14" y2="-2" stroke={tealDark} strokeWidth="2" strokeLinecap="round" />
              <path d="M 14 -6 L 18 -2 L 14 2 M -14 -6 L -18 -2 L -14 2" stroke={tealDark} strokeWidth="1.75" fill="none" strokeLinecap="round" />
            </g>
            <text x={210} y={82} fill={stroke} fontSize={9} fontWeight={700} letterSpacing="0.06em" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
              LOAD BALANCER
            </text>

            {/* Vertical Request */}
            <line x1={210} y1={88} x2={210} y2={144} stroke={stroke} strokeWidth={2.5} markerEnd="url(#sd-hub-arr)" />
            <text x={223} y={118} fill={stroke} fontSize={8.5} fontWeight={600} fontFamily="ui-sans-serif, system-ui, sans-serif">
              Request
            </text>

            {/* ——— Database ——— */}
            <g transform="translate(62, 156)">
              <ellipse cx="0" cy="-10" rx="22" ry="8" fill="rgb(74 144 153 / 0.15)" stroke={teal} strokeWidth="2" />
              <path d="M -22 -10 V 14 A 22 8 0 0 0 22 14 V -10" fill="rgb(74 144 153 / 0.08)" stroke={teal} strokeWidth="2" />
              <ellipse cx="0" cy="14" rx="22" ry="8" fill="rgb(74 144 153 / 0.12)" stroke={teal} strokeWidth="2" />
            </g>
            <text x={62} y={192} fill={stroke} fontSize={9} fontWeight={700} letterSpacing="0.06em" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
              DATABASE
            </text>

            {/* DB → Kafka (solid horizontal) */}
            <line x1={94} y1={156} x2={174} y2={156} stroke={stroke} strokeWidth={2.5} />

            {/* ——— Kafka hub ——— */}
            <g transform="translate(210, 156)">
              <circle cx="-26" cy="0" r="10" fill="#ffffff" stroke={stroke} strokeWidth="2.2" />
              <circle cx="0" cy="0" r="10" fill="#ffffff" stroke={stroke} strokeWidth="2.2" />
              <circle cx="26" cy="0" r="10" fill="#ffffff" stroke={stroke} strokeWidth="2.2" />
              <line x1="-16" y1="0" x2="-10" y2="0" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
              <line x1="10" y1="0" x2="16" y2="0" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
              <text x={52} y={5} fill={stroke} fontSize={14} fontWeight={800} fontFamily="ui-sans-serif, system-ui, sans-serif">
                kafka
              </text>
            </g>

            {/* Kafka → Cloud — longer gap before cloud */}
            <line x1={306} y1={156} x2={348} y2={156} stroke={stroke} strokeWidth={2.5} markerEnd="url(#sd-hub-arr)" />

            {/* ——— Cloud ——— */}
            <g transform="translate(384, 148)">
              <path
                d="M -36 -6 C -42 -14 -28 -22 -18 -18 C -14 -26 -4 -26 2 -20 C 12 -26 26 -14 22 -4 C 28 4 18 14 6 12 C -4 18 -28 12 -26 -2 Z"
                fill={skyFill}
                stroke={sky}
                strokeWidth="2"
              />
              <text x={0} y={5} fill={stroke} fontSize={9} fontWeight={800} letterSpacing="0.05em" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
                CLOUD
              </text>
            </g>

            {/* Cloud → Cache */}
            <line x1={384} y1={166} x2={384} y2={226} stroke={stroke} strokeWidth={2.5} markerEnd="url(#sd-hub-arr)" />

            {/* ——— Cache ——— */}
            <g transform="translate(384, 246)">
              <rect x="-22" y="-14" width="44" height="28" rx="5" fill="rgb(74 144 153 / 0.1)" stroke={teal} strokeWidth="2" />
              <line x1="-12" y1="-4" x2="12" y2="-4" stroke={tealDark} strokeWidth="2" strokeLinecap="round" />
              <line x1="-12" y1="2" x2="12" y2="2" stroke={tealDark} strokeWidth="2" strokeLinecap="round" />
              <line x1="-12" y1="8" x2="12" y2="8" stroke={tealDark} strokeWidth="2" strokeLinecap="round" />
            </g>
            <text x={384} y={282} fill={stroke} fontSize={9} fontWeight={700} letterSpacing="0.06em" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
              CACHE
            </text>

            {/* Kafka bottom fan → microservices (dashed + animated) */}
            <path className="sd-hub-dash-msg" markerEnd="url(#sd-hub-arr)" d="M 210 166 L 210 180 L 82 252" />
            <path className="sd-hub-dash-msg" markerEnd="url(#sd-hub-arr)" d="M 210 166 L 210 184 L 156 252" />
            <path className="sd-hub-dash-msg" markerEnd="url(#sd-hub-arr)" d="M 210 166 L 210 184 L 230 252" />
            <path className="sd-hub-dash-msg" markerEnd="url(#sd-hub-arr)" d="M 210 166 L 210 188 L 304 252" />

            <text x={128} y={208} fill={stroke} fontSize={8.5} fontWeight={600} fontFamily="ui-sans-serif, system-ui, sans-serif">
              Message
            </text>
            <text x={238} y={210} fill={stroke} fontSize={8.5} fontWeight={600} fontFamily="ui-sans-serif, system-ui, sans-serif">
              Message
            </text>

            {/* ——— Microservices row ——— */}
            {[82, 156, 230, 304].map((cx, i) => (
              <g key={cx} transform={`translate(${cx}, 266)`}>
                <rect x="-18" y="-14" width="36" height="26" rx="4" fill="rgb(251 146 60 / 0.14)" stroke={orange} strokeWidth="2" />
                <rect x="-14" y="-10" width="28" height="18" rx="2" fill="#ffffff" stroke={stroke} strokeWidth="1.35" />
                <circle cx="0" cy="-1" r="6" fill="rgb(74 144 153 / 0.2)" stroke={teal} strokeWidth="1.75" />
                <circle cx="0" cy="-1" r="2.5" fill={tealDark} />
              </g>
            ))}
            <text x={82} y={298} fill={stroke} fontSize={8} fontWeight={700} letterSpacing="0.06em" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
              MICROSERVICE
            </text>
            <text x={230} y={298} fill={stroke} fontSize={8} fontWeight={700} letterSpacing="0.06em" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
              MICROSERVICE
            </text>
            <text x={304} y={298} fill={stroke} fontSize={8} fontWeight={700} letterSpacing="0.06em" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
              MICROSERVICE
            </text>
          </svg>
        </div>
      </div>
    </>
  );
}
