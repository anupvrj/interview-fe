"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateCodingInterviews,
  invalidateEntitlements,
  invalidateInterviews,
  invalidateInterviewSchedules,
  invalidateInterviewSetup,
  invalidatePeerBookings,
  invalidateProfile,
  invalidateResumes,
  invalidateSystemDesignSessions,
} from "@/lib/invalidate-queries";

export function useDashboardInvalidation() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const invalidate = useCallback(
    async (
      scopes: Array<
        | "entitlements"
        | "interviews"
        | "interviewSchedules"
        | "resumes"
        | "codingInterviews"
        | "systemDesignSessions"
        | "peerBookings"
        | "profile"
        | "interviewSetup"
      >,
    ) => {
      if (!userId) return;
      await Promise.all(
        scopes.map((scope) => {
          switch (scope) {
            case "entitlements":
              return invalidateEntitlements(queryClient, userId);
            case "interviews":
              return invalidateInterviews(queryClient, userId);
            case "interviewSchedules":
              return invalidateInterviewSchedules(queryClient, userId);
            case "resumes":
              return invalidateResumes(queryClient, userId);
            case "codingInterviews":
              return invalidateCodingInterviews(queryClient, userId);
            case "systemDesignSessions":
              return invalidateSystemDesignSessions(queryClient, userId);
            case "peerBookings":
              return invalidatePeerBookings(queryClient, userId);
            case "profile":
              return invalidateProfile(queryClient, userId);
            case "interviewSetup":
              return invalidateInterviewSetup(queryClient, userId);
            default:
              return Promise.resolve();
          }
        }),
      );
    },
    [queryClient, userId],
  );

  return { invalidate, userId };
}
