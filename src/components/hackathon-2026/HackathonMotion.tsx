"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Flags `data-inview` once the element scrolls into view (never resets on scroll away). */
export function useInView<T extends Element>(threshold = 0.15) {
  const [inView, setInView] = useState(false);
  const revealedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      if (revealedRef.current) {
        setInView(true);
        return;
      }

      if (prefersReducedMotion()) {
        revealedRef.current = true;
        setInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          revealedRef.current = true;
          setInView(true);
          observer.disconnect();
          observerRef.current = null;
        },
        { threshold, rootMargin: "0px 0px -60px 0px" },
      );
      observerRef.current = observer;
      observer.observe(node);
    },
    [threshold],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, inView: revealedRef.current || inView };
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
  from?: "up" | "left" | "right" | "scale" | "none";
  style?: CSSProperties;
  /** Above-the-fold: CSS keyframe on first paint, no JS/observer wait (keeps LCP fast). */
  immediate?: boolean;
};

const FROM: Record<NonNullable<RevealProps["from"]>, CSSProperties> = {
  up: {},
  left: { "--hk-rx": "-32px", "--hk-ry": "0px" } as CSSProperties,
  right: { "--hk-rx": "32px", "--hk-ry": "0px" } as CSSProperties,
  scale: { "--hk-ry": "12px", "--hk-rs": "0.96" } as CSSProperties,
  none: { "--hk-ry": "0px" } as CSSProperties,
};

export function Reveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
  from = "up",
  style,
  immediate = false,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag
      ref={immediate ? undefined : ref}
      data-inview={immediate ? undefined : inView ? "true" : undefined}
      className={cn(immediate ? "hk-enter" : "hk-reveal", className)}
      style={{ ...FROM[from], "--hk-delay": `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Pointer handler that feeds the `.hk-card` cursor spotlight. */
export function trackSpotlight(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

/** Eases a number from 0 → target once visible. */
export function useCountUp(target: number, run: boolean, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // rAF timestamps can precede `start`, so clamp to avoid negative progress
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      setValue(Math.round(target * (1 - Math.pow(1 - t, 4))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run, duration]);

  return value;
}

export type CountdownState =
  | { phase: "pending" }
  | { phase: "upcoming"; days: number; hours: number; minutes: number; seconds: number }
  | { phase: "live" }
  | { phase: "ended" };

/** Ticks every second; starts as "pending" so SSR and first client render match. */
export function useCountdown(startISO: string, endISO: string): CountdownState {
  const [state, setState] = useState<CountdownState>({ phase: "pending" });

  useEffect(() => {
    const start = Date.parse(startISO);
    const end = Date.parse(endISO);
    const update = () => {
      const now = Date.now();
      if (now >= end) return setState({ phase: "ended" });
      if (now >= start) return setState({ phase: "live" });
      let s = Math.floor((start - now) / 1000);
      const days = Math.floor(s / 86400);
      s -= days * 86400;
      const hours = Math.floor(s / 3600);
      s -= hours * 3600;
      const minutes = Math.floor(s / 60);
      setState({ phase: "upcoming", days, hours, minutes, seconds: s - minutes * 60 });
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [startISO, endISO]);

  return state;
}

/** Subtle pointer parallax: writes --px/--py (-1…1) on the element. Desktop pointers only. */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    const onMove = (event: globalThis.PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        node.style.setProperty("--px", Math.max(-1, Math.min(1, x)).toFixed(3));
        node.style.setProperty("--py", Math.max(-1, Math.min(1, y)).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return ref;
}

/** Layer offset for useParallax. depth ≈ max px travel. */
export function parallax(depth: number): CSSProperties {
  return {
    translate: `calc(var(--px, 0) * ${depth}px) calc(var(--py, 0) * ${depth}px)`,
    transition: "translate 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
  };
}

/** Layered, slowly moving light ribbons used as section backdrops. */
export function Waves({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      className={cn("hk-wave pointer-events-none absolute", flip && "-scale-x-100", className)}
    >
      <defs>
        <linearGradient id="hk-wave-a" x1="0" x2="1">
          <stop offset="0" stopColor="#1677ff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#1677ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2bd2ff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="hk-wave-b" x1="0" x2="1">
          <stop offset="0" stopColor="#2bd2ff" stopOpacity="0" />
          <stop offset="0.6" stopColor="#2bd2ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1677ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 210 C 240 120 420 300 720 210 S 1200 110 1440 190 L1440 320 L0 320 Z"
        fill="url(#hk-wave-a)"
        opacity="0.35"
      />
      <path
        d="M0 240 C 300 170 520 290 820 230 S 1260 170 1440 240"
        fill="none"
        stroke="url(#hk-wave-b)"
        strokeWidth="2"
      />
      <path
        d="M0 265 C 280 215 560 305 860 255 S 1280 205 1440 262"
        fill="none"
        stroke="url(#hk-wave-a)"
        strokeWidth="1.2"
        opacity="0.8"
      />
    </svg>
  );
}

/** Smooth-scrolls to an in-page section (honours scroll-margin-top) and syncs the URL hash. */
export function scrollToSection(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return false;
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
  window.history.replaceState(null, "", hash);
  return true;
}

type SectionLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: `#${string}`;
};

/** In-page anchor that glides to its section instead of jumping. */
export function SectionLink({ href, onClick, ...props }: SectionLinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
        if (scrollToSection(href)) event.preventDefault();
      }}
      {...props}
    />
  );
}

/** Glossy 3D-style light ribbon used at section edges (matches the campaign key visual). */
export function Ribbon({
  className,
  variant = "a",
  slow = false,
}: {
  className?: string;
  variant?: "a" | "b";
  slow?: boolean;
}) {
  const id = `hk-rb-${variant}`;
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 600"
      preserveAspectRatio="none"
      className={cn(
        "hk-ribbon",
        // Feather the path ends so a ribbon never shows a hard cut edge
        variant === "a"
          ? "[mask-image:linear-gradient(90deg,transparent,#000_18%,#000_78%,transparent)]"
          : "[mask-image:radial-gradient(ellipse_70%_70%_at_55%_50%,#000_55%,transparent_95%)]",
        slow && "hk-ribbon-slow",
        className,
      )}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a2f8f" stopOpacity="0.2" />
          <stop offset="0.45" stopColor="#1463ff" stopOpacity="0.85" />
          <stop offset="0.75" stopColor="#1f8bff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0a2a78" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={`${id}-deep`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b3cb0" stopOpacity="0.7" />
          <stop offset="1" stopColor="#06163f" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" x2="1">
          <stop offset="0" stopColor="#9fd8ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#bfe6ff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#9fd8ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {variant === "a" ? (
        <>
          <path d="M0 360 C 140 250 300 470 600 300 L 600 430 C 330 590 150 390 0 500 Z" fill={`url(#${id}-deep)`} />
          <path d="M0 300 C 160 180 320 420 600 230 L 600 330 C 330 500 170 280 0 400 Z" fill={`url(#${id}-fill)`} />
          <path d="M0 300 C 160 180 320 420 600 230" fill="none" stroke={`url(#${id}-edge)`} strokeWidth="2.5" />
        </>
      ) : (
        <>
          <path d="M600 120 C 470 220 380 60 180 200 C 90 260 40 380 0 600 L 120 600 C 150 420 220 320 320 270 C 450 200 520 300 600 240 Z" fill={`url(#${id}-fill)`} />
          <path d="M600 240 C 520 300 450 200 320 270 C 220 320 150 420 120 600 L 260 600 C 280 470 350 390 450 350 C 520 322 570 360 600 340 Z" fill={`url(#${id}-deep)`} />
          <path d="M600 120 C 470 220 380 60 180 200 C 90 260 40 380 0 600" fill="none" stroke={`url(#${id}-edge)`} strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
}
