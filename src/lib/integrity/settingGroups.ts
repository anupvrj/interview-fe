import type { IntegritySettings } from "@/lib/integrity/settings";

export type IntegritySettingGroup = {
  title: string;
  description: string;
  keys: Array<{
    key: keyof IntegritySettings;
    label: string;
    help: string;
    requiresMaster?: boolean;
  }>;
};

export const INTEGRITY_SETTING_GROUPS: IntegritySettingGroup[] = [
  {
    title: "Master switch",
    description:
      "Turns collection on or off for coding, AI voice, and system design. Existing reports stay in the database.",
    keys: [
      {
        key: "telemetryEnabled",
        label: "Integrity telemetry",
        help: "When off, no new clipboard, tab, face, voice, or latency events are stored.",
      },
    ],
  },
  {
    title: "Detection modules",
    description: "Each check can be turned off independently while telemetry stays on.",
    keys: [
      {
        key: "clipboardLock",
        label: "Clipboard lock",
        help: "Block external paste in the coding editor and flag burst keystroke injection.",
        requiresMaster: true,
      },
      {
        key: "tabBlur",
        label: "Tab / window blur",
        help: "Flag when the candidate leaves the interview tab for more than a few seconds.",
        requiresMaster: true,
      },
      {
        key: "camera",
        label: "Camera",
        help: "Flag when the camera track drops or the face detector cannot start.",
        requiresMaster: true,
      },
      {
        key: "facePresence",
        label: "Face presence",
        help: "Flag a missing candidate or a second face that stays in frame.",
        requiresMaster: true,
      },
      {
        key: "faceIdentity",
        label: "Face identity",
        help: "Match silent camera snapshots against the stored biometric credential.",
        requiresMaster: true,
      },
      {
        key: "voiceprint",
        label: "Voiceprint",
        help: "Match speaking-turn audio against the enrollment voiceprint.",
        requiresMaster: true,
      },
      {
        key: "liveSpeech",
        label: "Live speech",
        help: "Flag speech on the mic while the mouth is still. Needs camera plus microphone.",
        requiresMaster: true,
      },
      {
        key: "turnLatency",
        label: "Turn latency",
        help: "Flag unusually long delays between interviewer finish and candidate speech.",
        requiresMaster: true,
      },
    ],
  },
  {
    title: "Interviewer behavior",
    description: "How the AI interviewer reacts during a live session.",
    keys: [
      {
        key: "socraticPushback",
        label: "Socratic pushback",
        help: "Ask a short clarifying question when live integrity signals fire.",
        requiresMaster: true,
      },
      {
        key: "antiCopilotPrompts",
        label: "Anti-copilot prompts",
        help: "Tell the interviewer to probe for original reasoning instead of recited answers.",
        requiresMaster: true,
      },
    ],
  },
  {
    title: "Report visibility",
    description:
      "Integrity is never mixed into skill scores. These toggles only control who can see the card.",
    keys: [
      {
        key: "showReportToCandidate",
        label: "Show to candidates",
        help: "Candidates see the integrity card on their interview and system-design reports.",
      },
      {
        key: "showReportToReviewers",
        label: "Show to reviewers",
        help: "Recruiters and institution admins see the integrity card. Super Admin always can.",
      },
    ],
  },
];
