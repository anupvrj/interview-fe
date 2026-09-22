export type IntegritySettings = {
  telemetryEnabled: boolean;
  clipboardLock: boolean;
  tabBlur: boolean;
  camera: boolean;
  facePresence: boolean;
  faceIdentity: boolean;
  voiceprint: boolean;
  liveSpeech: boolean;
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
  camera: true,
  facePresence: true,
  faceIdentity: true,
  voiceprint: true,
  liveSpeech: true,
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

export function normalizeIntegritySettings(
  raw?: Partial<IntegritySettings> | null,
): IntegritySettings {
  const src = raw ?? {};
  const next = { ...DEFAULT_INTEGRITY_SETTINGS };
  (Object.keys(DEFAULT_INTEGRITY_SETTINGS) as Array<keyof IntegritySettings>).forEach(
    (key) => {
      next[key] = typeof src[key] === "boolean" ? src[key]! : DEFAULT_INTEGRITY_SETTINGS[key];
    },
  );
  return next;
}
