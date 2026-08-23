"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { StackedFeatureSectionHeading } from "@/components/marketing/StackedFeatureSectionHeading";

const TRACK_EXTRA_VH = 40;
const TRACK_STEP_VH = 120;

export interface StackedFeatureStepProps {
  id: string;
  className?: string;
  stepTitle: string;
  children: ReactNode;
}

export function StackedFeatureStep(_props: StackedFeatureStepProps) {
  return null;
}

StackedFeatureStep.displayName = "StackedFeatureStep";

interface ParsedStep {
  id: string;
  className?: string;
  stepTitle: string;
  children: ReactNode;
}

interface StackedFeatureScrollProps {
  heading: string;
  children: ReactNode;
}

function parseSteps(children: ReactNode): ParsedStep[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child) => child as ReactElement<StackedFeatureStepProps>)
    .filter((child) => child.type === StackedFeatureStep)
    .map((child) => ({
      id: child.props.id,
      className: child.props.className,
      stepTitle: child.props.stepTitle,
      children: child.props.children,
    }));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTrackHeightVh(stepCount: number) {
  return stepCount * TRACK_STEP_VH + TRACK_EXTRA_VH;
}

function getAnchorTopPercent(index: number, stepCount: number) {
  if (stepCount <= 1) return 0;
  const trackHeightVh = getTrackHeightVh(stepCount);
  const scrollableFraction = Math.max(trackHeightVh - 100, 0) / trackHeightVh;
  const ratio = index / (stepCount - 1);
  return ratio * scrollableFraction * 100;
}

function getPanelStyle(index: number, progress: number): CSSProperties {
  const dist = progress - index;

  if (dist < -0.35) {
    return {
      opacity: 0,
      transform: "translateY(105%) scale(0.94)",
      pointerEvents: "none",
    };
  }

  if (dist < 0) {
    const enter = (dist + 0.35) / 0.35;
    return {
      opacity: enter,
      transform: `translateY(${(1 - enter) * 40}%) scale(${0.94 + enter * 0.06})`,
      pointerEvents: enter > 0.2 ? "auto" : "none",
    };
  }

  if (dist < 0.75) {
    return {
      opacity: 1,
      transform: "translateY(0) scale(1)",
      pointerEvents: "auto",
    };
  }

  if (dist < 1) {
    const peel = (dist - 0.75) / 0.25;
    return {
      opacity: 1 - peel * 0.85,
      transform: `translateY(${-peel * 14}%) scale(${1 - peel * 0.07})`,
      pointerEvents: peel > 0.6 ? "none" : "auto",
    };
  }

  return {
    opacity: 0,
    transform: "translateY(-18%) scale(0.9)",
    pointerEvents: "none",
  };
}

const TABLET_LAYOUT_MAX_WIDTH = 1024;
const TOUCH_TABLET_LAYOUT_MAX_WIDTH = 1366;

function shouldUseSimpleStackedLayout(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }

  if (
    window.matchMedia(`(max-width: ${TABLET_LAYOUT_MAX_WIDTH}px)`).matches
  ) {
    return true;
  }

  if (
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia(`(max-width: ${TOUCH_TABLET_LAYOUT_MAX_WIDTH}px)`).matches
  ) {
    return true;
  }

  return false;
}

function SimpleStackedFeatureLayout({
  heading,
  steps,
}: {
  heading: string;
  steps: ParsedStep[];
}) {
  return (
    <section
      id="get-hired-week"
      aria-labelledby="get-hired-week-heading"
      className="border-t border-border"
    >
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <StackedFeatureSectionHeading title={heading} variant="static" />
        <div className="stacked-feature-simple-list mt-10 space-y-6 sm:mt-12 sm:space-y-8">
          {steps.map((step) => (
            <article
              key={step.id}
              id={step.id}
              className={cn("scroll-mt-24", step.className)}
            >
              {step.children}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StackedFeatureScroll({
  heading,
  children,
}: StackedFeatureScrollProps) {
  const steps = parseSteps(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef(steps);
  const initialHashHandledRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [useSimpleLayout, setUseSimpleLayout] = useState(() =>
    shouldUseSimpleStackedLayout(),
  );

  stepsRef.current = steps;

  const activeIndex = clamp(Math.round(progress), 0, Math.max(steps.length - 1, 0));
  const trackHeightVh = getTrackHeightVh(steps.length);

  const getTrackMetrics = useCallback(() => {
    const track = trackRef.current;
    if (!track) return null;

    const rect = track.getBoundingClientRect();
    const scrollable = Math.max(track.offsetHeight - window.innerHeight, 0);
    const scrolled = clamp(-rect.top, 0, scrollable);

    return { track, rect, scrollable, scrolled };
  }, []);

  const scrollToStepIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;
      const currentSteps = stepsRef.current;
      if (!track || index < 0 || index >= currentSteps.length) return;

      const scrollable = Math.max(track.offsetHeight - window.innerHeight, 0);
      const ratio = currentSteps.length <= 1 ? 0 : index / (currentSteps.length - 1);
      const top = track.offsetTop + ratio * scrollable;

      window.scrollTo({ top, behavior });

      const stepId = currentSteps[index]?.id;
      if (stepId && window.location.hash !== `#${stepId}`) {
        history.replaceState(null, "", `#${stepId}`);
      }
    },
    [],
  );

  const scrollToStepId = useCallback(
    (id: string, behavior: ScrollBehavior = "smooth") => {
      const index = stepsRef.current.findIndex((step) => step.id === id);
      if (index !== -1) scrollToStepIndex(index, behavior);
    },
    [scrollToStepIndex],
  );

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tabletMedia = window.matchMedia(
      `(max-width: ${TABLET_LAYOUT_MAX_WIDTH}px)`,
    );
    const touchTabletMedia = window.matchMedia(
      `(pointer: coarse) and (max-width: ${TOUCH_TABLET_LAYOUT_MAX_WIDTH}px)`,
    );

    const updateLayout = () => {
      setUseSimpleLayout(shouldUseSimpleStackedLayout());
    };

    updateLayout();
    motionMedia.addEventListener("change", updateLayout);
    tabletMedia.addEventListener("change", updateLayout);
    touchTabletMedia.addEventListener("change", updateLayout);
    window.addEventListener("resize", updateLayout);

    return () => {
      motionMedia.removeEventListener("change", updateLayout);
      tabletMedia.removeEventListener("change", updateLayout);
      touchTabletMedia.removeEventListener("change", updateLayout);
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    return () => {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "auto";
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (steps.length === 0 || initialHashHandledRef.current) return;

    const id = window.location.hash.replace("#", "");
    if (!id || !steps.some((step) => step.id === id)) return;

    initialHashHandledRef.current = true;

    requestAnimationFrame(() => {
      if (useSimpleLayout) {
        document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }

      scrollToStepId(id, "auto");
    });
  }, [scrollToStepId, steps, useSimpleLayout]);

  useEffect(() => {
    if (useSimpleLayout || steps.length === 0) return;

    const handleHashChange = () => {
      const id = window.location.hash.replace("#", "");
      if (id) scrollToStepId(id, "smooth");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [scrollToStepId, steps.length, useSimpleLayout]);

  useEffect(() => {
    if (useSimpleLayout || steps.length === 0) return;

    const stepIds = new Set(steps.map((step) => step.id));

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest("a[href^='#']");
      if (!link) return;

      const id = link.getAttribute("href")?.slice(1);
      if (!id || !stepIds.has(id)) return;

      event.preventDefault();
      scrollToStepId(id, "smooth");
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [scrollToStepId, steps, useSimpleLayout]);

  useEffect(() => {
    if (useSimpleLayout || steps.length === 0) return;

    const updateProgress = () => {
      const metrics = getTrackMetrics();
      if (!metrics) return;

      const { scrollable, scrolled } = metrics;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }

      const normalized = scrolled / scrollable;
      setProgress(normalized * Math.max(steps.length - 1, 1));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [getTrackMetrics, steps.length, useSimpleLayout]);

  if (steps.length === 0) return null;

  if (useSimpleLayout) {
    return <SimpleStackedFeatureLayout heading={heading} steps={steps} />;
  }

  return (
    <section
      id="get-hired-week"
      aria-labelledby="get-hired-week-heading"
      className="relative border-t border-border"
    >
      <nav aria-label="Interview preparation steps" className="sr-only">
        <ol>
          {steps.map((step) => (
            <li key={step.id}>
              <a href={`#${step.id}`}>{step.stepTitle}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div
        ref={trackRef}
        className="stacked-feature-track"
        style={{ height: `${trackHeightVh}vh` }}
      >
        {steps.map((step, index) => (
          <span
            key={`${step.id}-anchor`}
            id={step.id}
            className="stacked-feature-scroll-anchor"
            style={{ top: `${getAnchorTopPercent(index, steps.length)}%` }}
            aria-hidden="true"
          />
        ))}

        <div className="stacked-feature-sticky">
          <StackedFeatureSectionHeading title={heading} />

          <aside
            className="stacked-feature-progress"
            role="tablist"
            aria-label="Feature progress"
          >
            <div className="stacked-feature-progress-track" aria-hidden="true" />
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={step.stepTitle}
                onClick={() => scrollToStepIndex(index, "smooth")}
                className={cn(
                  "stacked-feature-progress-dot",
                  index === activeIndex && "is-active",
                )}
              />
            ))}
          </aside>

          <div className="stacked-feature-stage">
            {steps.map((step, index) => {
              const style = getPanelStyle(index, progress);

              return (
                <article
                  key={step.id}
                  aria-labelledby={`${step.id}-heading`}
                  className={cn("stacked-feature-panel", step.className)}
                  style={{
                    zIndex: index + 1,
                    ...style,
                  }}
                >
                  <div className="stacked-feature-panel-inner">{step.children}</div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

StackedFeatureScroll.Step = StackedFeatureStep;
