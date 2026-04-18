"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Interview, interviewApi, userApi } from "@/lib/api";
import {
  getPeerInterviewUnlockStatus,
  PEER_INTERVIEW_UNLOCK_MIN_AVG_SCORE,
  PEER_INTERVIEW_UNLOCK_MIN_COUNT,
} from "@/lib/peer-interviews";
import { cn, getScoreColor } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle,
  Loader2,
  Lock,
  PlayCircle,
  Sparkles,
} from "lucide-react";

/** Frosted glass: blur + saturation read as “real” glass in WebKit/Blink */
const glassBackdrop = {
  backdropFilter: "blur(22px) saturate(180%)",
  WebkitBackdropFilter: "blur(22px) saturate(180%)",
} as const;

/** Cancel `DashboardLayout` main padding (`p-3 sm:p-4 lg:p-8`) so the route background is edge-to-edge */
const dashboardContentBleed =
  "-mx-3 -mt-3 -mb-3 sm:-mx-4 sm:-mt-4 sm:-mb-4 lg:-mx-8 lg:-mt-8 lg:-mb-8";

/** Fill the viewport below dashboard chrome (header + padding fudge) */
const dashboardRouteMinH =
  "min-h-[calc(100dvh-6.5rem)] sm:min-h-[calc(100dvh-6rem)] lg:min-h-[calc(100dvh-5.5rem)]";

export default function PeerInterviewsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    (async () => {
      try {
        const profile = await userApi.getMyProfile();
        if (
          profile.accessRole === "institution_admin" &&
          profile.institutionId
        ) {
          router.replace(
            `/dashboard/institute/${String(profile.institutionId)}`,
          );
          return;
        }
        const list = await interviewApi.list(user.id);
        setInterviews(list);
      } catch {
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, user, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[rgb(37,99,235)]" />
          <p className="text-gray-600">Loading peer interviews…</p>
        </div>
      </div>
    );
  }

  const unlock = getPeerInterviewUnlockStatus(interviews);
  const progressScores = unlock.last10Scores.slice(
    0,
    PEER_INTERVIEW_UNLOCK_MIN_COUNT,
  );
  const slotFillPercent =
    (progressScores.length / PEER_INTERVIEW_UNLOCK_MIN_COUNT) * 100;

  if (unlock.unlocked) {
    return (
      <div
        className={`relative flex ${dashboardRouteMinH} flex-col overflow-hidden ${dashboardContentBleed}`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-200/50 via-blue-100/40 to-indigo-200/45"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <article
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.72] bg-gradient-to-br from-white/[0.42] via-white/[0.22] to-white/[0.12] p-8 shadow-[0_8px_32px_rgba(37,99,235,0.14),0_32px_64px_-24px_rgba(99,102,241,0.12)] ring-1 ring-white/30 sm:p-10 lg:p-12"
            style={glassBackdrop}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
              aria-hidden
            />
            <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/30 sm:h-16 sm:w-16">
              <CheckCircle className="h-7 w-7 text-white sm:h-8 sm:w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Peer-to-peer unlocked
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              Your last {PEER_INTERVIEW_UNLOCK_MIN_COUNT} interviews average{" "}
              <span className="font-semibold text-emerald-700">
                {unlock.averageLast10}%
              </span>
              . Matching will appear here when live.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="flex-1">
                <Button
                  variant="outline"
                  className="h-14 min-h-[3.5rem] w-full border border-white/50 bg-white/20 text-base font-semibold text-[rgb(37,99,235)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] hover:bg-white/35 sm:text-lg"
                  style={glassBackdrop}
                >
                  Back to dashboard
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex ${dashboardRouteMinH} flex-col overflow-hidden ${dashboardContentBleed}`}
    >
      {/* Backdrop so glass reads clearly */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-300/65 via-violet-200/50 to-blue-200/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-16 h-[28rem] w-[28rem] rounded-full bg-blue-500/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-28 bottom-12 h-96 w-96 rounded-full bg-fuchsia-400/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/4 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-cyan-300/35 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-stretch gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-8 lg:py-12 xl:gap-12">
        {/* Left: main glass content */}
        <article
          className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/[0.72] bg-gradient-to-br from-white/[0.38] via-white/[0.2] to-white/[0.08] p-6 shadow-[0_8px_32px_rgba(37,99,235,0.12),0_32px_64px_-20px_rgba(79,70,229,0.14)] ring-1 ring-inset ring-white/25 sm:p-8 lg:max-w-[64%] lg:p-10 xl:max-w-[62%]"
          style={glassBackdrop}
        >
          <div
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90 sm:inset-x-6 lg:inset-x-8"
            aria-hidden
          />
          <header className="relative flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-md shadow-blue-500/25 ring-1 ring-white/50 sm:h-12 sm:w-12">
              <Sparkles
                className="h-5 w-5 text-white sm:h-6 sm:w-6"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">
                Your progress toward unlock
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:text-base">
                Unlock peer-to-peer interviews by scoring{" "}
                {PEER_INTERVIEW_UNLOCK_MIN_AVG_SCORE}% on average in your last{" "}
                {PEER_INTERVIEW_UNLOCK_MIN_COUNT} completed interviews.
              </p>
            </div>
          </header>

          {/* Score row */}
          <section className="relative mt-6">
            <p className="mb-3 text-sm font-semibold text-slate-800 sm:text-base">
              Last {PEER_INTERVIEW_UNLOCK_MIN_COUNT} scores (newest first)
            </p>
            <div
              className="flex flex-wrap gap-2 sm:gap-2.5"
              role="list"
              aria-label="Recent interview scores"
            >
              {Array.from({ length: PEER_INTERVIEW_UNLOCK_MIN_COUNT }).map(
                (_, i) => {
                  const s = progressScores[i];
                  return (
                    <div
                      key={i}
                      role="listitem"
                      className={cn(
                        "flex h-10 min-w-[2.75rem] items-center justify-center rounded-lg border text-sm font-bold tabular-nums shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45)] sm:h-11 sm:min-w-[3rem] sm:text-base",
                        s != null
                          ? cn(
                              "border-white/55 bg-white/18 backdrop-blur-[8px]",
                              getScoreColor(s),
                            )
                          : "border-dashed border-white/45 bg-white/[0.08] text-slate-500/90 backdrop-blur-[6px]",
                      )}
                      style={
                        s != null
                          ? {
                              backdropFilter: "blur(8px) saturate(160%)",
                              WebkitBackdropFilter: "blur(8px) saturate(160%)",
                            }
                          : {
                              backdropFilter: "blur(6px) saturate(150%)",
                              WebkitBackdropFilter: "blur(6px) saturate(150%)",
                            }
                      }
                    >
                      {s != null ? s : "—"}
                    </div>
                  );
                },
              )}
            </div>
          </section>

          {/* Inner glass progress panel */}
          <section
            className="relative mt-6 overflow-hidden rounded-xl border border-white/50 bg-gradient-to-br from-white/[0.22] to-white/[0.06] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"
            style={{
              backdropFilter: "blur(14px) saturate(170%)",
              WebkitBackdropFilter: "blur(14px) saturate(170%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/50"
              aria-hidden
            />
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base">
              <span className="font-semibold text-slate-800">
                Overall progress
              </span>
              <span className="text-slate-600">
                {progressScores.length} of {PEER_INTERVIEW_UNLOCK_MIN_COUNT}{" "}
                slots filled
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/35 ring-1 ring-white/40 sm:h-3.5">
              <div
                className="h-full rounded-full bg-[rgb(37,99,235)] shadow-sm transition-[width] duration-500 ease-out"
                style={{ width: `${slotFillPercent}%` }}
              />
            </div>
            {unlock.scoredCompletedCount < PEER_INTERVIEW_UNLOCK_MIN_COUNT ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                You have{" "}
                <strong className="font-semibold text-slate-800">
                  {unlock.scoredCompletedCount}
                </strong>{" "}
                completed interview
                {unlock.scoredCompletedCount === 1 ? "" : "s"} with scores.
                Finish more mock interviews to fill the window.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Your rolling average is{" "}
                <strong
                  className={cn(
                    "font-semibold",
                    getScoreColor(unlock.averageLast10 ?? 0),
                  )}
                >
                  {unlock.averageLast10}%
                </strong>
                . Reach{" "}
                <strong className="font-semibold text-slate-800">
                  {PEER_INTERVIEW_UNLOCK_MIN_AVG_SCORE}%
                </strong>{" "}
                average to unlock.
              </p>
            )}
          </section>

          {/* Actions */}
          <div className="relative mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
            <Link href="/dashboard/interviews/new" className="flex-1">
              <Button
                size="lg"
                className="h-12 min-h-[3rem] w-full rounded-xl !bg-[rgb(37,99,235)] px-5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:!bg-[rgb(17,24,39)] hover:shadow-lg sm:text-base"
              >
                <PlayCircle className="mr-2 h-5 w-5 shrink-0" />
                Start a mock interview
                <ArrowRight className="ml-2 h-4 w-4 shrink-0 opacity-90" />
              </Button>
            </Link>
            <Link href="/dashboard/interviews" className="flex-1">
              <Button
                size="lg"
                variant="outline"
                className="h-12 min-h-[3rem] w-full rounded-xl border border-white/60 bg-white/15 px-5 text-sm font-semibold text-[rgb(37,99,235)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] hover:bg-white/28 sm:text-base"
                style={glassBackdrop}
              >
                View interview history
              </Button>
            </Link>
          </div>
        </article>

        {/* Right: large lock — full side, no square frame */}
        <aside className="relative flex min-h-[280px] flex-1 flex-col items-center justify-center px-4 py-6 lg:min-h-0 lg:max-w-[36%] lg:items-center lg:justify-center lg:px-5 xl:px-6">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(100%,28rem)] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-400/25 via-indigo-400/20 to-violet-400/25 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col items-center text-center lg:items-center">
            <Lock
              className="h-36 w-36 text-slate-700/85 drop-shadow-[0_4px_24px_rgba(37,99,235,0.15)] sm:h-44 sm:w-44 lg:h-52 lg:w-52 xl:h-60 xl:w-60"
              strokeWidth={1.35}
              aria-hidden
            />
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-slate-500 sm:text-sm">
              Locked
            </p>
            <p className="mt-3 max-w-sm text-xl font-bold leading-snug text-slate-900 sm:text-2xl lg:text-3xl">
              Peer-to-peer interviews
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600 sm:text-base">
              Meet the score requirements in the panel to unlock this feature.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
