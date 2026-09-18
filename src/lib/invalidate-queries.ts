import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getQueryClient } from "@/lib/query-client";

export function getCachedUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("clerk-user-id");
}

export function invalidateAfterAiInterviewSession(
  queryClient: QueryClient,
  userId: string,
) {
  return Promise.all([
    invalidateInterviews(queryClient, userId),
    invalidateEntitlements(queryClient, userId),
  ]);
}

export function invalidateAfterCodingSessionComplete(
  queryClient: QueryClient,
  userId: string,
) {
  return Promise.all([
    invalidateCodingInterviews(queryClient, userId),
    invalidateInterviews(queryClient, userId),
    invalidateEntitlements(queryClient, userId),
  ]);
}

export function invalidateAfterSystemDesignSession(
  queryClient: QueryClient,
  userId: string,
) {
  return Promise.all([
    invalidateSystemDesignSessions(queryClient, userId),
    invalidateEntitlements(queryClient, userId),
  ]);
}

export async function invalidateAfterAiInterviewSessionFromStorage() {
  const userId = getCachedUserId();
  if (!userId) return;
  await invalidateAfterAiInterviewSession(getQueryClient(), userId);
}

export async function invalidateAfterCodingSessionCompleteFromStorage() {
  const userId = getCachedUserId();
  if (!userId) return;
  await invalidateAfterCodingSessionComplete(getQueryClient(), userId);
}

export async function invalidateAfterSystemDesignSessionFromStorage() {
  const userId = getCachedUserId();
  if (!userId) return;
  await invalidateAfterSystemDesignSession(getQueryClient(), userId);
}

export function invalidateEntitlements(queryClient: QueryClient, userId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.entitlements(userId),
  });
}

export function invalidateInterviews(queryClient: QueryClient, userId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.interviews(userId),
  });
}

export function invalidateInterviewSchedules(
  queryClient: QueryClient,
  userId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.interviewSchedules(userId),
  });
}

export function invalidateResumes(queryClient: QueryClient, userId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.resumes(userId),
  });
}

export function invalidateCodingInterviews(
  queryClient: QueryClient,
  userId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.codingInterviews(userId),
  });
}

export function invalidateSystemDesignSessions(
  queryClient: QueryClient,
  userId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.systemDesignSessions(userId),
  });
}

export function invalidatePeerBookings(queryClient: QueryClient, userId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.peerBookings(userId),
  });
}

export function invalidateProfile(queryClient: QueryClient, userId: string) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.profile(userId),
  });
}

export function invalidateDashboardLists(
  queryClient: QueryClient,
  userId: string,
) {
  return Promise.all([
    invalidateInterviews(queryClient, userId),
    invalidateInterviewSchedules(queryClient, userId),
    invalidateResumes(queryClient, userId),
    invalidateCodingInterviews(queryClient, userId),
    invalidateSystemDesignSessions(queryClient, userId),
    invalidatePeerBookings(queryClient, userId),
    invalidateEntitlements(queryClient, userId),
    invalidateProfile(queryClient, userId),
  ]);
}
