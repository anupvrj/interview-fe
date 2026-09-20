export type IntegritySettings = {
  telemetryEnabled: boolean;
  clipboardLock: boolean;
  tabBlur: boolean;
  facePresence: boolean;
  voiceprint: boolean;
  turnLatency: boolean;
  socraticPushback: boolean;
  antiCopilotPrompts: boolean;
  showReportToCandidate: boolean;
  showReportToReviewers: boolean;
};

export const DEFAULT_INTEGRITY_SETTINGS: IntegritySettings = {
  telemetryEnabled: true,
  clipboardLock: true,
  tabBlur: true,
  facePresence: true,
  voiceprint: true,
  turnLatency: true,
  socraticPushback: true,
  antiCopilotPrompts: true,
  showReportToCandidate: true,
  showReportToReviewers: true,
};

export function moduleEnabled(
  settings: IntegritySettings,
  key: Exclude<keyof IntegritySettings, "telemetryEnabled">,
): boolean {
  return settings.telemetryEnabled && settings[key];
}
