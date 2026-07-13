"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  Briefcase,
  Building2,
  CheckCircle,
  Eye,
  FileText,
  GraduationCap,
  Rocket,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FloatingIcon = {
  Icon: LucideIcon;
  left: string;
  top: string;
  size: string;
  opacity: number;
  floatIndex: number;
  duration: number;
  delay: number;
};

function buildIcons(
  items: Array<{
    Icon: LucideIcon;
    left: string;
    top: string;
    size?: string;
    opacity?: number;
    floatIndex?: number;
    duration?: number;
    delay?: number;
  }>,
): FloatingIcon[] {
  return items.map((item, index) => ({
    Icon: item.Icon,
    left: item.left,
    top: item.top,
    size: item.size ?? "h-10 w-10 sm:h-12 sm:w-12",
    opacity: item.opacity ?? 0.08,
    floatIndex: item.floatIndex ?? index % 3,
    duration: item.duration ?? 6 + (index % 3) * 2,
    delay: item.delay ?? index * 0.5,
  }));
}

const PAGE_ICONS = buildIcons([
  { Icon: User, left: "8%", top: "12%", size: "h-14 w-14 sm:h-16 sm:w-16", opacity: 0.07 },
  { Icon: GraduationCap, left: "82%", top: "18%", floatIndex: 1, delay: 0.6 },
  { Icon: FileText, left: "72%", top: "62%", floatIndex: 2, delay: 1.2 },
  { Icon: Briefcase, left: "14%", top: "68%", floatIndex: 1, delay: 0.9 },
  { Icon: Sparkles, left: "48%", top: "8%", size: "h-8 w-8 sm:h-10 sm:w-10", opacity: 0.06, floatIndex: 2 },
  { Icon: Building2, left: "28%", top: "38%", floatIndex: 0, delay: 1.5 },
  { Icon: Rocket, left: "88%", top: "78%", floatIndex: 2, delay: 0.3 },
  { Icon: Award, left: "6%", top: "42%", floatIndex: 1, delay: 1.8 },
]);

const STEP_ICONS: Record<number, FloatingIcon[]> = {
  1: buildIcons([
    { Icon: User, left: "6%", top: "18%", opacity: 0.1 },
    { Icon: GraduationCap, left: "78%", top: "12%", floatIndex: 1 },
    { Icon: Building2, left: "84%", top: "72%", floatIndex: 2, delay: 0.8 },
    { Icon: Briefcase, left: "12%", top: "76%", floatIndex: 1, delay: 1.1 },
  ]),
  2: buildIcons([
    { Icon: FileText, left: "8%", top: "20%", size: "h-12 w-12 sm:h-14 sm:w-14", opacity: 0.1 },
    { Icon: Upload, left: "80%", top: "16%", floatIndex: 1 },
    { Icon: Briefcase, left: "76%", top: "70%", floatIndex: 2, delay: 0.7 },
    { Icon: Award, left: "14%", top: "68%", floatIndex: 0, delay: 1.2 },
  ]),
  3: buildIcons([
    { Icon: Eye, left: "10%", top: "22%", opacity: 0.1 },
    { Icon: Sparkles, left: "82%", top: "14%", floatIndex: 1 },
    { Icon: Briefcase, left: "78%", top: "74%", floatIndex: 2, delay: 0.6 },
    { Icon: User, left: "16%", top: "70%", floatIndex: 1, delay: 1.0 },
  ]),
  4: buildIcons([
    { Icon: CheckCircle, left: "8%", top: "24%", size: "h-12 w-12 sm:h-14 sm:w-14", opacity: 0.1 },
    { Icon: Rocket, left: "80%", top: "18%", floatIndex: 1 },
    { Icon: Sparkles, left: "74%", top: "72%", floatIndex: 2, delay: 0.5 },
    { Icon: Award, left: "18%", top: "68%", floatIndex: 0, delay: 1.3 },
  ]),
};

function FloatingIconLayer({
  icons,
  className,
  iconClassName = "text-[#7367F0]/40",
}: Readonly<{
  icons: FloatingIcon[];
  className?: string;
  iconClassName?: string;
}>) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {icons.map(
        ({ Icon, left, top, size, opacity, floatIndex, duration, delay }, index) => (
          <div
            key={`${left}-${top}-${index}`}
            className="absolute"
            style={{
              left,
              top,
              opacity,
              animation: `float-${floatIndex} ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            <Icon className={cn(size, iconClassName)} />
          </div>
        ),
      )}
    </div>
  );
}

export function OnboardingPageGraphics() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(115,103,240,0.12),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.08),transparent_38%),radial-gradient(circle_at_50%_90%,rgba(115,103,240,0.06),transparent_45%)]" />
      <FloatingIconLayer icons={PAGE_ICONS} />
      <div
        className="absolute -left-20 top-1/4 h-56 w-56 rounded-full bg-[#7367F0]/10 blur-3xl"
        style={{ animation: "float-1 12s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-16 bottom-1/4 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl"
        style={{ animation: "float-2 14s ease-in-out infinite 1s" }}
      />
    </div>
  );
}

export function OnboardingCardGraphics({
  step,
}: Readonly<{ step: number }>) {
  const icons = STEP_ICONS[step] ?? STEP_ICONS[1];

  return (
    <>
      <FloatingIconLayer icons={icons} iconClassName="text-[#7367F0]/35" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#7367F0]/15 blur-2xl"
        style={{ animation: "float-0 10s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-1/4 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl"
        style={{ animation: "float-2 11s ease-in-out infinite 0.5s" }}
      />
    </>
  );
}

export function OnboardingPathHeroGraphic() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative mx-auto mb-8 hidden h-28 w-full max-w-md sm:block md:h-32"
    >
      <FloatingIconLayer
        icons={buildIcons([
          {
            Icon: User,
            left: "8%",
            top: "30%",
            size: "h-14 w-14",
            opacity: 0.12,
          },
          {
            Icon: GraduationCap,
            left: "78%",
            top: "18%",
            size: "h-12 w-12",
            opacity: 0.1,
            floatIndex: 1,
          },
          {
            Icon: Briefcase,
            left: "72%",
            top: "62%",
            size: "h-11 w-11",
            opacity: 0.09,
            floatIndex: 2,
            delay: 0.8,
          },
        ])}
      />
      <div
        className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-[#7367F0]/20 bg-[#7367F0]/10 shadow-[0_8px_32px_rgba(115,103,240,0.18)]"
        style={{ animation: "float-1 5s ease-in-out infinite" }}
      >
        <Sparkles className="h-9 w-9 text-[#7367F0]" />
      </div>
    </div>
  );
}
