import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/lib/api";
import type { PublicInterviewerCatalog } from "@/lib/aiInterviewers";

export const AI_INTERVIEWERS_QUERY_KEY = ["ai-interviewers"] as const;

export function useAiInterviewers() {
  const query = useQuery({
    queryKey: AI_INTERVIEWERS_QUERY_KEY,
    queryFn: configApi.getAiInterviewers,
    staleTime: 15_000,
  });
  const catalog: PublicInterviewerCatalog | null = query.data ?? null;
  return {
    catalog,
    isLoading: query.isLoading,
  };
}
