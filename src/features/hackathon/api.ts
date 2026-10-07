import { apiClient } from "@/lib/api";
import { HACKATHON_TARGETS } from "./config";

export type HackathonPhase = "upcoming" | "live" | "ended";
export type StepState = "locked" | "available" | "in_progress" | "processing" | "completed";
export type LockReason =
  | "not_started"
  | "ended"
  | "full"
  | "profile_incomplete"
  | "previous_step"
  | "attempt_limit"
  | "below_pass_mark"
  | "inactive_entry";
export type ParticipantStatus = "registered" | "in_progress" | "completed" | "disqualified" | "withdrawn";
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
  isFull: boolean;
  spotsLeft: number | null;
  maxCompletions: number | null;
  landing?: { tagline: string; description: string; registerCta: string };
  targets?: { atsScore: number; interviewScore: number };
  socialRequired?: boolean;
  challenges: HackathonChallenge[];
  interviewConfig: { requiredCount: number; durationMinutes: number; maxAttemptsPerSlot: number };
  serverNow: string;
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
}

export interface HackathonProgress {
  challenges?: ChallengeProgress[];
  resume: { state: StepState; lockReason?: LockReason };
  interviews: { state: StepState; lockReason?: LockReason; slots: InterviewSlotProgress[] };
  social: { state: StepState; lockReason?: LockReason };
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
  } | null;
  profile: {
    complete: boolean;
    missing: Array<"onboarding" | "userType" | "targetJobRole" | "resume">;
    name: string | null;
    userType: string | null;
    targetJobRole: string | null;
    targetCompany: string | null;
    experience: number | null;
  };
  progress: HackathonProgress;
  resume: { resumeId: string; title: string; atsScore: number | null; submittedAt: string | null } | null;
  preferredResumeId?: string | null;
  social: {
    linkedinUrl: string;
    instagramUrl: string;
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
    response?: { status?: number; data?: { code?: string; message?: string; details?: Record<string, unknown> } };
  };
  return {
    status: e?.response?.status ?? 0,
    code: e?.response?.data?.code ?? (e?.response ? "UNKNOWN" : "NETWORK_ERROR"),
    message: e?.response?.data?.message ?? (e?.response ? fallback : "Network error. Check your connection and try again."),
    details: e?.response?.data?.details,
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
    body: { linkedinUrl: string; instagramUrl: string },
  ): Promise<HackathonMe> => {
    const res = await apiClient.post<{ data: HackathonMe }>(`${hackathonBase(slug)}/me/social`, body, {
      headers: await authHeaders(getToken),
    });
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
  endedAt: string | null;
  maxCompletions: number | null;
  interviewGraceMinutes: number;
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
  statusHistory: Array<{ action: string; from?: string; to?: string; byUserId: string; at: string; note?: string }>;
}

export interface AdminParticipantRow {
  participantId: string;
  userId: string;
  status: ParticipantStatus;
  profileSnapshot?: { name?: string; email?: string; userType?: string; targetJobRole?: string; experience?: number };
  registeredAt: string;
  completedAt?: string | null;
  summary?: {
    resumeAtsScore: number | null;
    interview1Score: number | null;
    interview2Score: number | null;
    avgInterviewScore: number | null;
    challengesCompleted: number;
    socialReviewStatus: SocialReviewStatus;
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
    priorCount: number;
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
    hasRecording: boolean;
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
  } | null;
}

export type AdminParticipantSort = "recent" | "ats" | "interview" | "completed";

export type AdminHackathonWriteBody = {
  title?: string;
  slug?: string;
  startsAt?: string | null;
  endsAt?: string;
  interviewGraceMinutes?: number;
  maxCompletions?: number | null;
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
  reopen: async (hackathonId: string, endsAt: string, note: string): Promise<AdminHackathonOverview> => {
    const res = await apiClient.post<{ data: AdminHackathonOverview }>(`${adminBase}/${hackathonId}/reopen`, {
      endsAt,
      note,
    });
    return res.data.data;
  },
  reconcile: async (hackathonId: string): Promise<{ reconciled: number; atsBackfilled: number }> => {
    const res = await apiClient.post<{ data: { reconciled: number; atsBackfilled: number } }>(
      `${adminBase}/${hackathonId}/reconcile`,
      {},
    );
    return res.data.data;
  },
  participants: async (
    hackathonId: string,
    query: { q?: string; status?: ParticipantStatus; sort?: AdminParticipantSort; page: number; limit: number },
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
  ): Promise<AdminParticipantDetail> => {
    const res = await apiClient.post<{ data: AdminParticipantDetail }>(
      `${adminBase}/${hackathonId}/participants/${participantId}/challenges/${challengeId}/reset`,
      body ?? {},
    );
    return res.data.data;
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
  exportCsv: async (hackathonId: string): Promise<Blob> => {
    const res = await apiClient.get<Blob>(`${adminBase}/${hackathonId}/export.csv`, { responseType: "blob" });
    return res.data;
  },
};
