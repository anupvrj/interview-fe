"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient, type Mutation, type Query } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { HK_EVENTS, trackHackathon } from "@/features/hackathon/analytics";
import { STUCK_AFTER_META, STUCK_AFTER_MS, stuckLoadingLabels } from "@/lib/stuck-loading";

const CHECK_EVERY_MS = 2_000;
/** Time to read the message before we move them on. */
const REDIRECT_AFTER_MS = 4_000;

const limitOf = (meta: Record<string, unknown> | undefined) =>
  typeof meta?.[STUCK_AFTER_META] === "number" ? (meta[STUCK_AFTER_META] as number) : STUCK_AFTER_MS;

/**
 * If anything keeps loading past the limit (a page loader, or an API request), say so
 * and move the user on: their dashboard when signed in, otherwise the homepage.
 */
export function StuckLoadingWatchdog({ watchRequests = true }: Readonly<{ watchRequests?: boolean }>) {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const fetchStarted = useRef(new WeakMap<Query, number>());
  const href = isSignedIn ? "/dashboard" : "/";

  useEffect(() => {
    if (open) return;
    const check = () => {
      const now = Date.now();
      const stuck = stuckLoadingLabels(now);
      if (watchRequests) {
        for (const query of queryClient.getQueryCache().getAll()) {
          // Only a page still waiting for its first data, not a background refresh.
          const waiting =
            query.state.fetchStatus === "fetching" && query.state.data === undefined && query.getObserversCount() > 0;
          if (!waiting) {
            fetchStarted.current.delete(query);
            continue;
          }
          const started = fetchStarted.current.get(query) ?? now;
          fetchStarted.current.set(query, started);
          if (now - started >= limitOf(query.meta)) stuck.push(`request ${JSON.stringify(query.queryKey)}`);
        }
        for (const mutation of queryClient.getMutationCache().getAll() as Mutation[]) {
          const { status, submittedAt } = mutation.state;
          if (status === "pending" && submittedAt && now - submittedAt >= limitOf(mutation.meta)) stuck.push("action");
        }
      }
      if (!stuck.length) return;
      console.warn("[stuck-loading] still loading after the limit:", stuck);
      trackHackathon(HK_EVENTS.stuckLoading, { path: window.location.pathname, stuck: stuck.slice(0, 5).join(" | ") });
      setOpen(true);
    };
    const id = window.setInterval(check, CHECK_EVERY_MS);
    return () => window.clearInterval(id);
  }, [open, queryClient, watchRequests]);

  // A full page load, so a frozen app can't keep them stuck.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => window.location.assign(href), REDIRECT_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [open, href]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Something isn&apos;t right</AlertDialogTitle>
          <AlertDialogDescription>
            This is taking too long. Taking you to {isSignedIn ? "your dashboard" : "the homepage"}…
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button className="w-full" onClick={() => window.location.assign(href)}>
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
