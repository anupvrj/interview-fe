"use client";

import { Coins, Clock3, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { appCard } from "@/lib/app-theme";
import type { VoiceModelUsageRow } from "@/lib/super-admin-insights";

const MODEL_BAR: Record<VoiceModelUsageRow["provider"], string> = {
  gemini: "bg-[#7367F0]",
  chatgpt: "bg-[#28C76F]",
  sarvam: "bg-[#00CFE8]",
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: Readonly<{
  icon: typeof Mic2;
  label: string;
  value: string;
  hint?: string;
}>) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7367F0]">
        <Icon className="h-3 w-3 shrink-0" />
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums leading-none text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function VoiceModelUsagePanel({
  name,
  row,
  mix,
}: Readonly<{
  name: string;
  row: VoiceModelUsageRow;
  mix: VoiceModelUsageRow[];
}>) {
  const avgCredits =
    row.sessions > 0 ? Math.round(row.credits / row.sessions) : 0;
  const segments = mix.filter((item) => item.sessions > 0);

  return (
    <section className={cn(appCard, "space-y-4 p-5")}>
      <div>
        <h3 className="text-base font-semibold text-foreground">{name}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Interviews, credits, and share versus other voice models
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          icon={Mic2}
          label="Used"
          value={formatCount(row.sessions)}
          hint={`${row.sessionShare}% of voice interviews`}
        />
        <Stat
          icon={Coins}
          label="Credits"
          value={formatCount(row.credits)}
          hint={`${row.creditShare}% of voice credits`}
        />
        <Stat
          icon={Clock3}
          label="Minutes"
          value={formatCount(row.minutes)}
          hint={`${formatCount(row.thisMonth)} this month`}
        />
        <Stat
          icon={Coins}
          label="Avg / session"
          value={formatCount(avgCredits)}
          hint={`${formatCount(row.completed)} completed`}
        />
      </div>
      <div>
        <p className="mb-1.5 text-[11px] text-muted-foreground">
          Share of interviews vs other models
        </p>
        {segments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No interviews yet.</p>
        ) : (
          <div className="flex h-2 overflow-hidden rounded-full bg-[#7367F0]/12">
            {segments.map((item) => (
              <div
                key={item.provider}
                className={cn(
                  MODEL_BAR[item.provider],
                  item.provider === row.provider ? "opacity-100" : "opacity-35",
                )}
                style={{ width: `${Math.max(item.sessionShare, 0)}%` }}
                title={`${item.provider}: ${item.sessionShare}%`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
