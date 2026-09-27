import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/lib/api";
import {
  normalizeIntegritySettings,
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
  const settings: IntegritySettings = normalizeIntegritySettings(query.data);
  const live = Boolean(settings.telemetryEnabled);

  return {
    settings,
    isLoading: query.isLoading,
    live,
    clipboardLock: moduleEnabled(settings, "clipboardLock"),
    tabBlur: moduleEnabled(settings, "tabBlur"),
    camera: moduleEnabled(settings, "camera"),
    facePresence: moduleEnabled(settings, "facePresence"),
    faceIdentity: moduleEnabled(settings, "faceIdentity"),
    voiceprint: moduleEnabled(settings, "voiceprint"),
    liveSpeech: moduleEnabled(settings, "liveSpeech"),
    turnLatency: moduleEnabled(settings, "turnLatency"),
    showReportToCandidate: settings.showReportToCandidate,
    showReportToReviewers: settings.showReportToReviewers,
  };
}
