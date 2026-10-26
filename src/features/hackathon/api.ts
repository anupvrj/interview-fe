import { apiClient } from "@/lib/api";
import { HACKATHON_TARGETS } from "./config";

export type HackathonPhase = "upcoming" | "live" | "ended";
export type StepState =
  | "locked"
  | "available"
  | "in_progress"
  | "processing"
  | "awaiting_decision"
  | "completed";
export type LockReason =
  | "not_started"
  | "ended"
  | "full"
  | "profile_incomplete"
  | "previous_step"
  | "attempt_limit"
  | "below_pass_mark"
  | "inactive_entry";
export type ParticipantStatus =
  | "registered"
  | "in_progress"
  | "completed"
  | "disqualified"
  | "withdrawn"
  | "suspended";
export type SocialReviewStatus = "none" | "pending" | "approved" | "rejected";
export type HackathonChallengeKind = "resume" | "screening" | "coding" | "system_design" | "social";

export interface HackathonChallenge {
  challengeId?: string;
  kind?: HackathonChallengeKind;
  key?: "resume_submission" | "mock_interviews" | "social_share";
  order: number;
  title: string;
  description: string;
  config?: {
    minScore?: number | null;
    requiredCount?: number;
    durationMinutes?: 15 | 30;
    maxAttemptsPerSlot?: number;
    voiceProvider?: string;
    codingProblemIds?: string[];
    systemDesignProblemId?: string;
    requiredPlatforms?: Array<"linkedin" | "instagram">;
  };
}

export interface HackathonPublic {
  hackathonId: string;
  slug: string;
  title: string;
  visibility?: "draft" | "published";
  phase: HackathonPhase;
  startsAt: string | null;
  endsAt: string | null;
  submissionsDueAt?: string | null;
  isFull: boolean;
  spotsLeft: number | null;
  maxCompletions: number | null;
  landing?: { tagline: string; description: string; registerCta: string };
  targets?: { atsScore: number; interviewScore: number };
  socialRequired?: boolean;
  challenges: HackathonChallenge[];
  interviewConfig: { requiredCount: number; durationMinutes: number; maxAttemptsPerSlot: number };
  serverNow: string;
  registrationOpen?: boolean;
}

export interface InterviewSlotProgress {
  slot: number;
  state: StepState;
  lockReason?: LockReason;
  interviewId?: string;
  sessionId?: string;
  activeInterviewId?: string;
  overallScore?: number;
  attemptsUsed: number;
  attemptsMax: number;
  lastFailureReason?: string;
  passed?: boolean;
  minScore?: number | null;
  /** Waiting for Re-attempt / Submit: why (the score itself is never sent before results). */
  decisionReason?: "low_score" | "short_interview";
  canReattempt?: boolean;
}

export interface ChallengeProgress {
  challengeId: string;
  kind: HackathonChallengeKind;
  state: StepState;
  lockReason?: LockReason;
  passed: boolean;
  minScore: number | null;
  score?: number | null;
  slots?: InterviewSlotProgress[];
  resubmitMessage?: string | null;
}

export type AdminResetInfo = { at: string; note: string | null; generation?: number };

export interface HackathonProgress {
  challenges?: ChallengeProgress[];
  resume: { state: StepState; lockReason?: LockReason; resubmitMessage?: string | null };
  interviews: {
    state: StepState;
    lockReason?: LockReason;
    slots: InterviewSlotProgress[];
    resubmitMessage?: string | null;
  };
  social: { state: StepState; lockReason?: LockReason; resubmitMessage?: string | null };
  challengesCompleted: number;
  requiredChallengeCount?: number;
  canComplete: boolean;
  completed: boolean;
}

export interface HackathonMe {
  hackathon: HackathonPublic;
  registered: boolean;
  participant: {
    participantId: string;
    status: ParticipantStatus;
    registeredAt: string;
    completedAt: string | null;
    remindersOptOut?: boolean;
    /** Frozen by an admin: every challenge is locked and suspendedMessage explains why. */
    suspended?: boolean;
    suspendedMessage?: string | null;
  } | null;
  profile: {
    complete: boolean;
    missing: Array<"onboarding" | "userType" | "targetJobRole" | "resume" | "industry" | "college">;
    name: string | null;
    userType: string | null;
    targetJobRole: string | null;
    targetCompany: string | null;
    experience: number | null;
  };
  progress: HackathonProgress;
  resume: {
    resumeId: string;
    title: string;
    atsScore: number | null;
    submittedAt: string | null;
    /** Submitted, but "Complete challenge" hasn't been pressed, so the next challenge is still locked. */
    awaitingCompletion?: boolean;
    /** The ATS score is still being worked out after the submit (atsScore is null until then). */
    scoring?: boolean;
  } | null;
  preferredResumeId?: string | null;
  social: {
    linkedinUrl: string;
    instagramUrl?: string | null;
    reviewStatus: SocialReviewStatus;
    reviewNote: string | null;
  } | null;
}

export interface EligibleResume {
  resumeId: string;
  title: string;
  atsScore: number | null;
  hasPdf: boolean;
  updatedAt?: string;
}

export interface HackathonApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function toHackathonError(error: unknown, fallback = "Something went wrong. Please try again."): HackathonApiError {
  const e = error as {
    response?: {
      status?: number;
      data?: {
        code?: string;
        message?: string;
        details?: Record<string, unknown>;
        data?: { unavailableTitle?: string; unavailableMessage?: string };
      };
    };
  };
  const payload = e?.response?.data;
  return {
    status: e?.response?.status ?? 0,
    code: payload?.code ?? (e?.response ? "UNKNOWN" : "NETWORK_ERROR"),
    message:
      payload?.data?.unavailableMessage ??
      payload?.message ??
      (e?.response ? fallback : "Network error. Check your connection and try again."),
    details: payload?.details,
  };
}

type TokenGetter = () => Promise<string | null>;

async function authHeaders(getToken: TokenGetter) {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function hackathonBase(slug: string) {
  return `/hackathons/${slug}`;
}

export function eventTargets(hackathon: { targets?: { atsScore?: number; interviewScore?: number } } | undefined) {
  return {
    atsScore: hackathon?.targets?.atsScore ?? HACKATHON_TARGETS.atsScore,
    interviewScore: hackathon?.targets?.interviewScore ?? HACKATHON_TARGETS.interviewScore,
  };
}

export const hackathonApi = {
  listPublished: async (): Promise<Array<Pick<HackathonPublic, "slug" | "title" | "phase" | "startsAt" | "endsAt" | "isFull" | "spotsLeft">>> => {
    const res = await apiClient.get<{ data: Array<Pick<HackathonPublic, "slug" | "title" | "phase" | "startsAt" | "endsAt" | "isFull" | "spotsLeft">> }>(
      "/hackathons",
    );
    return res.data.data;
  },

  getPublic: async (slug: string): Promise<HackathonPublic> => {
    const res = await apiClient.get<{ data: HackathonPublic }>(hackathonBase(slug));
    return res.data.data;
  },

  me: async (slug: string, getToken: TokenGetter): Promise<HackathonMe> => {
    const res = await apiClient.get<{ data: HackathonMe }>(`${hackathonBase(slug)}/me`, {
      headers: await authHeaders(getToken),
    });
    return res.data.data;
  },

  /** Saves a pre-sign-up quiz answer (no account needed). Sends the session if there is one. */
  preSurvey: async (
    slug: string,
    getToken: TokenGetter,
    body: { token?: string; attended?: "yes" | "no"; ready?: "yes" | "nervous"; utm?: Record<string, string> },
  ): Promise<{ token: string | null; linked: boolean }> => {
    const res = await apiClient.post<{ data: { token: string | null; linked: boolean } }>(
      `${hackathonBase(slug)}/pre-survey`,
      body,
      { headers: await authHeaders(getToken) },
    );
    return res.data.data;
  },

  /** Links the quiz answered before sign-up to the signed-in account. */
  submitLaunchRegistration: async (
    slug: string,
    body: {
      name: string;
      phone: string;
      email: string;
      profession: "student" | "self_employed" | "working_professional";
      whyAttend: "stay_relevant" | "expert_advice" | "practical_solutions" | "community_launch";
      attended: "yes" | "no";
      ready: "yes" | "nervous";
    },
  ): Promise<{ registrationId: string }> => {
    const res = await apiClient.post<{ data: { registrationId: string } }>(
      `${hackathonBase(slug)}/launch-registration`,
      body,
    );
    return res.data.data;
  },

  claimPreSurvey: async (slug: string, getToken: TokenGetter, token: string): Promise<{ linked: boolean }> => {
    const res = await apiClient.post<{ data: { linked: boolean } }>(
      `${hackathonBase(slug)}/pre-survey/claim`,
      { token },
      { headers: await authHeaders(getToken) },
    );
    return res.data.data;
  },

  register: async (slug: string, getToken: TokenGetter, source?: string): Promise<HackathonMe> => {
    const res = await apiClient.post<{ data: HackathonMe }>(
      `${hackathonBase(slug)}/register`,
      { source },
      { headers: await authHeaders(getToken) },
    );
    return res.data.data;
  },

  listResumes: async (slug: string, getToken: TokenGetter): Promise<EligibleResume[]> => {
    const res = await apiClient.get<{ data: EligibleResume[] }>(`${hackathonBase(slug)}/me/resumes`, {
      headers: await authHeaders(getToken),
    });
    return res.data.data;
  },

  submitResume: async (slug: string, getToken: TokenGetter, resumeId: string): Promise<HackathonMe> => {
    const res = await apiClient.post<{ data: HackathonMe }>(
      `${hackathonBase(slug)}/me/resume`,
      { resumeId },
      { headers: await authHeaders(getToken), timeout: 120_000 },
    );
    return res.data.data;
  },

  /** Scores a resume for the pre-submit pop-up; saves nothing. */
  previewResumeScore: async (
    slug: string,
    getToken: TokenGetter,
    resumeId: string,
  ): Promise<{ atsScore: number | null; minScore: number | null }> => {
    const res = await apiClient.post<{ data: { atsScore: number | null; minScore: number | null } }>(
      `${hackathonBase(slug)}/me/resume/score`,
      { resumeId },
      { headers: await authHeaders(getToken), timeout: 90_000 },
    );
    return res.data.data;
  },

  /** "Complete challenge": makes the submitted resume final and unlocks the next challenge. */
  completeResumeChallenge: async (slug: string, getToken: TokenGetter): Promise<HackathonMe> => {
    const res = await apiClient.post<{ data: HackathonMe }>(
      `${hackathonBase(slug)}/me/resume/complete`,
      {},
      { headers: await authHeaders(getToken) },
    );
    return res.data.data;
  },

  resumeUrl: async (slug: string, getToken: TokenGetter): Promise<{ url: string; expiresIn: number }> => {
    const res = await apiClient.get<{ data: { url: string; expiresIn: number } }>(`${hackathonBase(slug)}/me/resume-url`, {
      headers: await authHeaders(getToken),
    });
    return res.data.data;
  },

  startInterview: async (
    slug: string,
    getToken: TokenGetter,
    slot: number,
    language: "en" | "hi",
    extras?: { targetRole?: string; targetCompany?: string },
  ): Promise<{ interviewId?: string; sessionId?: string }> => {
    const res = await apiClient.post<{ data: { interviewId?: string; sessionId?: string } }>(
      `${hackathonBase(slug)}/me/interviews/${slot}/start`,
      { language, ...extras },
      { headers: await authHeaders(getToken), timeout: 120_000 },
    );
    return res.data.data;
  },

  submitInterview: async (
    slug: string,
    getToken: TokenGetter,
    slot: number,
    challengeId?: string,
  ): Promise<HackathonMe> => {
    const path = challengeId
      ? `${hackathonBase(slug)}/me/challenges/${challengeId}/slots/${slot}/submit`
      : `${hackathonBase(slug)}/me/interviews/${slot}/submit`;
    const res = await apiClient.post<{ data: HackathonMe }>(path, {}, { headers: await authHeaders(getToken) });
    return res.data.data;
  },

  reattemptInterview: async (
    slug: string,
    getToken: TokenGetter,
    slot: number,
    challengeId?: string,
  ): Promise<HackathonMe> => {
    const path = challengeId
      ? `${hackathonBase(slug)}/me/challenges/${challengeId}/slots/${slot}/reattempt`
      : `${hackathonBase(slug)}/me/interviews/${slot}/reattempt`;
    const res = await apiClient.post<{ data: HackathonMe }>(path, {}, { headers: await authHeaders(getToken) });
    return res.data.data;
  },

  startChallenge: async (
    slug: string,
    getToken: TokenGetter,
    challengeId: string,
    slot: number,
    language: "en" | "hi",
    extras?: { targetRole?: string; targetCompany?: string },
  ): Promise<{ interviewId?: string; sessionId?: string }> => {
    const res = await apiClient.post<{ data: { interviewId?: string; sessionId?: string } }>(
      `${hackathonBase(slug)}/me/challenges/${challengeId}/slots/${slot}/start`,
      { language, ...extras },
      { headers: await authHeaders(getToken), timeout: 120_000 },
    );
    return res.data.data;
  },

  submitSocial: async (
    slug: string,
    getToken: TokenGetter,
    body: { linkedinUrl: string },
  ): Promise<HackathonMe> => {
    const res = await apiClient.post<{ data: HackathonMe }>(`${hackathonBase(slug)}/me/social`, body, {
      headers: await authHeaders(getToken),
    });
    return res.data.data;
  },

  setReminders: async (slug: string, getToken: TokenGetter, enabled: boolean): Promise<HackathonMe> => {
    const res = await apiClient.post<{ data: HackathonMe }>(
      `${hackathonBase(slug)}/me/reminders`,
      { enabled },
      { headers: await authHeaders(getToken) },
    );
    return res.data.data;
  },

  complete: async (slug: string, getToken: TokenGetter): Promise<HackathonMe> => {
    const res = await apiClient.post<{ data: HackathonMe }>(`${hackathonBase(slug)}/me/complete`, {}, {
      headers: await authHeaders(getToken),
    });
    return res.data.data;
  },

};

// ---------------------------------------------------------------- admin

export interface AdminHackathonOverview {
  hackathonId: string;
  slug: string;
  title: string;
  visibility: "draft" | "published";
  phase: HackathonPhase;
  status: HackathonPhase;
  startsAt: string | null;
  startedAt: string | null;
  endsAt: string | null;
  submissionsDueAt?: string | null;
  endedAt: string | null;
  maxCompletions: number | null;
  registrationOpen?: boolean;
  interviewGraceMinutes: number;
  reminders?: { enabled: boolean; hour: number; startAt: string | null };
  interviewConfig: {
    requiredCount: number;
    durationMinutes: number;
    maxAttemptsPerSlot: number;
    maxConcurrent: number;
    voiceProvider?: string;
  };
  socialConfig: { enabled: boolean; requiredPlatforms: Array<"linkedin" | "instagram"> };
  landing: { tagline: string; description: string; registerCta: string };
  targets: { atsScore: number; interviewScore: number };
  challenges: HackathonChallenge[];
  designLocked: boolean;
  participantCount: number;
  capacity: { maxCompletions: number | null; completedCount: number; isFull: boolean; spotsLeft: number | null };
  counts: Record<ParticipantStatus | "total", number>;
  launchRegistrationCount?: number;
  statusHistory: Array<{ action: string; from?: string; to?: string; byUserId: string; at: string; note?: string }>;
}

export interface AdminLaunchRegistrationRow {
  registrationId: string;
  name: string;
  phone: string;
  email: string;
  profession: "student" | "self_employed" | "working_professional";
  whyAttend: "stay_relevant" | "expert_advice" | "practical_solutions" | "community_launch";
  attended: "yes" | "no";
  ready: "yes" | "nervous";
  createdAt: string;
}

export interface AdminParticipantRow {
  participantId: string;
  userId: string;
  /** From the user's profile ("+91 9876543210"); null if they never added one. */
  phone?: string | null;
  status: ParticipantStatus;
  profileSnapshot?: { name?: string; email?: string; userType?: string; targetJobRole?: string; experience?: number };
  registeredAt: string;
  completedAt?: string | null;
  suspension?: { at: string; byUserId: string; previousStatus: ParticipantStatus; note?: string } | null;
  summary?: {
    resumeAtsScore: number | null;
    interview1Score: number | null;
    interview2Score: number | null;
    avgInterviewScore: number | null;
    challengesCompleted: number;
    socialReviewStatus: SocialReviewStatus;
    interviewSlots?: Array<{
      challengeId: string;
      slot: number;
      score: number | null;
      hasRecording: boolean | null;
    }>;
    missingRecording?: boolean;
  };
}

export interface AdminParticipantDetail {
  participant: AdminParticipantRow;
  resume: {
    status: string;
    submittedAt: string | null;
    resumeId: string;
    title: string;
    atsScore: number | null;
    awaitingCompletion?: boolean;
    priorCount: number;
    adminReset?: AdminResetInfo | null;
  } | null;
  interviews: Array<{
    slot: number;
    status: string;
    submittedAt: string | null;
    interviewId: string | null;
    overallScore: number | null;
    categoryScores: Record<string, number> | null;
    reportId: string | null;
    challengeId: string | null;
    priorCount: number;
    adminReset?: AdminResetInfo | null;
    hasRecording: boolean;
    /** "camera" = taken on a phone (no screen share), recorded camera + mic only. */
    recordingSource?: "screen" | "camera" | null;
    attempts: Array<{
      attemptId: string;
      interviewId: string | null;
      status: string;
      claimedAt: string;
      startedAt: string | null;
      endedAt: string | null;
      failureReason: string | null;
      countsTowardLimit: boolean;
      hasRecording: boolean;
      recordingSource?: "screen" | "camera" | null;
    }>;
  }>;
  social: {
    status: string;
    submittedAt: string | null;
    linkedinUrl: string;
    instagramUrl: string;
    reviewStatus: SocialReviewStatus;
    reviewNote: string | null;
    reviewedAt: string | null;
    priorCount: number;
    adminReset?: AdminResetInfo | null;
  } | null;
}

export type AdminParticipantSort = "recent" | "ats" | "interview" | "completed";
export type AdminSocialReviewFilter = SocialReviewStatus;

export type AdminHackathonWriteBody = {
  title?: string;
  slug?: string;
  startsAt?: string | null;
  endsAt?: string;
  submissionsDueAt?: string | null;
  interviewGraceMinutes?: number;
  maxCompletions?: number | null;
  registrationOpen?: boolean;
  landing?: { tagline?: string; description?: string; registerCta?: string };
  targets?: { atsScore?: number; interviewScore?: number };
  challenges?: Array<{
    challengeId?: string;
    kind: HackathonChallengeKind;
    title: string;
    description?: string;
    config?: HackathonChallenge["config"];
  }>;
  resumeTitle?: string;
  resumeDescription?: string;
  interviewTitle?: string;
  interviewDescription?: string;
  socialTitle?: string;
  socialDescription?: string;
  socialEnabled?: boolean;
  interviewConfig?: {
    requiredCount?: number;
    durationMinutes?: 15 | 30;
    maxAttemptsPerSlot?: number;
    voiceProvider?: "gemini" | "gemini38" | "gemini38extended" | "chatgpt" | "sarvam";
    maxConcurrent?: number;
  };
  reminders?: { enabled?: boolean; hour?: number; startAt?: string | null };
};

const adminBase = "/admin/hackathons";

export const hackathonAdminApi = {
  list: async (): Promise<AdminHackathonOverview[]> => {
    const res = await apiClient.get<{ data: AdminHackathonOverview[] }>(adminBase);
    return res.data.data;
  },
  get: async (hackathonId: string): Promise<AdminHackathonOverview> => {
    const res = await apiClient.get<{ data: AdminHackathonOverview }>(`${adminBase}/${hackathonId}`);
    return res.data.data;
  },
  getBySlug: async (slug: string): Promise<AdminHackathonOverview> => {
    const res = await apiClient.get<{ data: AdminHackathonOverview }>(`${adminBase}/slug/${slug}`);
    return res.data.data;
  },
  create: async (body: AdminHackathonWriteBody & { title: string; slug: string }): Promise<AdminHackathonOverview> => {
    const res = await apiClient.post<{ data: AdminHackathonOverview }>(adminBase, body);
    return res.data.data;
  },
  update: async (
    hackathonId: string,
    body: AdminHackathonWriteBody,
  ): Promise<{ data: AdminHackathonOverview; warning?: string }> => {
    const res = await apiClient.patch<{ data: AdminHackathonOverview; warning?: string }>(
      `${adminBase}/${hackathonId}`,
      body,
    );
    return res.data;
  },
  publish: async (hackathonId: string): Promise<AdminHackathonOverview> => {
    const res = await apiClient.post<{ data: AdminHackathonOverview }>(`${adminBase}/${hackathonId}/publish`, {});
    return res.data.data;
  },
  unpublish: async (hackathonId: string): Promise<AdminHackathonOverview> => {
    const res = await apiClient.post<{ data: AdminHackathonOverview }>(`${adminBase}/${hackathonId}/unpublish`, {});
    return res.data.data;
  },
  preview: async (hackathonId: string): Promise<HackathonPublic> => {
    const res = await apiClient.get<{ data: HackathonPublic }>(`${adminBase}/${hackathonId}/preview`);
    return res.data.data;
  },
  start: async (hackathonId: string): Promise<AdminHackathonOverview> => {
    const res = await apiClient.post<{ data: AdminHackathonOverview }>(`${adminBase}/${hackathonId}/start`, {});
    return res.data.data;
  },
  end: async (hackathonId: string, note?: string): Promise<AdminHackathonOverview> => {
    const res = await apiClient.post<{ data: AdminHackathonOverview }>(`${adminBase}/${hackathonId}/end`, { note });
    return res.data.data;
  },
  restoreStatus: async (
    hackathonId: string,
    target: "upcoming" | "live",
    endsAt?: string,
  ): Promise<AdminHackathonOverview> => {
    const res = await apiClient.post<{ data: AdminHackathonOverview }>(`${adminBase}/${hackathonId}/restore`, {
      target,
      endsAt,
    });
    return res.data.data;
  },
  reopen: async (hackathonId: string, endsAt: string, note: string): Promise<AdminHackathonOverview> => {
    const res = await apiClient.post<{ data: AdminHackathonOverview }>(`${adminBase}/${hackathonId}/reopen`, {
      endsAt,
      note,
    });
    return res.data.data;
  },
  runNotifications: async (hackathonId: string): Promise<{ scanned: number; reminders: number }> => {
    const res = await apiClient.post<{ data: { scanned: number; reminders: number } }>(
      `${adminBase}/${hackathonId}/notifications/run`,
      {},
    );
    return res.data.data;
  },
  reconcile: async (
    hackathonId: string,
  ): Promise<{ reconciled: number; atsBackfilled: number; summariesRefreshed: number }> => {
    const res = await apiClient.post<{
      data: { reconciled: number; atsBackfilled: number; summariesRefreshed: number };
    }>(
      `${adminBase}/${hackathonId}/reconcile`,
      {},
    );
    return res.data.data;
  },
  participants: async (
    hackathonId: string,
    query: {
      q?: string;
      status?: ParticipantStatus;
      sort?: AdminParticipantSort;
      socialReview?: AdminSocialReviewFilter;
      missingVideo?: boolean;
      page: number;
      limit: number;
    },
  ): Promise<{ rows: AdminParticipantRow[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<{
      data: { rows: AdminParticipantRow[]; total: number; page: number; limit: number };
    }>(`${adminBase}/${hackathonId}/participants`, { params: query });
    return res.data.data;
  },
  participant: async (hackathonId: string, participantId: string): Promise<AdminParticipantDetail> => {
    const res = await apiClient.get<{ data: AdminParticipantDetail }>(
      `${adminBase}/${hackathonId}/participants/${participantId}`,
    );
    return res.data.data;
  },
  resumeUrl: async (hackathonId: string, participantId: string): Promise<{ url: string; expiresIn: number }> => {
    const res = await apiClient.get<{ data: { url: string; expiresIn: number } }>(
      `${adminBase}/${hackathonId}/participants/${participantId}/resume-url`,
    );
    return res.data.data;
  },
  resetChallenge: async (
    hackathonId: string,
    participantId: string,
    challengeId: string,
    body?: { slot?: number; note?: string },
  ): Promise<{ detail: AdminParticipantDetail; emailedTo: string | null }> => {
    const res = await apiClient.post<{ data: AdminParticipantDetail; emailedTo?: string | null }>(
      `${adminBase}/${hackathonId}/participants/${participantId}/challenges/${challengeId}/reset`,
      body ?? {},
    );
    return { detail: res.data.data, emailedTo: res.data.emailedTo ?? null };
  },
  reviewSocial: async (
    hackathonId: string,
    participantId: string,
    decision: "approved" | "rejected",
    note?: string,
  ): Promise<AdminParticipantDetail> => {
    const res = await apiClient.post<{ data: AdminParticipantDetail }>(
      `${adminBase}/${hackathonId}/participants/${participantId}/social-review`,
      { decision, note },
    );
    return res.data.data;
  },
  suspendParticipant: async (hackathonId: string, participantId: string, note?: string): Promise<void> => {
    await apiClient.post(`${adminBase}/${hackathonId}/participants/${participantId}/suspend`, note ? { note } : {});
  },
  unsuspendParticipant: async (hackathonId: string, participantId: string): Promise<void> => {
    await apiClient.post(`${adminBase}/${hackathonId}/participants/${participantId}/unsuspend`, {});
  },
  /** Removes the entry and its submissions; the user can register again. */
  deleteParticipant: async (hackathonId: string, participantId: string): Promise<void> => {
    await apiClient.delete(`${adminBase}/${hackathonId}/participants/${participantId}`);
  },
  exportCsv: async (hackathonId: string): Promise<Blob> => {
    const res = await apiClient.get<Blob>(`${adminBase}/${hackathonId}/export.csv`, { responseType: "blob" });
    return res.data;
  },
  launchRegistrations: async (
    hackathonId: string,
    query: { q?: string; page: number; limit: number },
  ): Promise<{ rows: AdminLaunchRegistrationRow[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<{
      data: { rows: AdminLaunchRegistrationRow[]; total: number; page: number; limit: number };
    }>(`${adminBase}/${hackathonId}/launch-registrations`, { params: query });
    return res.data.data;
  },
  exportLaunchRegistrationsCsv: async (hackathonId: string): Promise<Blob> => {
    const res = await apiClient.get<Blob>(`${adminBase}/${hackathonId}/launch-registrations/export.csv`, {
      responseType: "blob",
    });
    return res.data;
  },
};
