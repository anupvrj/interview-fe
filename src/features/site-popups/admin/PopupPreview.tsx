"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { HackathonSlugProvider, useHackathonPublic } from "@/features/hackathon/hooks";
import { istInputToIso } from "@/features/hackathon/admin/time";
import { PopupView } from "../PopupView";
import { formToPreview, type PopupForm } from "./presets";

const FRAMES = {
  desktop: { w: 1280, h: 760 },
  mobile: { w: 390, h: 760 },
} as const;

/** Scaled, live preview of the popup on a mock page. */
export function PopupPreview({ form }: Readonly<{ form: PopupForm }>) {
  const slug = form.targeting.hackathonSlug;
  return slug ? (
    <HackathonSlugProvider slug={slug}>
      <PreviewWithHackathon form={form} />
    </HackathonSlugProvider>
  ) : (
    <PreviewFrame form={form} hackathon={null} />
  );
}

function PreviewWithHackathon({ form }: Readonly<{ form: PopupForm }>) {
  const pub = useHackathonPublic();
  return <PreviewFrame form={form} hackathon={pub.data ?? null} />;
}

function PreviewFrame({
  form,
  hackathon,
}: Readonly<{ form: PopupForm; hackathon: { phase: string; startsAt: string | null; endsAt: string | null; serverNow: string } | null }>) {
  const [device, setDevice] = useState<keyof typeof FRAMES>("desktop");
  const [replay, setReplay] = useState(0);
  const [full, setFull] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const frame = FRAMES[device];

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / frame.w));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frame.w]);

  const { target, label } = useMemo(() => {
    const mode = form.countdown.mode;
    const fallback = new Date(Date.now() + 2 * 86_400_000 + 5 * 3_600_000).toISOString();
    if (mode === "none") return { target: null, label: "" };
    if (mode === "custom") return { target: istInputToIso(form.countdown.target) ?? fallback, label: form.content.countdownLabel || "Ends in" };
    const upcoming = hackathon ? hackathon.phase === "upcoming" : true;
    const toStart = mode === "hackathon_start" || (mode === "hackathon_auto" && upcoming);
    const real = hackathon ? (toStart ? hackathon.startsAt : hackathon.endsAt) : null;
    const live = real && new Date(real).getTime() > Date.now() ? real : fallback;
    return { target: live, label: form.content.countdownLabel || (toStart ? "Hackathon starts in" : "Submissions close in") };
  }, [form.countdown.mode, form.countdown.target, form.content.countdownLabel, hackathon]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["desktop", "mobile"] as const).map((key) => {
            const Icon = key === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  device === key ? "bg-[#7367F0] text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {key === "desktop" ? "Desktop" : "Mobile"}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setReplay((n) => n + 1)} className="text-xs font-medium text-[#7367F0] hover:underline">
            Replay
          </button>
          <button type="button" onClick={() => setFull(true)} className="text-xs font-medium text-[#7367F0] hover:underline">
            Full-size preview
          </button>
        </div>
      </div>

      <div ref={boxRef} className={cn("mx-auto w-full", device === "mobile" && "max-w-[300px]")}>
        <div
          className="relative overflow-hidden rounded-xl border border-border bg-[#e9edf5]"
          style={{ height: frame.h * scale }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: frame.w, height: frame.h, transform: `scale(${scale})` }}
          >
            <MockPage mobile={device === "mobile"} />
            <PopupView
              key={`${replay}-${form.design}-${device}`}
              popup={formToPreview(form)}
              countdownTarget={form.show.countdown ? target : null}
              countdownLabel={label}
              contained
              onClose={() => setReplay((n) => n + 1)}
              onCta={() => setReplay((n) => n + 1)}
            />
          </div>
        </div>
      </div>
      {full ? (
        <PopupView
          popup={formToPreview(form)}
          countdownTarget={form.show.countdown ? target : null}
          countdownLabel={label}
          onClose={() => setFull(false)}
          onCta={() => setFull(false)}
        />
      ) : null}
    </div>
  );
}

/** Neutral placeholder page so the popup reads in context. */
function MockPage({ mobile }: Readonly<{ mobile: boolean }>) {
  return (
    <div className="absolute inset-0 bg-[#f4f6fb]">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="h-5 w-32 rounded bg-slate-300" />
        {!mobile ? (
          <div className="flex gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-3 w-16 rounded bg-slate-200" />
            ))}
          </div>
        ) : null}
        <div className="h-8 w-24 rounded-lg bg-[#7367F0]/30" />
      </div>
      <div className={cn("grid gap-6 p-8", mobile ? "grid-cols-1" : "grid-cols-3")}>
        <div className={cn("space-y-3", mobile ? "" : "col-span-2")}>
          <div className="h-8 w-3/4 rounded bg-slate-300" />
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
          <div className="mt-6 h-40 rounded-xl bg-slate-200" />
        </div>
        <div className="space-y-3">
          <div className="h-28 rounded-xl bg-slate-200" />
          <div className="h-28 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
