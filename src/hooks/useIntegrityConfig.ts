import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/lib/api";
import {
  DEFAULT_INTEGRITY_SETTINGS,
  moduleEnabled,
  type IntegritySettings,
} from "@/lib/integrity/settings";

export const INTEGRITY_CONFIG_QUERY_KEY = ["integrity-config"] as const;

export function useIntegrityConfig() {
  const query = useQuery({
    queryKey: INTEGRITY_CONFIG_QUERY_KEY,
    queryFn: configApi.getIntegritySettings,
    staleTime: 15_000,
  });
  const settings: IntegritySettings = query.data ?? DEFAULT_INTEGRITY_SETTINGS;
  const live = Boolean(settings.telemetryEnabled);

  return {
    settings,
    isLoading: query.isLoading,
    live,
    clipboardLock: moduleEnabled(settings, "clipboardLock"),
    tabBlur: moduleEnabled(settings, "tabBlur"),
    facePresence: moduleEnabled(settings, "facePresence"),
    voiceprint: moduleEnabled(settings, "voiceprint"),
    turnLatency: moduleEnabled(settings, "turnLatency"),
    showReportToCandidate: settings.showReportToCandidate,
    showReportToReviewers: settings.showReportToReviewers,
  };
}
