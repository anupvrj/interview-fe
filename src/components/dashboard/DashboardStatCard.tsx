import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  dashboardHeroStatPalette,
  dashboardStatAccents,
  dashboardInsightThemes,
  type DashboardStatThemeKey,
} from "@/lib/dashboard-stat-themes";

function HeroStatCardShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative min-h-0 min-w-0 overflow-hidden rounded-xl",
        dashboardHeroStatPalette.shell,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(115,103,240,0.08),transparent_50%)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function HeroStatFooter({ progress }: { progress: number }) {
  const width = Math.min(100, Math.max(0, progress));
  return (
    <div
      className={cn(
        "mt-2.5 h-1.5 overflow-hidden rounded-full",
        dashboardHeroStatPalette.progressTrack,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          dashboardHeroStatPalette.progressFill,
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function DashboardStatCard({
  theme,
  label,
  value,
  hint,
  icon: Icon,
  progress,
}: {
  theme: DashboardStatThemeKey;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  progress?: number;
}) {
  const accent = dashboardStatAccents[theme];

  return (
    <HeroStatCardShell>
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                accent,
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "mt-0.5 text-lg font-bold tabular-nums sm:text-xl",
                dashboardHeroStatPalette.value,
              )}
            >
              {value}
            </p>
            {hint ? (
              <div
                className={cn(
                  "mt-1.5 flex flex-wrap items-center gap-1 text-[11px] font-medium sm:text-xs",
                  dashboardHeroStatPalette.hint,
                )}
              >
                {hint}
              </div>
            ) : null}
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              dashboardHeroStatPalette.iconShell,
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        </div>
        {progress != null ? <HeroStatFooter progress={progress} /> : null}
      </div>
    </HeroStatCardShell>
  );
}

export function DashboardSectionIcon({
  theme,
  icon: Icon,
}: {
  theme: DashboardStatThemeKey;
  icon: LucideIcon;
}) {
  const palette = dashboardInsightThemes[theme];
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        palette.icon,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function DashboardInsightTile({
  theme,
  label,
  value,
  description,
}: {
  theme: DashboardStatThemeKey;
  label: string;
  value: ReactNode;
  description?: string;
}) {
  const palette = dashboardInsightThemes[theme];

  return (
    <div className={cn("rounded-xl border p-3", palette.card)}>
      <p className={cn("text-xs font-semibold", palette.label)}>{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
