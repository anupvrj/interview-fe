"use client";

import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/lib/api";
import { INTERVIEW_CATEGORIES_QUERY_KEY, type InterviewCategoryCatalog } from "@/lib/interviewCategories";

const OFF: InterviewCategoryCatalog = { enabled: false, categories: [] };

/** Category rounds for the picker; treated as off if the endpoint is unavailable. */
export function useInterviewCategoriesQuery() {
  return useQuery({
    queryKey: INTERVIEW_CATEGORIES_QUERY_KEY,
    queryFn: () => configApi.getInterviewCategories().catch(() => OFF),
    staleTime: 60_000,
  });
}
