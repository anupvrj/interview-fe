"use client";

import { createContext, createElement, useContext, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hackathonApi, type HackathonMe } from "./api";
import { HACKATHON_SLUG, isHackathonEnabled } from "./config";

const HackathonSlugContext = createContext<string>(HACKATHON_SLUG);

export function HackathonSlugProvider({ slug, children }: { slug: string; children: ReactNode }) {
  return createElement(HackathonSlugContext.Provider, { value: slug }, children);
}

export function useHackathonSlug(): string {
  return useContext(HackathonSlugContext);
}

export const hackathonKeys = {
  published: ["hackathon", "published"] as const,
  public: (slug: string) => ["hackathon", slug, "public"] as const,
  me: (slug: string) => ["hackathon", slug, "me"] as const,
  resumes: (slug: string) => ["hackathon", slug, "resumes"] as const,
  adminList: ["admin", "hackathons"] as const,
  adminOne: (id: string) => ["admin", "hackathons", id] as const,
};

export function usePublishedHackathons() {
  return useQuery({
    queryKey: hackathonKeys.published,
    queryFn: () => hackathonApi.listPublished(),
    enabled: isHackathonEnabled(),
    retry: false,
    refetchInterval: (query) => {
      const rows = query.state.data ?? [];
      return rows.some((row) => row.phase === "upcoming" || row.phase === "live") ? 60_000 : false;
    },
  });
}

function pollInterval(data: HackathonMe | undefined): number | false {
  if (!data) return false;
  const slots = [
    ...(data.progress.interviews.slots ?? []),
    ...(data.progress.challenges ?? []).flatMap((c) => c.slots ?? []),
  ];
  if (slots.some((s) => s.state === "processing")) return 5_000;
  if (slots.some((s) => s.state === "in_progress")) return 15_000;
  if (data.hackathon.phase === "upcoming") {
    if (data.hackathon.startsAt) {
      const msToStart = new Date(data.hackathon.startsAt).getTime() - Date.now();
      if (msToStart > 0 && msToStart < 10 * 60_000) return 15_000;
    }
    return 30_000;
  }
  return 60_000;
}

export function useHackathonPublic(slug?: string) {
  const scoped = useHackathonSlug();
  const resolved = slug ?? scoped;
  return useQuery({
    queryKey: hackathonKeys.public(resolved),
    queryFn: () => hackathonApi.getPublic(resolved),
    enabled: isHackathonEnabled() && Boolean(resolved),
    refetchInterval: (query) => {
      const phase = query.state.data?.phase;
      return phase === "upcoming" || phase === "live" ? 30_000 : false;
    },
    retry: false,
  });
}

export function useHackathonMe(slug?: string, options?: { enabled?: boolean }) {
  const scoped = useHackathonSlug();
  const resolved = slug ?? scoped;
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryEnabled =
    (options?.enabled ?? true) && isLoaded && Boolean(isSignedIn) && Boolean(resolved);
  const query = useQuery({
    queryKey: hackathonKeys.me(resolved),
    queryFn: () => hackathonApi.me(resolved, () => getToken()),
    enabled: queryEnabled,
    refetchInterval: (query) => pollInterval(query.state.data),
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) return failureCount < 1;
      return status !== undefined && status >= 500 && failureCount < 2;
    },
  });
  // RQ v5: a disabled query is isPending but not isLoading, so pages must not treat
  // "no data yet" as an error while Clerk is hydrating or the first /me is in flight.
  const waitingForMe =
    queryEnabled &&
    (!isLoaded || Boolean(isSignedIn && (query.isPending || (query.isFetching && !query.data))));
  return { ...query, waitingForMe };
}

export function useEligibleResumes(enabled: boolean) {
  const slug = useHackathonSlug();
  const { getToken } = useAuth();
  return useQuery({
    queryKey: hackathonKeys.resumes(slug),
    queryFn: () => hackathonApi.listResumes(slug, () => getToken()),
    enabled,
    refetchOnWindowFocus: true,
  });
}

function useMeMutation<TArgs>(
  fn: (slug: string, getToken: () => Promise<string | null>, args: TArgs) => Promise<HackathonMe>,
) {
  const slug = useHackathonSlug();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => fn(slug, () => getToken(), args),
    onSuccess: (data) => queryClient.setQueryData(hackathonKeys.me(slug), data),
    onError: () => void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) }),
  });
}

export function useRegisterForHackathon() {
  return useMeMutation<string | undefined>((slug, getToken, source) =>
    hackathonApi.register(slug, getToken, source),
  );
}

export function useSubmitHackathonResume() {
  return useMeMutation<string>((slug, getToken, resumeId) =>
    hackathonApi.submitResume(slug, getToken, resumeId),
  );
}

export function useSubmitHackathonSocial() {
  return useMeMutation<{ linkedinUrl: string; instagramUrl: string }>((slug, getToken, body) =>
    hackathonApi.submitSocial(slug, getToken, body),
  );
}

export function useCompleteHackathon() {
  return useMeMutation<void>((slug, getToken) => hackathonApi.complete(slug, getToken));
}

export function useStartHackathonInterview() {
  const slug = useHackathonSlug();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slot,
      language,
      challengeId,
      targetRole,
      targetCompany,
    }: {
      slot: number;
      language: "en" | "hi";
      challengeId?: string;
      targetRole?: string;
      targetCompany?: string;
    }) =>
      challengeId
        ? hackathonApi.startChallenge(slug, () => getToken(), challengeId, slot, language, {
            targetRole,
            targetCompany,
          })
        : hackathonApi.startInterview(slug, () => getToken(), slot, language, { targetRole, targetCompany }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: hackathonKeys.me(slug) }),
  });
}

export function useOpenSubmittedResume() {
  const slug = useHackathonSlug();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: () => hackathonApi.resumeUrl(slug, () => getToken()),
  });
}
