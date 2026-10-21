"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Which browser UI the user will see (the prompt and the settings differ a lot). */
export type PermissionPlatform = "ios" | "android" | "desktop";
/** "allow": the browser is about to ask. "unblock": access was denied and must be turned back on. */
export type PermissionGuideMode = "allow" | "unblock";
export type CameraMicState = "granted" | "denied" | "prompt" | "unknown";

/** Shown by the interview when getUserMedia is refused; the error screen swaps in the unblock guide. */
export const CAMERA_MIC_DENIED_MESSAGE =
  "Camera and microphone access was denied. Please allow permissions and refresh the page.";

export function detectPermissionPlatform(): PermissionPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch points give it away.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/** Camera + mic permission without prompting (where the browser supports asking). */
export async function queryCameraMicState(): Promise<CameraMicState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown";
  try {
    const states = await Promise.all(
      (["camera", "microphone"] as const).map((name) =>
        navigator.permissions.query({ name: name as PermissionName }).then((s) => s.state),
      ),
    );
    if (states.includes("denied")) return "denied";
    if (states.every((s) => s === "granted")) return "granted";
    return "prompt";
  } catch {
    // Firefox and older Safari don't know "camera"/"microphone" here.
    return "unknown";
  }
}

const STEPS: Record<PermissionGuideMode, Record<PermissionPlatform, string[]>> = {
  allow: {
    android: [
      "A box will pop up at the bottom of your screen.",
      "Tap “Allow while visiting the site”.",
      "If it asks twice (camera, then microphone), allow both.",
    ],
    ios: [
      "A box will pop up in the middle of your screen.",
      "Tap “Allow” (not “Don't Allow”).",
      "If it asks again for the microphone, tap “Allow” again.",
    ],
    desktop: [
      "A box will open under the address bar, at the top left.",
      "Click “Allow while visiting the site”.",
    ],
  },
  unblock: {
    android: [
      "Tap the icon at the left of the address bar.",
      "Turn on Camera and Microphone.",
      "Tap “Reload” (or press Try again below).",
    ],
    ios: [
      "Tap “aA” (or the page icon) at the left of the address bar.",
      "Tap Website Settings and set Camera and Microphone to Allow.",
      "Tap Done, then Try again below.",
    ],
    desktop: [
      "Click the icon at the left of the address bar.",
      "Turn on Camera and Microphone.",
      "Click Reload (or Try again below).",
    ],
  },
};

/** Extra help when the site setting isn't the problem (the whole browser is blocked). */
const SYSTEM_HINT: Record<PermissionPlatform, string> = {
  ios: "Still blocked? Open the iPhone Settings app → Safari (or Chrome) → Camera and Microphone → Allow.",
  android: "Still blocked? Open phone Settings → Apps → Chrome → Permissions → allow Camera and Microphone.",
  desktop: "Still blocked? Check your computer's privacy settings allow this browser to use the camera and microphone.",
};

const MEDIA: Record<PermissionGuideMode, Record<PermissionPlatform, string>> = {
  allow: { android: "allow-android-chrome", ios: "allow-ios-safari", desktop: "allow-desktop-chrome" },
  unblock: { android: "unblock-android-chrome", ios: "unblock-ios-safari", desktop: "unblock-desktop-chrome" },
};

const PLATFORM_LABEL: Record<PermissionPlatform, string> = {
  android: "Android",
  ios: "iPhone / iPad",
  desktop: "Computer",
};

/**
 * Animated "where to tap" guide for the browser's camera/microphone prompt (or for
 * turning access back on once it was blocked), picked for the user's device.
 */
export function PermissionGuide({
  mode,
  className,
  compact = false,
}: Readonly<{ mode: PermissionGuideMode; className?: string; compact?: boolean }>) {
  const [platform, setPlatform] = useState<PermissionPlatform>("desktop");
  useEffect(() => {
    setPlatform(detectPermissionPlatform());
  }, []);
  const shown = platform;
  const media = `/permission-help/${MEDIA[mode][shown]}`;
  const phone = shown !== "desktop";

  return (
    <div className={cn("rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 sm:p-4", className)}>
      <div className={cn("flex gap-3 sm:gap-4", compact ? "items-center" : "flex-col items-center sm:flex-row sm:items-start")}>
        <video
          key={media}
          className={cn(
            "shrink-0 rounded-xl border border-border bg-background object-contain",
            phone ? (compact ? "w-24" : "w-40 sm:w-44") : compact ? "w-36" : "w-full max-w-[17rem] sm:w-60",
          )}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={mode === "allow" ? "Animation: where to tap to allow camera and microphone" : "Animation: how to turn camera and microphone back on"}
        >
          <source src={`${media}.mp4`} type="video/mp4" />
          {/* Very old browsers: the GIF plays everywhere. */}
          <img src={`${media}.gif`} alt="" />
        </video>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">
            {mode === "allow" ? "When your browser asks, allow camera & microphone" : "Turn camera & microphone back on"}
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-5 text-muted-foreground">
            {STEPS[mode][shown].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {mode === "unblock" ? <p className="mt-2 text-xs text-muted-foreground">{SYSTEM_HINT[shown]}</p> : null}
          {!compact ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Not your device?</span>
              {(Object.keys(PLATFORM_LABEL) as PermissionPlatform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 font-medium",
                    p === shown ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                  )}
                >
                  {PLATFORM_LABEL[p]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** One line for the briefing when access is already allowed. */
export function PermissionAllowedNote({ className }: Readonly<{ className?: string }>) {
  return (
    <p className={cn("flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300", className)}>
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
      Camera and microphone are allowed.
    </p>
  );
}
