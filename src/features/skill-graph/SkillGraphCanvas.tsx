"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useMediaMinWidth } from "@/hooks/useMediaMinWidth";
import type { SkillGraphNode } from "./types";
import { MAX_ZOOM, MIN_ZOOM, usePanZoom } from "./usePanZoom";
import {
  CENTER,
  GROUP_FONT,
  GROUP_GAP,
  GROUP_LINE,
  PAD,
  VIEW,
  firstRingRadius,
  groupLabelLines,
  type GraphLayout,
  type LaidNode,
} from "./layout";

/** Status → ring colour and line style, the homepage palette (strong / slipping / hidden strength) plus "not assessed". */
export const STATUS_STYLE: Record<
  string,
  {
    color: string;
    dash?: string;
    label: string;
    halo?: boolean;
    faint?: boolean;
  }
> = {
  verified: { color: "var(--sg-strong)", label: "Verified" },
  gap: { color: "var(--sg-gap)", dash: "3 2.5", label: "Gap" },
  claimed: { color: "var(--sg-claimed)", label: "On resume", halo: true },
  unassessed: {
    color: "var(--sg-untested)",
    dash: "1.5 3",
    label: "Not assessed",
    faint: true,
  },
  hidden: {
    color: "var(--sg-untested)",
    dash: "1.5 3",
    label: "Hidden",
    faint: true,
  },
};

const rad = (d: number) => (d * Math.PI) / 180;
const spring = { type: "spring", stiffness: 170, damping: 22 } as const;

export function scoreText(
  node: Pick<SkillGraphNode, "score" | "band">,
): string | null {
  if (node.band) return node.band[0].toUpperCase() + node.band.slice(1);
  return node.score !== null ? String(node.score) : null;
}

function Label({
  n,
  r,
  radial,
  selected,
  isGroup,
  phoneLabels,
}: {
  n: LaidNode;
  r: number;
  radial: boolean;
  selected: boolean;
  isGroup: boolean;
  phoneLabels: boolean;
}) {
  // Phones hide skill labels (chips list them) until the graph is zoomed in.
  const leafClass = phoneLabels ? undefined : "max-sm:hidden";
  const fill = selected || isGroup ? "var(--sg-text)" : "var(--sg-muted)";
  const weight = selected || isGroup ? 600 : 400;
  const size = isGroup ? GROUP_FONT : 17;
  const c = Math.cos(rad(n.angle));
  const s = Math.sin(rad(n.angle));
  const common = {
    fill,
    fontWeight: weight,
    fontSize: size,
    paintOrder: "stroke" as const,
    stroke: "var(--sg-canvas)",
    strokeWidth: 5,
    strokeLinejoin: "round" as const,
  };

  if (isGroup) {
    // Groups: name lines then score, on the side the layout picked to avoid neighbours.
    const rows = groupLabelLines(n.node);
    const side = n.labelSide ?? (s > 0.35 ? "below" : "above");
    const off = r + GROUP_GAP;
    const h = rows.length * GROUP_LINE;
    const anchor =
      side === "left" ? "end" : side === "right" ? "start" : "middle";
    const x = side === "left" ? -off : side === "right" ? off : 0;
    // Baseline of the first row.
    const top = side === "above" ? -off - h : side === "below" ? off : -h / 2;
    return (
      <>
        {rows.map((row, i) => (
          <text
            key={i}
            x={x}
            y={top + (i + 1) * GROUP_LINE - 6}
            textAnchor={anchor}
            {...common}
            fontSize={row.score ? 18 : GROUP_FONT}
            fontWeight={row.score ? 700 : common.fontWeight}
            fill={row.score ? "var(--sg-accent-soft)" : common.fill}
            fontFamily={
              row.score ? "var(--font-geist-mono, ui-monospace)" : undefined
            }
          >
            {row.text}
          </text>
        ))}
      </>
    );
  }
  // Near 12 and 6 o'clock level labels would sit side by side, so they follow the radius there.
  if (radial || Math.abs(c) < 0.55) {
    const flip = c < 0;
    const rot = flip ? n.angle + 180 : n.angle;
    return (
      <text
        transform={`rotate(${rot})`}
        x={flip ? -(r + 8) : r + 8}
        y={6}
        textAnchor={flip ? "end" : "start"}
        {...common}
        className={leafClass}
      >
        {n.node.name}
      </text>
    );
  }
  const vertical = Math.abs(c) < 0.15;
  return (
    <text
      x={vertical ? 0 : c >= 0 ? r + 9 : -(r + 9)}
      y={vertical ? (s > 0 ? r + 20 : -(r + 9)) : 6}
      textAnchor={vertical ? "middle" : c >= 0 ? "start" : "end"}
      {...common}
      className={leafClass}
    >
      {n.node.name}
    </text>
  );
}

/** Decorative orbit rings: through the first ring and just outside the outer ring. */
function ringRadii(layout: GraphLayout): number[] {
  const radii = [
    ...new Set(
      layout.nodes.map((n) =>
        Math.round(Math.hypot(n.x - CENTER, n.y - CENTER)),
      ),
    ),
  ]
    .filter((r) => r > 0)
    .sort((a, b) => a - b);
  if (radii.length === 0) return [];
  const inner = radii[0];
  const outer = radii[radii.length - 1];
  return outer - inner > 40 ? [inner, outer + 28] : [inner];
}

/** The interactive graph. Nodes glide between tabs, spring in and out, and the selected branch lights up to the centre. */
export function SkillGraphCanvas({
  layout,
  selected,
  onSelect,
  onToggleGroup,
  onCore,
  gathered = false,
  centerLabel = "YOU",
  groupDepth,
  resetKey,
}: {
  layout: GraphLayout;
  selected: string | null;
  onSelect: (id: string) => void;
  /** Click on a group: fold its skills in, or open them back out. */
  onToggleGroup?: (id: string) => void;
  /** Click on YOU: gather every group in, or bloom them all out. */
  onCore?: () => void;
  gathered?: boolean;
  centerLabel?: string;
  /** Depth drawn as a group hub (1 on Overall/Technical, none on single-domain tabs). */
  groupDepth: 1 | 0;
  /** Changing it resets pan and zoom (e.g. the tab). */
  resetKey?: unknown;
}) {
  const reduce = useReducedMotion();
  // Phones hide skill labels (chips list them instead), so the label padding is cropped away.
  const roomy = useMediaMinWidth(640);
  const viewBox = roomy
    ? `${-PAD} ${-PAD} ${VIEW + PAD * 2} ${VIEW + PAD * 2}`
    : `60 60 ${VIEW - 120} ${VIEW - 120}`;
  const byId = new Map(layout.nodes.map((n) => [n.node.id, n]));
  const sel = selected ? byId.get(selected) : undefined;
  const selGroup = sel ? byId.get(sel.groupId) : undefined;
  // Branch from the selected node up to its group.
  const lit = new Set<string>();
  for (
    let cur = sel;
    cur;
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  )
    lit.add(cur.node.id);

  const svgRef = useRef<SVGSVGElement>(null);
  const pz = usePanZoom(svgRef, { center: CENTER, resetKey });
  const phoneLabels = pz.view.k >= 1.6;

  const radiusOf = (n: LaidNode) => {
    // Group hubs, or (single-area tabs) the area's skills drawn large on the first ring.
    if (n.depth === 1) return firstRingRadius(n.node, groupDepth === 0);
    return 6 + Math.min(n.node.evidence_count, 10) * 0.9;
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="relative block h-auto w-full cursor-grab select-none active:cursor-grabbing"
        style={{ touchAction: "pan-x pan-y" }}
        role="group"
        aria-label="Skill graph. Click an area to fold or open it; click YOU to gather everything. Drag to move, pinch or Ctrl and scroll to zoom."
      >
        <g transform={pz.transform}>
          {/* two orbit rings turning slowly in opposite directions, as on the landing pages */}
          {ringRadii(layout).map((r, i) => (
            <g key={r}>
              {!reduce && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${i ? 360 : 0} ${CENTER} ${CENTER}`}
                  to={`${i ? 0 : 360} ${CENTER} ${CENTER}`}
                  dur={`${i ? 90 : 60}s`}
                  repeatCount="indefinite"
                />
              )}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke="var(--sg-accent)"
                strokeOpacity=".3"
                strokeWidth="1.4"
                strokeDasharray={i ? "1 14" : "2 10"}
                strokeLinecap="round"
              />
              <circle
                cx={CENTER + r}
                cy={CENTER}
                r="4"
                fill="var(--sg-accent)"
                fillOpacity=".5"
              />
            </g>
          ))}
          {/* centre spokes */}
          {layout.nodes
            .filter((n) => n.depth === 1)
            .map((n) => (
              <motion.line
                key={`spoke-${n.node.id}`}
                initial={{
                  x1: CENTER,
                  y1: CENTER,
                  x2: CENTER,
                  y2: CENTER,
                  opacity: 0,
                }}
                animate={{
                  x1: CENTER,
                  y1: CENTER,
                  x2: n.x,
                  y2: n.y,
                  opacity: 1,
                }}
                transition={reduce ? { duration: 0 } : spring}
                stroke={
                  lit.has(n.node.id)
                    ? "var(--sg-line-strong)"
                    : "var(--sg-line)"
                }
                strokeWidth={lit.has(n.node.id) ? 1.6 : 1}
              />
            ))}
          {/* parent → child edges */}
          {layout.nodes
            .filter((n) => n.parentId && byId.has(n.parentId))
            .map((n) => {
              const p = byId.get(n.parentId!)!;
              const on = lit.has(n.node.id);
              const st = STATUS_STYLE[n.node.status] ?? STATUS_STYLE.unassessed;
              const travelling =
                !reduce && !n.hiddenInGroup && selGroup?.node.id === n.groupId;
              return (
                <g key={`edge-${n.node.id}`}>
                  <motion.line
                    initial={{ x1: p.x, y1: p.y, x2: p.x, y2: p.y, opacity: 0 }}
                    animate={{
                      x1: p.x,
                      y1: p.y,
                      x2: n.x,
                      y2: n.y,
                      opacity: n.hiddenInGroup ? 0 : 1,
                    }}
                    transition={reduce ? { duration: 0 } : spring}
                    stroke={on ? st.color : "var(--sg-line)"}
                    strokeWidth={on ? 1.8 : 1}
                    strokeDasharray={on ? st.dash : undefined}
                  />
                  {travelling && (
                    <circle
                      r={on ? 4 : 3}
                      fill={st.color}
                      style={{
                        offsetPath: `path('M${n.x} ${n.y} L${p.x} ${p.y}')`,
                        animation: `mem-travel ${1.8 + (n.angle % 4) * 0.25}s linear infinite both`,
                      }}
                    />
                  )}
                </g>
              );
            })}
          {/* moving dashes from the selected group to the centre */}
          {!reduce && selGroup && (
            <motion.line
              key={`flow-${selGroup.node.id}`}
              x1={selGroup.x}
              y1={selGroup.y}
              x2={CENTER}
              y2={CENTER}
              stroke="var(--sg-accent-soft)"
              strokeWidth="2"
              strokeDasharray="4 10"
              animate={{ strokeDashoffset: [0, -28] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}

          <AnimatePresence>
            {layout.nodes.map((n) => {
              const st = STATUS_STYLE[n.node.status] ?? STATUS_STYLE.unassessed;
              const isGroup = n.depth === groupDepth;
              const r = radiusOf(n);
              const on = selected === n.node.id;
              const score = scoreText(n.node);
              return (
                <motion.g
                  key={n.node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.node.name}, ${st.label}${score ? `, ${score}` : ""}`}
                  aria-pressed={on}
                  className="cursor-pointer outline-none [&:focus-visible>circle:last-of-type]:stroke-[3]"
                  style={{
                    pointerEvents: n.hiddenInGroup ? "none" : undefined,
                  }}
                  aria-expanded={
                    isGroup && n.childCount ? !n.folded : undefined
                  }
                  onMouseEnter={() => onSelect(n.node.id)}
                  onFocus={() => onSelect(n.node.id)}
                  onClick={() => {
                    onSelect(n.node.id);
                    if (isGroup && n.childCount) onToggleGroup?.(n.node.id);
                  }}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === " ") &&
                      isGroup &&
                      n.childCount
                    ) {
                      e.preventDefault();
                      onToggleGroup?.(n.node.id);
                    }
                  }}
                  initial={{ x: CENTER, y: CENTER, opacity: 0, scale: 0.4 }}
                  animate={{
                    x: n.x,
                    y: n.y,
                    opacity: n.hiddenInGroup ? 0 : 1,
                    scale: n.hiddenInGroup ? 0.2 : 1,
                  }}
                  exit={{ x: CENTER, y: CENTER, opacity: 0, scale: 0.4 }}
                  transition={reduce ? { duration: 0 } : spring}
                >
                  <circle r={r + 12} fill="transparent" />
                  {isGroup ? (
                    <>
                      {on && (
                        <circle
                          r={r + 7}
                          fill="none"
                          stroke="var(--sg-accent-soft)"
                          strokeOpacity=".5"
                        />
                      )}
                      <circle
                        r={n.folded ? r + 4 : r}
                        fill="var(--sg-hub-fill)"
                        stroke={st.color}
                        strokeWidth={on ? 2.5 : 1.6}
                        className="transition-all duration-300"
                      />
                      {n.folded ? (
                        <text
                          y={6}
                          textAnchor="middle"
                          fontSize={16}
                          fontWeight={700}
                          fill="var(--sg-accent-soft)"
                          fontFamily="var(--font-geist-mono, ui-monospace)"
                        >
                          +{n.childCount}
                        </text>
                      ) : (
                        <circle r={5} fill="var(--sg-accent)" />
                      )}
                    </>
                  ) : (
                    <>
                      {st.halo && (
                        <circle
                          r={r + 5}
                          fill="none"
                          stroke={st.color}
                          strokeOpacity=".5"
                        />
                      )}
                      <circle
                        r={on ? r + 2 : r}
                        fill={on ? st.color : "var(--sg-canvas)"}
                        stroke={st.color}
                        strokeWidth="2"
                        strokeDasharray={st.dash}
                        opacity={st.faint && !on ? 0.75 : 1}
                      />
                    </>
                  )}
                  <Label
                    n={n}
                    r={r}
                    radial={layout.radialLabels && !isGroup}
                    selected={on}
                    isGroup={isGroup || (groupDepth === 0 && n.depth === 1)}
                    phoneLabels={phoneLabels}
                  />
                </motion.g>
              );
            })}
          </AnimatePresence>

          <motion.g
            role="button"
            tabIndex={0}
            aria-pressed={gathered}
            aria-label={
              gathered ? "Open every area" : "Gather every skill into you"
            }
            className="cursor-pointer outline-none"
            onClick={onCore}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCore?.();
              }
            }}
            animate={{ scale: gathered ? 1.25 : 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 240, damping: 14 }
            }
          >
            <rect
              x={CENTER - 54}
              y={CENTER - 54}
              width="108"
              height="108"
              rx="24"
              fill="var(--sg-accent)"
              fillOpacity=".08"
              stroke="var(--sg-accent)"
              strokeOpacity=".35"
            />
            <rect
              x={CENTER - 42}
              y={CENTER - 42}
              width="84"
              height="84"
              rx="18"
              fill="var(--sg-accent)"
              className="transition-[filter] duration-300 hover:brightness-110"
            />
            <text
              x={CENTER}
              y={CENTER + (gathered ? 0 : 7)}
              textAnchor="middle"
              fill="#fff"
              fontSize="22"
              fontWeight="800"
              className="pointer-events-none"
            >
              {centerLabel}
            </text>
            {gathered && (
              <text
                x={CENTER}
                y={CENTER + 20}
                textAnchor="middle"
                fill="#fff"
                fillOpacity=".8"
                fontSize="11"
                fontFamily="var(--font-geist-mono, ui-monospace)"
                className="pointer-events-none"
              >
                {
                  layout.nodes.filter((n) => n.depth > 1 || groupDepth === 0)
                    .length
                }{" "}
                SKILLS
              </text>
            )}
          </motion.g>
        </g>
      </svg>
      {/* zoom controls */}
      <div
        className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl border p-1 shadow-sm backdrop-blur"
        style={{
          background: "color-mix(in srgb, var(--sg-canvas) 85%, transparent)",
          borderColor: "var(--sg-border)",
        }}
      >
        <ZoomButton
          label="Zoom out"
          onClick={() => pz.zoomBy(1 / 1.35)}
          disabled={pz.view.k <= MIN_ZOOM + 0.001}
        >
          <Minus className="size-4" />
        </ZoomButton>
        <button
          type="button"
          onClick={pz.reset}
          title="Fit graph"
          className="min-w-[3.25rem] rounded-lg px-1.5 py-1 text-center font-[family-name:var(--font-geist-mono)] text-[11.5px] tabular-nums transition-colors hover:bg-[var(--sg-hub-fill)]"
          style={{ color: "var(--sg-text)" }}
        >
          {Math.round(pz.view.k * 100)}%
        </button>
        <ZoomButton
          label="Zoom in"
          onClick={() => pz.zoomBy(1.35)}
          disabled={pz.view.k >= MAX_ZOOM - 0.001}
        >
          <Plus className="size-4" />
        </ZoomButton>
        <ZoomButton
          label="Fit graph"
          onClick={pz.reset}
          disabled={pz.view.k === 1 && pz.view.x === 0 && pz.view.y === 0}
        >
          <Maximize2 className="size-3.5" />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center rounded-lg transition-colors hover:bg-[var(--sg-hub-fill)] disabled:opacity-35"
      style={{ color: "var(--sg-text)" }}
    >
      {children}
    </button>
  );
}
