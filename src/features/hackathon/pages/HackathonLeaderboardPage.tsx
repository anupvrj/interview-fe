"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Medal, Search, Trophy } from "lucide-react";
import { useLoadingTimeout } from "@/lib/stuck-loading";
import { consumePostSignInReturnUrl, peekPostSignInReturnUrl } from "@/lib/post-sign-in-redirect";
import { cn } from "@/lib/utils";
import { toHackathonError } from "../api";
import { HACKATHON_LEADERBOARD_PAGE_SIZE, hackathonLandingPath } from "../config";
import { formatIst } from "../copy";
import { HackathonFeatureGate } from "../components/HackathonFeatureGate";
import { HackathonPageLoader } from "../components/HackathonPageLoader";
import { HackathonShell } from "../components/HackathonShell";
import { PhaseNotice } from "../components/PhaseNotice";
import { hkSecondaryButton } from "../components/ResumeChallenge";
import { useHackathonLeaderboard, useHackathonSlug } from "../hooks";
import { formatLeaderboardScore, maskLeaderboardEmail } from "../leaderboard";
import { useNoMotion } from "../useNoMotion";

const RANK_TONE = [
  "text-[#ffc44d]",
  "text-[#d5deea]",
  "text-[#e0a36a]",
] as const;

function LeaderboardContent() {
  const slug = useHackathonSlug();
  const landingPath = hackathonLandingPath(slug);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useHackathonLeaderboard(page, submittedSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => setSubmittedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const pending = peekPostSignInReturnUrl();
    if (pending?.startsWith(landingPath) || pending?.startsWith(`/hackathon/${slug}`)) consumePostSignInReturnUrl();
  }, [landingPath, slug]);

  const board = query.data;
  const entries = board?.entries ?? [];
  const pageSize = board?.pageSize || HACKATHON_LEADERBOARD_PAGE_SIZE;
  const total = board?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [focusYou, setFocusYou] = useState(false);
  useEffect(() => {
    if (!focusYou) return;
    const row = document.getElementById("hk-leaderboard-you");
    if (!row) return;
    row.scrollIntoView({ block: "center" });
    setFocusYou(false);
  }, [focusYou, entries, page]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const loading = query.isPending;
  useLoadingTimeout(loading, "hackathon leaderboard");
  if (loading) return <HackathonPageLoader message="Loading the leaderboard…" />;

  if (query.isError || !board) {
    const err = toHackathonError(query.error, "We couldn't load the leaderboard.");
    return (
      <PhaseNotice icon={AlertCircle} tone="rose" title="Something went wrong" message={err.message}>
        <button type="button" className={cn(hkSecondaryButton, "mt-6")} onClick={() => void query.refetch()}>
          Try again
        </button>
      </PhaseNotice>
    );
  }

  if (!board.published) {
    return (
      <PhaseNotice
        icon={Trophy}
        tone="amber"
        title="Leaderboard opens with the results"
        message={
          board.revealsAt
            ? `Scores are published on ${formatIst(board.revealsAt)}.`
            : "Scores will show here once results are published."
        }
      />
    );
  }

  const you = board.you;

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl">LeaderBoard</h1>
        <p className="max-w-3xl text-sm leading-6 text-[#9eb2ca] sm:text-[15px]">
          Avg Score = 30% resume ATS + 70% mock interview. A challenge that was not submitted counts as 0. Higher score ranks first, and if two scores tie, whoever submitted first ranks higher.
        </p>
      </header>

      {you ? (
        <section className="rounded-2xl border border-[#2a7fd4]/70 bg-gradient-to-r from-[#0d2d58] to-[#0a1b36] px-5 py-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6fc0ff]">Your score</p>
          <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-3">
            <p className="text-white">
              <span className="block text-xs text-[#9eb2ca]">Rank</span>
              <span className="text-3xl font-extrabold tabular-nums">#{you.rank}</span>
            </p>
            <ScoreStat label="Avg Score" value={you.avgScore} />
            <ScoreStat label="Resume Score" value={you.resumeScore} />
            <ScoreStat label="Mock AI Interview" value={you.interviewScore} />
            {you.interviewSubmittedAt ? (
              <p className="text-white">
                <span className="block text-xs text-[#9eb2ca]">Submitted</span>
                <span className="text-sm font-semibold">{formatIst(you.interviewSubmittedAt)}</span>
              </p>
            ) : null}
            <button
              type="button"
              className={cn(hkSecondaryButton, "min-h-10 px-4 text-sm")}
              onClick={() => {
                setSearch("");
                setSubmittedSearch("");
                setPage(Math.floor((you.rank - 1) / pageSize) + 1);
                setFocusYou(true);
              }}
            >
              Show my row
            </button>
          </div>
        </section>
      ) : null}

      <div className="relative">
        <label htmlFor="hk-leaderboard-search" className="sr-only">
          Search by name or email
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7189a6]" aria-hidden />
        <input
          id="hk-leaderboard-search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email"
          className="h-12 w-full rounded-xl border border-[#27547d] bg-[#071426] pl-10 pr-3.5 text-[15px] text-white placeholder:text-[#7189a6] focus:border-[#2a7fd4] focus:outline-none focus:ring-2 focus:ring-[#1677ff]/40"
        />
      </div>
      <div className={cn("overflow-hidden rounded-2xl border border-[#1b3c62] bg-[#071426]/70", query.isFetching && "opacity-80")}>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
          <caption className="sr-only">Hackathon leaderboard</caption>
          <thead className="bg-[#0b1d35] text-xs font-bold uppercase tracking-[0.12em] text-[#9eb2ca]">
            <tr>
              <th scope="col" className="px-4 py-3">Rank</th>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Email</th>
              <th scope="col" className="px-4 py-3 text-right">Avg Score</th>
              <th scope="col" className="px-4 py-3 text-right">Resume Score</th>
              <th scope="col" className="px-4 py-3 text-right">Mock AI Interview</th>
              <th scope="col" className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#9eb2ca]">
                  {submittedSearch ? "No participant matches that search." : "No scores have been saved for this leaderboard yet."}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={`${entry.rank}-${entry.email}`}
                  id={entry.isYou ? "hk-leaderboard-you" : undefined}
                  className={cn(
                    "border-t border-[#1b3c62]/80",
                    entry.isYou ? "bg-[#12325f]" : "hover:bg-white/[0.03]",
                  )}
                >
                  <th scope="row" className={cn("px-4 py-3 font-extrabold tabular-nums", RANK_TONE[entry.rank - 1] ?? "text-white")}>
                    <span className="inline-flex items-center gap-1.5">
                      {entry.rank <= 3 ? <Medal className="size-4" aria-hidden /> : null}
                      {entry.rank}
                      {entry.isYou ? (
                        <span className="rounded-full bg-[#1677ff] px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-white">
                          You
                        </span>
                      ) : null}
                    </span>
                  </th>
                  <td className="px-4 py-3 font-semibold text-white">{entry.name}</td>
                  <td className="px-4 py-3 text-[#cfdbe8]">{maskLeaderboardEmail(entry.email)}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-white">{formatLeaderboardScore(entry.avgScore)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#cfdbe8]">{formatLeaderboardScore(entry.resumeScore)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#cfdbe8]">{formatLeaderboardScore(entry.interviewScore)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#cfdbe8]">{formatIst(entry.interviewSubmittedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        {total > pageSize ? (
          <div className="flex flex-col gap-3 border-t border-[#1b3c62] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#9eb2ca]">
              Showing {(board.page - 1) * pageSize + 1} to {Math.min(board.page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(hkSecondaryButton, "min-h-10 px-3 text-sm")}
                onClick={() => setPage(board.page - 1)}
                disabled={board.page <= 1 || query.isFetching}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </button>
              <span className="px-2 text-sm tabular-nums text-[#9eb2ca]">
                {board.page} / {totalPages}
              </span>
              <button
                type="button"
                className={cn(hkSecondaryButton, "min-h-10 px-3 text-sm")}
                onClick={() => setPage(board.page + 1)}
                disabled={board.page >= totalPages || query.isFetching}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScoreStat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <p className="text-white">
      <span className="block text-xs text-[#9eb2ca]">{label}</span>
      <span className="text-2xl font-extrabold tabular-nums">{formatLeaderboardScore(value)}</span>
    </p>
  );
}

export function HackathonLeaderboardPage() {
  useNoMotion();
  return (
    <HackathonFeatureGate backHref="/" backLabel="Back to home">
      <HackathonShell>
        <LeaderboardContent />
      </HackathonShell>
    </HackathonFeatureGate>
  );
}
