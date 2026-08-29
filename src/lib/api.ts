import axios, {
  AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ATSReportV3 } from "@/types/atsReport";
export { isATSReportV3 } from "@/types/atsReport";
import { inferImageContentType } from "@/lib/image-upload";
import { getSignInUrlWithRedirect } from "@/lib/post-sign-in-redirect";
import { trimJobDescriptionForSend } from "@/lib/job-description-limits";

/** Base URL for API (includes `/api` path). Use for `<img src>` and other non-axios URLs. */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

export type SubscriptionPlanSlug =
  | "free"
  | "trial"
  | "general_pass"
  | "tech_basic"
  | "tech_pro"
  | "enterprise"
  | "premium";

export type SelfServePlanSlug =
  | "general_pass"
  | "tech_basic"
  | "tech_pro";

export type InterviewCreditType =
  | "aiMockInterview"
  | "codingRound"
  | "systemDesign";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  // Don't set default Content-Type - let each request set its own
});

/**
 * Mobile Safari / Chrome often break multipart uploads if `Content-Type` is set
 * without a `boundary`. Axios must not send Content-Type for FormData — the
 * browser will set `multipart/form-data; boundary=...`.
 */
function stripContentTypeForFormData(config: InternalAxiosRequestConfig) {
  if (!(config.data instanceof FormData)) return;
  const h = config.headers;
  if (!h) return;
  if (typeof h.delete === "function") {
    h.delete("Content-Type");
    h.delete("content-type");
  } else {
    const raw = h as Record<string, unknown>;
    delete raw["Content-Type"];
    delete raw["content-type"];
  }
}

/**
 * Copy `File` bytes into a `Blob` before appending to FormData.
 * Android Chrome can throw `net::ERR_UPLOAD_FILE_CHANGED` / Axios "Network Error"
 * when the OS invalidates the original file handle during the XHR (Downloads, cloud pickers).
 */
async function snapshotFileForUpload(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  return new Blob([buffer], {
    type: file.type || "application/octet-stream",
  });
}

async function snapshotImageForUpload(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  return new Blob([buffer], {
    type: inferImageContentType(file),
  });
}

// Token getter - set by AuthTokenProvider for JWT verification on backend
let tokenGetter: (() => Promise<string | null>) | null = null;
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  return tokenGetter();
}

// Request interceptor to add auth token and userId
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      try {
        const userId = localStorage.getItem("clerk-user-id");
        if (userId) {
          config.headers["x-user-id"] = userId;
        }
        // Add JWT for backend verification when available
        if (tokenGetter) {
          const token = await tokenGetter();
          if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error("Error getting auth:", error);
      }
    }
    stripContentTypeForFormData(config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      if (typeof window !== "undefined") {
        const returnPath = `${window.location.pathname}${window.location.search}`;
        window.location.href = getSignInUrlWithRedirect(returnPath);
      }
    }
    return Promise.reject(error);
  },
);

// API Types
export type AccessRole = "super_admin" | "institution_admin" | "user";

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  role: "student" | "college";
  accessRole?: AccessRole;
  institutionId?: string;
  /** Self-reported institute (optional); separate from institutionId (org membership) */
  affiliationInstitutionId?: string | null;
  affiliationInstitutionName?: string;
  onboardingCompleted?: boolean;
  welcomeSignupIntent?: "candidate" | "recruiter" | "interviewer";
  userType?: "student" | "fresher" | "experienced";
  experience?: number;
  /** Role the candidate is preparing / interviewing for */
  targetJobRole?: string;
  /** Company the candidate is targeting */
  targetCompany?: string;
  /** Contact phone number */
  phone?: string;
  currentJob?: {
    company: string;
    role: string;
    industry?: string;
  };
  industry?: string;
  /** @deprecated legacy multi-select; use `industry` */
  industries?: string[];
  /** Technical / professional skills */
  skills?: string[];
  /** Candidate-managed job-seeking status (iX Talent) */
  candidateStatus?: CandidateStatus | null;
  /** IANA timezone for peer interviews */
  peerTimezone?: string;
  resume?: {
    s3Key: string;
    filename: string;
    uploadedAt: string;
    size: number;
  };
  subscription?: {
    plan: SubscriptionPlanSlug;
    status: "active" | "cancelled" | "expired";
    currentPeriodEnd?: string;
    interviewsUsed?: number;
    interviewsLimit?: number;
  };
  credits?: {
    total: number;
    used: number;
    expiring?: Array<{ amount: number; expiryDate: string }>;
  };
  createdAt: string;
  profileCompletionPercentage?: number;
  /** Avg. overall report score (practice + completed interviews), when present */
  averageInterviewScore?: number | null;
  /** Peer interview capability derived from an InterviewerProfile */
  peer?: {
    isInterviewer: boolean;
    interviewerStatus:
      | "pending"
      | "approved"
      | "rejected"
      | "suspended"
      | "blocked"
      | null;
  };
  /** Recruiter capability derived from a RecruiterProfile (iX Talent) */
  recruiter?: {
    isRecruiter: boolean;
    recruiterStatus: RecruiterStatus | null;
  };
  /** Which interview types count toward the iX Report */
  interviewOptIns?: InterviewOptIns;
}

export type CandidateStatus = "actively_looking" | "skilling_up" | "hired";

export type InterviewOptIns = {
  screening: boolean;
  coding: boolean;
  systemDesign: boolean;
  peer: boolean;
};

export type IxCategoryKey = "screening" | "coding" | "systemDesign" | "peer";

export interface IxCategorySnapshot {
  score: number | null;
  sessionCount: number;
  lastSessionAt: string | null;
  hasData: boolean;
}

export interface IxScoreSnapshot {
  clerkId: string;
  userId: string;
  computedAt: string;
  optIns: InterviewOptIns;
  categories: Partial<Record<IxCategoryKey, IxCategorySnapshot>>;
  overall: {
    average: number | null;
    rawSum: number;
    maxRaw: number;
    optedCount: number;
    categoriesWithData: number;
  };
  communication: {
    behavioral: number | null;
    technical: number | null;
    technicalLabel: string;
    sessionCount: number;
  };
  reportPdfS3Key?: string;
}

export interface IxSessionRow {
  id: string;
  category: IxCategoryKey;
  title: string;
  completedAt: string;
  /** When the interview/session/booking was created (not report generation time). */
  createdAt?: string;
  /** When the interview was scheduled to occur (peer start; else created). */
  scheduledAt?: string;
  overallScore: number;
  reportHref: string;
  source: "ai" | "coding" | "system_design" | "peer";
  status: "completed" | "processing";
  hasVideo?: boolean;
  hasReportPdf?: boolean;
}

export type RecruiterSessionSource = IxSessionRow["source"];

export type RecruiterSessionReportPayload =
  | {
      kind: "interview";
      source: "ai" | "coding";
      report: InterviewReport;
      interview: {
        interviewId: string;
        metadata?: Interview["metadata"];
        createdAt?: string;
        status?: string;
      };
    }
  | {
      kind: "system_design";
      source: "system_design";
      report: Record<string, unknown>;
      session: Record<string, unknown>;
    }
  | {
      kind: "peer";
      source: "peer";
      report: PeerInterviewReport | null;
      booking: Record<string, unknown>;
    };

/** Matches post-interview UX feedback form / API (session issues dropdown). */
export type InterviewPostSessionChallenge =
  | "none"
  | "slowness"
  | "connection_abort"
  | "audio"
  | "video"
  | "other";

export interface Interview {
  _id: string;
  interviewId: string;
  userId: string;
  status: "draft" | "active" | "completed" | "processing" | "failed";
  metadata: {
    role: string;
    experience: number;
    language: "en" | "hi";
    department?:
      | "engineering"
      | "management"
      | "commerce_finance"
      | "healthcare_pharma"
      | "marketing"
      | "sales"
      | "general";
    discipline?: "cse" | "it" | "mech" | "civil" | "mba" | "bba" | "none";
    resumeS3Key?: string;
    targetCompany?: string;
    createdAt: string;
    /** Interview duration in minutes (15 or 30). */
    interviewDuration?: number;
    interviewKind?: "general" | "coding_practice";
    codingPhaseDurationMinutes?: number;
    discussionDurationMinutes?: number;
    /** When true (e.g. institute admin), denying screen capture may block the session. */
    requireSessionRecording?: boolean;
  };
  codingRound?: {
    status: string;
    assignedProblemIds: string[];
    codingPhaseStartedAt?: string;
    codingPhaseEndedAt?: string;
    discussionCursor?: number;
    submissions: Array<{
      problemId: string;
      language: string;
      code: string;
      lastRunSummary?: string;
      finalScore: number;
      testsPassed: number;
      testsTotal: number;
      submittedAt: string;
    }>;
  };
  session?: {
    s3VideoKey?: string;
    videoUrl?: string;
    duration?: number;
    startedAt?: string;
    endedAt?: string;
  };
  /** Candidate survey after realtime; `interviewId` references this interview. */
  postInterviewFeedback?: {
    interviewId: string;
    userId: string;
    sessionHelpful: boolean;
    questionsRelevant: boolean;
    overallRating: number;
    sessionChallenge: InterviewPostSessionChallenge;
    comment?: string;
    submittedAt: string;
  };
  report?: {
    overallScore: number;
    categoryScores: {
      technical: number;
      behavioral: number;
      communication: number;
      confidence: number;
    };
    strengths: string[];
    improvements: string[];
    behavioral: {
      confidence: number;
      clarity: number;
      fluency: number;
      fillersPerMinute: number;
    };
  };
  /** Credits charged when the session was billed (5 per billed minute). */
  creditsCharged?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewReport {
  _id: string;
  reportId: string;
  interviewId: string;
  userId: string;
  overallScore: number;
  categoryScores: {
    technical: number;
    behavioral: number;
    communication: number;
    confidence: number;
  };
  codingSummary?: {
    overallCodingScore: number;
    problems: Array<{
      problemId: string;
      title: string;
      score: number;
      passed: number;
      total: number;
      language: string;
    }>;
  };
  qaAnalysis: Array<{
    question: string;
    candidateAnswer: string;
    suggestedAnswer: string;
    correctnessScore: number;
    clarityScore: number;
    completenessScore: number;
    questionType: "technical" | "behavioral" | "system-design" | "hr";
    questionDifficulty: "easy" | "medium" | "hard";
    feedback: string;
    strengths: string[];
    improvements: string[];
    answerMatchedQuestion: boolean;
    technicalDepthMatch: "below" | "meets" | "exceeds";
    experienceAlignmentScore: number;
    validationNotes?: string;
  }>;
  strengths: string[];
  improvements: string[];
  domainSpecificFeedback: Array<{
    domain: string;
    score: number;
    feedback: string;
    recommendations: string[];
  }>;
  behavioral: {
    confidence: number;
    clarity: number;
    fluency: number;
    fillersPerMinute: number;
    averageWordCount?: number;
    pauseFrequency?: string;
  };
  llmMetadata: {
    model: string;
    promptVersion: string;
    tokens: {
      input: number;
      output: number;
    };
    cost: number;
    generatedAt: string;
  };
  /** Pass 2 coach narrative (overall summary, STAR, etc.) */
  pass2Analysis?: {
    recommendedNextDifficulty?: "easy" | "medium" | "hard";
    starMethodDetected?: boolean;
    starExamples?: string[];
    communicationScore?: number;
    overallSummary?: string;
    topStrengths?: string[];
    topImprovements?: string[];
  };
  /** Set after PDF is uploaded for sharing */
  reportPdfS3Key?: string;
  createdAt: string;
  updatedAt: string;
  /** Present when an institution admin loads the report and a passing score was set on the interview */
  passingScoreThreshold?: number;
  passStatus?: "pass" | "fail";
}

export interface CreateInterviewRequest {
  role: string;
  experience: number;
  language: "en" | "hi";
  department?:
    | "engineering"
    | "management"
    | "commerce_finance"
    | "healthcare_pharma"
    | "marketing"
    | "sales"
    | "general";
  discipline?: "cse" | "it" | "mech" | "civil" | "mba" | "bba" | "none";
  targetCompany?: string;
  resume?: File;
  useSavedResume?: boolean;
  /** Interview duration in minutes: 15 (default) or 30 (premium & enterprise). */
  duration?: number;
}

export interface CreateInterviewResponse {
  success: boolean;
  data: {
    interviewId: string;
    interview: Interview;
  };
  message: string;
}

// API Methods
export const userApi = {
  createOrGetUser: async (
    clerkId: string,
    email: string,
    name: string,
  ): Promise<User> => {
    const response = await apiClient.post<{ data: User }>("/users", {
      clerkId,
      email,
      name,
    });
    return response.data.data;
  },

  sendWelcomeSignup: async (
    signupPath: "candidate" | "recruiter" | "interviewer",
  ): Promise<{ sent: boolean; alreadySent: boolean }> => {
    const response = await apiClient.post<{
      data: { sent: boolean; alreadySent: boolean };
    }>("/users/me/welcome-signup", { signupPath });
    return response.data.data;
  },

  getProfile: async (userId: string): Promise<User> => {
    const response = await apiClient.get<{ data: User }>(`/users/${userId}`);
    return response.data.data;
  },

  getMyProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ data: User }>("/users/me/profile");
    return response.data.data;
  },

  /** Candidate self-managed job-seeking status (iX Talent) */
  updateCandidateStatus: async (
    candidateStatus: CandidateStatus,
  ): Promise<{ candidateStatus: CandidateStatus }> => {
    const response = await apiClient.patch<{
      data: { candidateStatus: CandidateStatus };
    }>("/users/me/candidate-status", { candidateStatus });
    return response.data.data;
  },

  /** Contact phone visible to iX Talent recruiters */
  updatePhone: async (phone: string): Promise<{ phone: string | null }> => {
    const response = await apiClient.patch<{
      data: { phone: string | null };
    }>("/users/me/phone", { phone });
    return response.data.data;
  },

  /** Search institutions by name (min 2 chars on server); for optional profile affiliation */
  searchInstitutionsForAffiliation: async (
    q: string
  ): Promise<{ _id: string; name: string }[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { _id: string; name: string }[];
    }>("/users/me/institutions/search", { params: { q } });
    return response.data.data;
  },

  updateResume: async (file: File): Promise<{ resume: User["resume"] }> => {
    const blob = await snapshotFileForUpload(file);
    const formData = new FormData();
    formData.append("resume", blob, file.name);

    const response = await apiClient.post<{
      data: { resume: User["resume"] };
    }>("/users/me/resume", formData);
    return response.data.data;
  },

  extractResumeData: async (
    file: File,
  ): Promise<{
    extracted: {
      name?: string;
      email?: string;
      phone?: string;
      experience?: number;
      skills?: string[];
      education?: string[];
      currentJob?: {
        company?: string;
        role?: string;
        industry?: string;
      };
      previousJobs?: Array<{
        company?: string;
        role?: string;
        duration?: string;
      }>;
      summary?: string;
    };
    resume: User["resume"];
  }> => {
    const blob = await snapshotFileForUpload(file);
    const formData = new FormData();
    formData.append("resume", blob, file.name);

    const response = await apiClient.post<{
      data: {
        extracted: any;
        resume: User["resume"];
      };
    }>("/users/me/resume/extract", formData);
    return response.data.data;
  },

  completeOnboarding: async (data: {
    userType: "student" | "fresher" | "experienced";
    experience?: number;
    targetJobRole?: string;
    targetCompany?: string;
    currentJob?: {
      company: string;
      role: string;
      industry?: string;
    };
    industry?: string;
    skills?: string[];
    affiliationInstitutionId?: string | null;
    affiliationInstitutionName?: string | null;
    interviewOptIns?: Partial<InterviewOptIns>;
  }): Promise<User> => {
    const response = await apiClient.post<{ data: User }>(
      "/users/me/onboarding",
      data,
    );
    return response.data.data;
  },

  updateProfile: async (data: {
    name?: string;
    userType?: "student" | "fresher" | "experienced";
    experience?: number;
    targetJobRole?: string;
    targetCompany?: string;
    currentJob?: {
      company: string;
      role: string;
      industry?: string;
    };
    industry?: string;
    skills?: string[];
    affiliationInstitutionId?: string | null;
    affiliationInstitutionName?: string | null;
  }): Promise<User> => {
    const response = await apiClient.put<{ data: User }>(
      "/users/me/profile",
      data,
    );
    return response.data.data;
  },

  deleteProfile: async (): Promise<void> => {
    await apiClient.delete("/users/me/profile");
  },
};

export const interviewApi = {
  create: async (
    userId: string,
    data: CreateInterviewRequest,
  ): Promise<CreateInterviewResponse> => {
    const formData = new FormData();
    formData.append("role", data.role);
    formData.append("experience", data.experience.toString());
    formData.append("language", data.language);
    if (data.department) {
      formData.append("department", data.department);
    }
    if (data.discipline) {
      formData.append("discipline", data.discipline);
    }
    if (data.targetCompany) {
      formData.append("targetCompany", data.targetCompany);
    }
    if (data.useSavedResume) {
      formData.append("useSavedResume", "true");
    }
    if (data.duration) {
      formData.append("duration", data.duration.toString());
    }
    if (data.resume) {
      const resumeBlob = await snapshotFileForUpload(data.resume);
      formData.append("resume", resumeBlob, data.resume.name);
    }

    const response = await apiClient.post<CreateInterviewResponse>(
      "/interviews",
      formData,
      {
        // Don't set Content-Type manually - let Axios set it with the boundary
        params: { userId },
      },
    );
    return response.data;
  },

  list: async (userId: string): Promise<Interview[]> => {
    const response = await apiClient.get<{ data: Interview[] }>(
      `/interviews/${userId}`,
    );
    return response.data.data;
  },

  get: async (interviewId: string): Promise<Interview> => {
    const response = await apiClient.get<{ data: Interview }>(
      `/interviews/detail/${interviewId}`,
    );
    return response.data.data;
  },

  start: async (interviewId: string): Promise<void> => {
    await apiClient.post(`/interviews/${interviewId}/start`);
  },

  complete: async (interviewId: string, videoFile?: Blob): Promise<void> => {
    const formData = new FormData();
    if (videoFile) {
      formData.append("video", videoFile, "interview-recording.webm");
    }
    // Don't set Content-Type manually - let Axios set it with the boundary
    await apiClient.post(`/interviews/${interviewId}/complete`, formData);
  },

  submitPostInterviewFeedback: async (
    interviewId: string,
    body: {
      sessionHelpful: boolean;
      questionsRelevant: boolean;
      overallRating: number;
      sessionChallenge: InterviewPostSessionChallenge;
      comment?: string;
    },
  ): Promise<Interview> => {
    const response = await apiClient.post<{ data: Interview }>(
      `/interviews/${interviewId}/post-interview-feedback`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data.data;
  },

  closeAsFailed: async (interviewId: string): Promise<void> => {
    await apiClient.post(`/interviews/${interviewId}/close-failed`);
  },

  /** Delete draft or active interview (owner only). Removes S3 recording and DB records. */
  deleteDraftOrActive: async (interviewId: string): Promise<void> => {
    await apiClient.delete(`/interviews/detail/${interviewId}`);
  },

  getInterview: async (interviewId: string): Promise<Interview> => {
    const response = await apiClient.get<{ data: Interview }>(
      `/interviews/detail/${interviewId}`,
    );
    return response.data.data;
  },

  getReport: async (interviewId: string): Promise<InterviewReport> => {
    const response = await apiClient.get<{ data: InterviewReport }>(
      `/interviews/${interviewId}/report`,
    );
    return response.data.data;
  },

  /** Presigned GET for stored report PDF, or stored: false if not uploaded yet */
  getReportPdfShareUrl: async (
    interviewId: string,
  ): Promise<
    | {
        stored: true;
        shareUrl: string;
        expiresIn: number;
      }
    | { stored: false; expiresIn: number }
  > => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const response = await apiClient.get<{
      data:
        | { stored: true; shareUrl: string; expiresIn: number }
        | { stored: false; expiresIn: number };
    }>(`/interviews/${interviewId}/report/pdf-share-url`, {
      params: { userId },
    });
    return response.data.data;
  },

  getReportPdfUploadUrl: async (
    interviewId: string,
  ): Promise<{ uploadUrl: string; s3Key: string; expiresIn: number }> => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const response = await apiClient.get<{
      data: { uploadUrl: string; s3Key: string; expiresIn: number };
    }>(`/interviews/${interviewId}/report/pdf-upload-url`, {
      params: { userId },
    });
    return response.data.data;
  },

  confirmReportPdfUpload: async (
    interviewId: string,
    s3Key: string,
  ): Promise<{ downloadUrl: string; s3Key: string; expiresIn: number }> => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const response = await apiClient.post<{
      data: { downloadUrl: string; s3Key: string; expiresIn: number };
    }>(
      `/interviews/${interviewId}/report/confirm-pdf-upload`,
      { s3Key },
      { params: { userId } },
    );
    return response.data.data;
  },

  /** Server Puppeteer PDF (same pipeline as resume generate-pdf). Updates reportPdfS3Key. */
  generateReportPDF: async (
    interviewId: string,
    htmlContent: string,
    padding?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    },
    templateCSS?: string,
  ): Promise<{ downloadUrl: string; s3Key: string }> => {
    const response = await apiClient.post<{
      data: { downloadUrl: string; s3Key: string };
    }>(
      `/interviews/${interviewId}/report/generate-pdf`,
      {
        htmlContent,
        padding,
        templateCSS,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000,
      },
    );
    return response.data.data;
  },

  getRecordingVideoUrl: async (
    interviewId: string,
  ): Promise<{ videoUrl: string; expiresIn: number }> => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const response = await apiClient.get<{
      data: { videoUrl: string; expiresIn: number };
    }>(`/interviews/${interviewId}/recording/video-url`, {
      params: { userId },
    });
    return response.data.data;
  },

  getRecordingUploadUrl: async (
    interviewId: string,
  ): Promise<{ uploadUrl: string; s3Key: string; expiresIn: number }> => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const response = await apiClient.get<{
      data: { uploadUrl: string; s3Key: string; expiresIn: number };
    }>(`/interviews/${interviewId}/recording/upload-url`, {
      params: { userId },
    });
    return response.data.data;
  },

  saveRecordingKey: async (
    interviewId: string,
    s3Key: string,
  ): Promise<{ s3Key: string; videoUrl: string }> => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const response = await apiClient.post<{
      data: { s3Key: string; videoUrl: string };
    }>(
      `/interviews/${interviewId}/recording/save-key`,
      { s3Key },
      {
        params: { userId },
      },
    );
    return response.data.data;
  },
};

export type CodingProblemPublic = {
  problemId: string;
  title: string;
  statement: string;
  categories: string[];
  difficulty: string;
  skillTags: string[];
  starterCode: Record<string, string>;
  publicTests: Array<{
    input: string;
    expectedOutput: string;
    compareMode?: string;
  }>;
};

export const codingInterviewApi = {
  create: async (
    userId: string,
    data: CreateInterviewRequest,
  ): Promise<{ success: boolean; data: Interview }> => {
    const formData = new FormData();
    formData.append("role", data.role);
    formData.append("experience", data.experience.toString());
    formData.append("language", data.language);
    if (data.department) formData.append("department", data.department);
    if (data.discipline) formData.append("discipline", data.discipline);
    if (data.targetCompany) formData.append("targetCompany", data.targetCompany);
    if (data.useSavedResume) formData.append("useSavedResume", "true");
    if (data.resume) {
      const resumeBlob = await snapshotFileForUpload(data.resume);
      formData.append("resume", resumeBlob, data.resume.name);
    }
    const response = await apiClient.post<{ success: boolean; data: Interview }>(
      "/coding-interviews",
      formData,
      { params: { userId } },
    );
    return response.data;
  },

  listMine: async (): Promise<Interview[]> => {
    const response = await apiClient.get<{ success: boolean; data: Interview[] }>(
      "/coding-interviews/mine",
    );
    return response.data.data;
  },

  getSession: async (
    interviewId: string,
  ): Promise<{ interview: Interview; problems: CodingProblemPublic[] }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { interview: Interview; problems: CodingProblemPublic[] };
    }>(`/coding-interviews/${interviewId}/session`);
    return response.data.data;
  },

  startCoding: async (interviewId: string): Promise<Interview> => {
    const response = await apiClient.post<{ success: boolean; data: Interview }>(
      `/coding-interviews/${interviewId}/start-coding`,
    );
    return response.data.data;
  },

  run: async (
    interviewId: string,
    body: {
      problemId: string;
      language: string;
      code: string;
      visibility?: "public" | "all";
    },
  ): Promise<{
    results: Array<{
      index: number;
      passed: boolean;
      expected?: string;
      actual?: string;
      stderr?: string;
      compileOutput?: string;
      status?: string;
      error?: string;
    }>;
    passed: number;
    total: number;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { results: any[]; passed: number; total: number };
    }>(`/coding-interviews/${interviewId}/run`, body, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data.data;
  },

  submit: async (
    interviewId: string,
    body: { problemId: string; language: string; code: string },
  ): Promise<Interview> => {
    const response = await apiClient.post<{ success: boolean; data: Interview }>(
      `/coding-interviews/${interviewId}/submit`,
      body,
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data.data;
  },

  startDiscussion: async (interviewId: string): Promise<Interview> => {
    const response = await apiClient.post<{ success: boolean; data: Interview }>(
      `/coding-interviews/${interviewId}/start-discussion`,
    );
    return response.data.data;
  },

  markDone: async (interviewId: string): Promise<Interview> => {
    const response = await apiClient.post<{ success: boolean; data: Interview }>(
      `/coding-interviews/${interviewId}/mark-done`,
    );
    return response.data.data;
  },
};

export type SubscriptionActivationState =
  | "none"
  | "pending"
  | "active"
  | "failed";

export interface Subscription {
  plan: SubscriptionPlanSlug;
  status: "active" | "cancelled" | "expired";
  isExpired?: boolean;
  needsRenewal?: boolean;
  activationState?: SubscriptionActivationState;
  interviewsUsed?: number;
  interviewsLimit?: number;
  creditsAvailable?: number;
  creditsUsed?: number;
  minimumRequired?: number;
  currentPeriodEnd?: string;
  expiredPlanId?: string;
  resetDate?: string;
  autoRenew?: boolean;
  pendingPayment?: {
    plan?: SubscriptionPlanSlug;
    planDisplayName?: string;
    amount: number;
    billingCycle?: string;
    subscriptionId?: string;
    mandateAuthorizedAt?: string | null;
  } | null;
  failedPayment?: {
    plan?: SubscriptionPlanSlug;
    amount: number;
    failedAt?: string;
  } | null;
}

export interface CreditBalance {
  available: number;
  total: number;
  used: number;
}

export interface InterviewLimitCheck {
  allowed: boolean;
  reason?: string;
  isExpired?: boolean;
  creditsAvailable?: number;
  minimumRequired?: number;
  ratePerMinute?: number;
  upgradePlan?: string;
  gate?: "trial_required" | "upgrade_required" | "insufficient_credits";
  interviewsUsed?: number;
  interviewsLimit?: number;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  subscriptionId?: string;
}

export const paymentApi = {
  createOrder: async (
    plan: SelfServePlanSlug,
    billingCycle: "monthly" | "quarterly" | "yearly" = "monthly",
  ): Promise<RazorpayOrder> => {
    const response = await apiClient.post<{ data: RazorpayOrder }>(
      "/payments/create-order",
      { plan, billingCycle },
    );
    return response.data.data;
  },

  createTrialOrder: async (): Promise<RazorpayOrder> => {
    const response = await apiClient.post<{ data: RazorpayOrder }>(
      "/payments/create-trial-order",
    );
    return response.data.data;
  },

  purchaseCredits: async (creditAmount: number): Promise<RazorpayOrder> => {
    const response = await apiClient.post<{ data: RazorpayOrder }>(
      "/payments/purchase-credits",
      { creditAmount },
    );
    return response.data.data;
  },

  cancelSubscription: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>("/payments/cancel-subscription");
    return response.data;
  },

  getCreditBalance: async (): Promise<{
    total: number;
    used: number;
    available: number;
    expiring: Array<{ amount: number; expiryDate: Date }>;
  }> => {
    const response = await apiClient.get<{
      success: boolean;
      balance: {
        total: number;
        used: number;
        available: number;
        expiring: Array<{ amount: number; expiryDate: Date }>;
      };
    }>("/payments/credit-balance");
    return response.data.balance;
  },

  reactivateSubscription: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>("/payments/reactivate-subscription");
    return response.data;
  },

  verifyPayment: async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<{
    subscription: Subscription | null;
    activationStatus?: SubscriptionActivationState;
  }> => {
    const response = await apiClient.post<{
      data: {
        subscription: Subscription | null;
        activationStatus?: SubscriptionActivationState;
      };
    }>("/payments/verify", {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return response.data.data;
  },

  syncPendingSubscription: async (): Promise<Subscription | null> => {
    const response = await apiClient.post<{ data: Subscription | null }>(
      "/payments/sync-pending-subscription",
    );
    return response.data.data;
  },

  getSubscription: async (): Promise<Subscription | null> => {
    const response = await apiClient.get<{ data: Subscription | null }>(
      "/payments/subscription",
    );
    return response.data.data;
  },

  checkInterviewLimit: async (
    type: InterviewCreditType = "aiMockInterview",
  ): Promise<InterviewLimitCheck> => {
    const response = await apiClient.get<{ data: InterviewLimitCheck }>(
      "/payments/check-limit",
      { params: { type } },
    );
    return response.data.data;
  },
};

export type PlanEntitlements = {
  aiMockInterview: boolean;
  codingRound: boolean;
  systemDesign: boolean;
  behavioralMock: boolean;
  resumeDesign: boolean;
  resumeDownload: boolean;
  atsChecker: boolean;
  atsOptimizer: boolean;
  oneClickResumeOptimizer: boolean;
  detailedInterviewReport: boolean;
  ixScore: boolean;
  ixCertifiedBadge: boolean;
  growthTracking: boolean;
  targetCompanyPractice: boolean;
  advancedAiModels: boolean;
  whiteboard: boolean;
  peerInterviewBooking: boolean;
  freePeerInterviewsPerPeriod: number;
};

export type ResolvedEntitlements = {
  plan: SubscriptionPlanSlug;
  status: string;
  periodEnd?: string;
  needsRenewal: boolean;
  entitlements: PlanEntitlements;
  creditRates: {
    aiMockInterview: number;
    codingRound: number;
    systemDesign: number;
  };
  creditsAvailable: number;
  peerInterviewsRemaining: number;
  trial: {
    hasPurchased: boolean;
    canPurchase: boolean;
  };
  isFreeTier: boolean;
  hasActiveTrial: boolean;
  canPurchaseTrial: boolean;
  showTrialUpsell: boolean;
};

export const entitlementApi = {
  getEntitlements: async (): Promise<ResolvedEntitlements> => {
    const response = await apiClient.get<{ data: ResolvedEntitlements }>(
      "/entitlements",
    );
    return response.data.data;
  },
};

export type StartTrialResult = {
  periodEnd: string;
  creditsGranted: number;
  subscriptionId: string;
  entitlements: ResolvedEntitlements;
};

export const trialApi = {
  startTrial: async (): Promise<StartTrialResult> => {
    const response = await apiClient.post<{
      success: boolean;
      data: StartTrialResult;
      message: string;
    }>("/trial/start");
    return response.data.data;
  },
};

// Resume Types
export interface ResumeTemplate {
  id: string;
  name: string;
  category: "simple" | "modern" | "creative";
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  layout: {
    headerStyle: "centered" | "left" | "two-column" | "full-width";
    sectionSpacing: number;
    fontFamily: string;
    fontSize: {
      heading: number;
      subheading: number;
      body: number;
    };
  };
  atsOptimized: boolean;
}

export interface Resume {
  _id: string;
  resumeId: string;
  userId: string;
  title: string;
  templateId: string;
  content: {
    personalInfo: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
      yearsOfExperience?: string; // Years of experience (e.g., "5 years", "3+ years")
      profilePicture?: string; // S3 key for profile picture
      dateOfBirth?: string;
      nationality?: string;
      passport?: string;
      passportNo?: string;
      passportPlaceOfIssue?: string;
      passportDateOfIssue?: string;
      passportDateOfExpiry?: string;
      maritalStatus?: string;
      militaryService?: string;
      drivingLicense?: string;
      gender?: string;
      disability?: string;
      visa?: string;
      website?: string;
      medium?: string;
      orcid?: string;
      skype?: string;
      bluesky?: string;
      threads?: string;
      x?: string;
    };
    experience: Array<{
      id: string;
      company: string;
      position: string;
      location?: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description: string | string[]; // Support both HTML string and array
      achievements?: string[];
    }>;
    education: Array<{
      id: string;
      institution: string;
      degree: string;
      field?: string;
      location?: string;
      startDate: string;
      endDate?: string;
      gpa?: string;
      percentage?: string;
      honors?: string[];
    }>;
    skills?: string | string[]; // Consolidated skills field (supports both string and array)
    projects?: Array<{
      id: string;
      name: string;
      description: string;
      /** Comma-separated string or array (array for backwards compatibility) */
      technologies: string | string[];
      link?: string;
      github?: string;
      startDate?: string;
      endDate?: string;
    }>;
    achievements?: Array<{
      id: string;
      title: string;
      description: string;
      date?: string;
    }>;
    certificates?: Array<{
      id: string;
      title: string;
      issuer: string;
      issueDate?: string;
      expiryDate?: string;
      certificateId?: string;
      link?: string;
    }>;
    awards?: Array<{
      id: string;
      title: string;
      issuer: string;
      date?: string;
      description?: string;
    }>;
    interests?: string;
    references?: Array<{
      id: string;
      name: string;
      position: string;
      company: string;
      email?: string;
      phone?: string;
    }>;
    publications?: Array<{
      id: string;
      title: string;
      publisher: string;
      date?: string;
      link?: string;
    }>;
    courses?: Array<{
      id: string;
      name: string;
      institution: string;
      date?: string;
      description?: string;
    }>;
    organisations?: Array<{
      id: string;
      name: string;
      role: string;
      startDate?: string;
      endDate?: string;
      description?: string;
    }>;
    declaration?: string;
    languages?: string | Array<{ name: string; level?: number }>; // HTML, plain text, or array of objects
    customSections?: Array<{
      id: string;
      title: string;
      content: string; // HTML content
    }>;
  };
  profileSummary?: string; // Top-level field, separate from personalInfo
  sectionOrder?: Array<{
    id: string;
    type: string;
    title: string;
    visible: boolean;
    column?: "left" | "right"; // For double column layout
  }>;
  layout?: {
    type: "single" | "double";
    columnWidths?: {
      left: number;
      right: number;
    };
    padding?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    /** Blank trailing pages removed by the user in the editor preview. */
    dismissedEmptyTrailingPages?: number;
  };
  atsScore?: number;
  atsFeedback?: ATSReportV3 | LegacyATSFeedback;
  atsImprovementMeta?: {
    improvedAt: string;
    previousScore?: number;
    suppressedCheckIds: import("@/types/atsReport").ATSCheckId[];
  };
  atsIgnoredIssues?: import("@/types/atsReport").ATSIgnoredIssue[];
  atsScoringContext?: {
    rawPdfText?: string;
    lastJobDescription?: string;
  };
  isDefault?: boolean;
  pdfS3Key?: string; // S3 key for generated PDF
  thumbnailS3Key?: string; // S3 key for resume thumbnail
  createdAt: string;
  updatedAt: string;
}

export interface LegacyATSFeedback {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  details?: {
    formatting?: { score: number; issues: string[]; improvements: string[] };
    content?: { score: number; issues: string[]; improvements: string[] };
    keywords?: { score: number; issues: string[]; improvements: string[] };
    structure?: { score: number; issues: string[]; improvements: string[] };
  };
}

export interface RecalculateATSOptions {
  jobDescription?: string;
  rawPdfText?: string;
  fileMetadata?: {
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    rawTextLength?: number;
  };
}

export const resumeApi = {
  /**
   * Get All Templates
   * Uses auto-discovery template loader for seamless template management
   * No need to manually update this code when adding new templates
   */
  getTemplates: async (): Promise<ResumeTemplate[]> => {
    const { TemplateLoader } = await import("./templateLoader");
    return TemplateLoader.loadAllTemplates();
  },

  /**
   * Get Single Template
   * Loads a specific template by ID using the template loader
   */
  getTemplate: async (templateId: string): Promise<ResumeTemplate> => {
    const { TemplateLoader } = await import("./templateLoader");
    const config = await TemplateLoader.loadTemplate(templateId);
    return config.template;
  },

  create: async (
    userId: string,
    data: {
      title?: string;
      templateId: string;
      content?: Partial<Resume["content"]>;
      sectionOrder?: Resume["sectionOrder"];
      layout?: Resume["layout"];
      atsScoringContext?: Resume["atsScoringContext"];
      /** Set true for ATS checker so it does not count toward resume limit */
      forAtsCheckOnly?: boolean;
    },
  ): Promise<Resume> => {
    const response = await apiClient.post<{ data: Resume }>(
      `/users/${userId}/resumes`,
      data,
    );
    return response.data.data;
  },

  list: async (userId: string): Promise<Resume[]> => {
    const response = await apiClient.get<{ data: Resume[] }>(
      `/users/${userId}/resumes`,
    );
    return response.data.data;
  },

  checkResumeLimit: async (): Promise<{
    allowed: boolean;
    reason?: string;
    resumesCreated?: number;
    resumesLimit?: number;
  }> => {
    const response = await apiClient.get<{
      data: {
        allowed: boolean;
        reason?: string;
        resumesCreated?: number;
        resumesLimit?: number;
      };
    }>("/resume-limit");
    return response.data.data;
  },

  get: async (resumeId: string): Promise<Resume> => {
    const response = await apiClient.get<{ data: Resume }>(
      `/resumes/${resumeId}`,
    );
    return response.data.data;
  },

  update: async (
    resumeId: string,
    data: {
      title?: string;
      templateId?: string;
      content?: Partial<Resume["content"]>;
      profileSummary?: string;
      sectionOrder?: Resume["sectionOrder"];
      layout?: Resume["layout"];
      isDefault?: boolean;
      pdfS3Key?: string;
      atsScoringContext?: Resume["atsScoringContext"];
    },
  ): Promise<Resume> => {
    const response = await apiClient.put<{ data: Resume }>(
      `/resumes/${resumeId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data.data;
  },

  delete: async (resumeId: string): Promise<void> => {
    await apiClient.delete(`/resumes/${resumeId}`);
  },

  /**
   * Full duplicate: loads the source resume and creates a new one with the same
   * template, content, section order, layout, and profile summary. Avoids the
   * server-only duplicate route when it omits nested fields or runs slow side effects.
   */
  duplicate: async (resumeId: string, title?: string): Promise<Resume> => {
    const source = await resumeApi.get(resumeId);
    const userId = source.userId;

    const baseTitle = source.title?.trim() || "Resume";
    const copyTitle =
      title?.trim() ||
      (baseTitle.toLowerCase().startsWith("copy of ")
        ? baseTitle
        : `Copy of ${baseTitle}`);

    const clone = <T,>(v: T | undefined): T | undefined => {
      if (v === undefined) return undefined;
      return structuredClone(v);
    };

    let created = await resumeApi.create(userId, {
      templateId: source.templateId,
      title: copyTitle,
      content: clone(source.content) ?? {},
      sectionOrder: clone(source.sectionOrder),
      layout: clone(source.layout),
    });

    const patch: {
      profileSummary?: string;
      isDefault?: boolean;
    } = {};
    if (source.profileSummary !== undefined) {
      patch.profileSummary = source.profileSummary;
    }
    if (source.isDefault) {
      patch.isDefault = false;
    }
    if (Object.keys(patch).length > 0) {
      created = await resumeApi.update(created.resumeId, patch);
    }

    return created;
  },

  recalculateATS: async (
    resumeId: string,
    options: RecalculateATSOptions = {},
  ): Promise<Resume> => {
    const response = await apiClient.post<{ data: Resume }>(
      `/resumes/${resumeId}/ats-score`,
      options,
      {
        timeout: 180000,
      },
    );
    return response.data.data;
  },

  improveFromATS: async (
    resumeId: string,
    options: { jobDescription?: string } = {},
  ): Promise<Resume> => {
    const response = await apiClient.post<{ data: Resume }>(
      `/resumes/${resumeId}/improve-from-ats`,
      options,
      {
        timeout: 300000,
      },
    );
    return response.data.data;
  },

  /**
   * Retarget an existing resume to a job description via the section-by-section
   * tailoring pipeline. Returns tailored content WITHOUT persisting so the
   * editor can apply it as an undoable change.
   */
  tailorToJobDescription: async (
    resumeId: string,
    options: { jobDescription: string },
  ): Promise<{
    content: Resume["content"];
    profileSummary?: string;
    sectionOrder: NonNullable<Resume["sectionOrder"]>;
    jobDescription: string;
  }> => {
    const response = await apiClient.post<{
      data: {
        content: Resume["content"];
        profileSummary?: string;
        sectionOrder: NonNullable<Resume["sectionOrder"]>;
        jobDescription: string;
      };
    }>(
      `/resumes/${resumeId}/tailor-to-jd`,
      { jobDescription: trimJobDescriptionForSend(options.jobDescription) },
      { timeout: 300000 },
    );
    return response.data.data;
  },

  improveATSIssue: async (
    resumeId: string,
    body: {
      checkId: string;
      categoryLabel?: string;
      issue: import("@/types/atsReport").ATSIssue;
      userPrompt?: string;
    },
  ): Promise<{
    improvedContent: string;
    sourceContent: string;
    contentType: "bullet" | "paragraph" | "text";
  }> => {
    const response = await apiClient.post<{
      data: {
        improvedContent: string;
        sourceContent: string;
        contentType: "bullet" | "paragraph" | "text";
      };
    }>(`/resumes/${resumeId}/ats-improve-issue`, body, {
      timeout: 60000,
    });
    return response.data.data;
  },

  ignoreATSIssue: async (
    resumeId: string,
    body: {
      checkId: string;
      issue: import("@/types/atsReport").ATSIssue;
    },
  ): Promise<Resume> => {
    const response = await apiClient.post<{ data: Resume }>(
      `/resumes/${resumeId}/ats-ignore-issue`,
      body,
    );
    return response.data.data;
  },

  getPresignedUploadUrl: async (
    resumeId: string,
  ): Promise<{ uploadUrl: string; s3Key: string }> => {
    const response = await apiClient.get<{
      data: { uploadUrl: string; s3Key: string };
    }>(`/resumes/${resumeId}/pdf-upload-url`);
    return response.data.data;
  },

  confirmPDFUpload: async (
    resumeId: string,
    s3Key: string,
  ): Promise<{ downloadUrl: string; s3Key: string }> => {
    const response = await apiClient.post<{
      data: { downloadUrl: string; s3Key: string };
    }>(`/resumes/${resumeId}/confirm-pdf-upload`, { s3Key });
    return response.data.data;
  },

  downloadPDF: async (resumeId: string): Promise<string> => {
    const response = await apiClient.get<{ data: { pdfUrl: string } }>(
      `/resumes/${resumeId}/download-pdf`,
    );
    return response.data.data.pdfUrl;
  },

  generatePDF: async (
    resumeId: string,
    htmlContent: string,
    padding?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    },
    templateCSS?: string,
  ): Promise<{ downloadUrl: string; s3Key: string }> => {
    const response = await apiClient.post<{
      data: { downloadUrl: string; s3Key: string };
    }>(
      `/resumes/${resumeId}/generate-pdf`,
      {
        htmlContent,
        padding,
        templateCSS,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000, // Puppeteer + S3 can exceed 60s on cold start
      },
    );
    return response.data.data;
  },
};

// Resume Data Extraction API
export interface JDRequirements {
  jobTitle?: string;
  seniorityLevel?: string;
  requiredYears: number | null;
  preferredYears: number | null;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  education: Array<{
    level: string;
    field?: string;
    fields?: string[];
    allowRelatedFields?: boolean;
    mandatory: boolean;
  }>;
  certifications: string[];
  responsibilities: string[];
  otherRequirements: string[];
}

export interface ChatCollectedProfile {
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  profileSummary?: string;
  experience?: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    location?: string;
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: string[];
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
  }>;
  certificates?: Array<{
    title?: string;
    issuer?: string;
    issueDate?: string;
  }>;
}

export interface ResumeBuilderChatMessage {
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

export type ResumeBuilderChatMode = "bulk" | "guided" | "voice";

export interface ResumeBuilderChatSessionResponse {
  sessionId: string;
  phase: string;
  mode: ResumeBuilderChatMode | null;
  status: "active" | "ready_for_build" | "finalized";
  messages: ResumeBuilderChatMessage[];
  collectedProfile: ChatCollectedProfile;
  assistantMessage?: string;
}

export type ResumeImportBuildOptions = {
  jobDescription?: string;
  jdRequirements?: JDRequirements;
  /** When false, keep uploaded wording (structure only). Default true. */
  enhance?: boolean;
};

export const resumeDataExtractionApi = {
  analyzeJobDescription: async (
    jobDescription: string,
  ): Promise<{ requirements: JDRequirements; summary: string }> => {
    const response = await apiClient.post("/analyze-job-description", {
      jobDescription: trimJobDescriptionForSend(jobDescription),
    });
    return response.data.data;
  },

  extractResumeData: async (
    templateId: string,
    options: {
      resumeText?: string;
      chatProfile?: ChatCollectedProfile;
    } & ResumeImportBuildOptions = {},
  ): Promise<{
    sections: Record<
      string,
      {
        sectionType: string;
        content: string | any;
        format: "html" | "list" | "paragraph" | "structured";
      }
    >;
    templateId: string;
  }> => {
    const { resumeText, chatProfile, jobDescription, jdRequirements, enhance } =
      options;
    const response = await apiClient.post(
      "/extract-resume-data",
      {
        templateId,
        resumeText: resumeText || undefined,
        chatProfile: chatProfile || undefined,
        jobDescription: jobDescription
          ? trimJobDescriptionForSend(jobDescription)
          : undefined,
        jdRequirements: jdRequirements || undefined,
        enhance: enhance !== false,
      },
      {
        timeout: 180000,
      },
    );
    return response.data.data;
  },

  importLinkedInProfile: async (
    handle: string,
    templateId: string,
    options: ResumeImportBuildOptions = {},
  ): Promise<{
    sections: Record<
      string,
      {
        sectionType: string;
        content: string | any;
        format: "html" | "list" | "paragraph" | "structured";
      }
    >;
    templateId: string;
  }> => {
    const response = await apiClient.post(
      "/import-linkedin-profile",
      {
        handle,
        templateId,
        jobDescription: options.jobDescription
          ? trimJobDescriptionForSend(options.jobDescription)
          : undefined,
        jdRequirements: options.jdRequirements || undefined,
      },
      {
        timeout: 180000,
      },
    );
    return response.data.data;
  },
};

/**
 * Build the WSS URL for the Resume Builder voice agent. Auth is via the `userId`
 * query param (WS clients can't attach auth headers).
 */
export function buildResumeVoiceWsUrl(
  sessionId: string,
  userId: string,
  geminiVoice?: string,
): string {
  const baseHost = API_URL.replace(/\/api$/, "").replace(/^https?:\/\//, "");
  const wsProtocol =
    typeof globalThis !== "undefined" &&
    globalThis.location?.protocol === "https:"
      ? "wss:"
      : "ws:";
  const voiceParam = geminiVoice
    ? `&geminiVoice=${encodeURIComponent(geminiVoice)}`
    : "";
  return (
    `${wsProtocol}//${baseHost}/api/resume-builder/voice/sessions/${encodeURIComponent(sessionId)}/realtime/gemini?` +
    `userId=${encodeURIComponent(userId)}${voiceParam}`
  );
}

export const resumeBuilderChatApi = {
  createSession: async (
    templateId: string,
    mode?: ResumeBuilderChatMode,
  ): Promise<ResumeBuilderChatSessionResponse> => {
    const response = await apiClient.post("/resume-builder/chat/sessions", {
      templateId,
      mode,
    });
    return response.data.data;
  },

  getSession: async (
    sessionId: string,
  ): Promise<ResumeBuilderChatSessionResponse> => {
    const response = await apiClient.get(
      `/resume-builder/chat/sessions/${sessionId}`,
    );
    return response.data.data;
  },

  sendMessage: async (
    sessionId: string,
    content: string,
    action?: "skip" | "skip_and_build",
  ): Promise<ResumeBuilderChatSessionResponse> => {
    const response = await apiClient.post(
      `/resume-builder/chat/sessions/${sessionId}/messages`,
      { content, action },
      { timeout: 30000 },
    );
    return response.data.data;
  },

  finalizeSession: async (
    sessionId: string,
  ): Promise<{
    sessionId: string;
    status: string;
    collectedProfile: ChatCollectedProfile;
  }> => {
    const response = await apiClient.post(
      `/resume-builder/chat/sessions/${sessionId}/finalize`,
    );
    return response.data.data;
  },
};

// Content API
export const contentApi = {
  refineContent: async (
    content: string,
    contentType?: "paragraph" | "list" | "auto",
    userPrompt?: string,
  ): Promise<{
    originalContent: string;
    refinedContent: string;
    contentType: "paragraph" | "list";
    wordCount: {
      original: number;
      refined: number;
    };
  }> => {
    const response = await apiClient.post("/refine-content", {
      content,
      contentType: contentType || "auto",
      userPrompt: userPrompt?.trim() || undefined,
    });
    return response.data.data;
  },
};

// Plan API
function normalizePlansPayload(payload: unknown): any[] {
  if (payload == null || typeof payload !== "object") {
    return [];
  }
  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.data)) {
    return p.data;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
}

export const planApi = {
  getAllPlans: async (): Promise<any[]> => {
    const response = await apiClient.get("/plans");
    return normalizePlansPayload(response.data);
  },

  getPlanById: async (planId: string): Promise<any> => {
    const response = await apiClient.get<{ data: any }>(`/plans/${planId}`);
    return response.data.data;
  },
};

export interface EnterpriseSalesPayload {
  name: string;
  phone: string;
  email: string;
  organizationName: string;
  industry: string;
}

export const contactApi = {
  submitEnterpriseSales: async (
    payload: EnterpriseSalesPayload,
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      message?: string;
    }>("/contact/enterprise-sales", payload);
    return response.data;
  },
};

// Admin API (requires admin role)
export const adminApi = {
  listUsers: async (params?: {
    limit?: number;
    skip?: number;
    search?: string;
    /** Super admin: scope list to this institution */
    institutionId?: string;
  }): Promise<{ data: User[]; total: number }> => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.skip) q.set("skip", String(params.skip));
    if (params?.search) q.set("search", params.search);
    if (params?.institutionId) q.set("institutionId", params.institutionId);
    const response = await apiClient.get<{ success: boolean; data: User[]; total: number }>(
      `/admin/users?${q.toString()}`
    );
    return { data: response.data.data, total: response.data.total };
  },

  addUser: async (
    email: string,
    plan: "free" | "premium" | "enterprise",
    institutionId?: string
  ): Promise<{ invitationId: string; message: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { invitationId: string; message: string };
    }>("/admin/users", { email, plan, institutionId });
    return response.data.data;
  },

  updateUser: async (
    userId: string,
    updates: { name?: string; email?: string; institutionId?: string | null; plan?: string; accessRole?: string }
  ): Promise<User> => {
    const response = await apiClient.put<{ success: boolean; data: User }>(
      `/admin/users/${userId}`,
      updates
    );
    return response.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  /** Positive adds credits; negative removes (institution/super admin). */
  addCredits: async (
    userId: string,
    amount: number,
    description?: string
  ): Promise<{ newBalance: number }> => {
    const response = await apiClient.post<{ success: boolean; data: { newBalance: number } }>(
      `/admin/users/${userId}/credits`,
      { amount, description }
    );
    return response.data.data;
  },

  updatePlan: async (
    userId: string,
    plan: "free" | "premium" | "enterprise"
  ): Promise<User> => {
    const response = await apiClient.put<{ success: boolean; data: User }>(
      `/admin/users/${userId}/plan`,
      { plan }
    );
    return response.data.data;
  },

  getUserInterviews: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/admin/users/${userId}/interviews`
    );
    return response.data.data;
  },

  getUserResumes: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/admin/users/${userId}/resumes`
    );
    return response.data.data;
  },

  /** Presigned URL for the user’s uploaded default resume PDF (User.resume on backend). */
  getUserDefaultResumeUrl: async (
    userId: string
  ): Promise<{ url: string; filename: string; expiresIn: number }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { url: string; filename: string; expiresIn: number };
    }>(`/admin/users/${userId}/default-resume-url`);
    return response.data.data;
  },

  getResumeForAdmin: async (resumeId: string): Promise<any> => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/admin/resumes/${resumeId}`
    );
    return response.data.data;
  },

  getInterviewReport: async (interviewId: string): Promise<any> => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/admin/interviews/${interviewId}/report`
    );
    return response.data.data;
  },

  getInterviewVideoUrl: async (interviewId: string): Promise<{ videoUrl: string; expiresIn: number }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { videoUrl: string; expiresIn: number };
    }>(`/admin/interviews/${interviewId}/video-url`);
    return response.data.data;
  },

  listInstitutions: async (): Promise<any[]> => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      "/admin/institutions"
    );
    return response.data.data;
  },

  createInstitution: async (data: {
    name: string;
    slug?: string;
    domain?: string;
    contactEmail?: string;
    maxUsers?: number | null;
  }): Promise<any> => {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      "/admin/institutions",
      data
    );
    return response.data.data;
  },

  updateInstitution: async (
    institutionId: string,
    data: {
      name?: string;
      slug?: string;
      domain?: string | null;
      contactEmail?: string | null;
      maxUsers?: number | null;
    }
  ): Promise<any> => {
    const response = await apiClient.put<{ success: boolean; data: any }>(
      `/admin/institutions/${institutionId}`,
      data
    );
    return response.data.data;
  },

  deleteInstitution: async (institutionId: string): Promise<void> => {
    await apiClient.delete(`/admin/institutions/${institutionId}`);
  },

  listBatches: async (institutionId: string): Promise<any[]> => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/admin/institutions/${institutionId}/batches`
    );
    return response.data.data;
  },

  createBatch: async (institutionId: string, name: string): Promise<any> => {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/admin/institutions/${institutionId}/batches`,
      { name }
    );
    return response.data.data;
  },

  getBatch: async (batchId: string): Promise<any> => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/admin/batches/${batchId}`
    );
    return response.data.data;
  },

  /** Scores & leaderboard for interviews tied to this batch (bulk-scheduled runs). */
  getBatchPerformance: async (batchId: string): Promise<{
    memberCount: number;
    schedulesWithBatchTag: number;
    interviewsStarted: number;
    reportsCompleted: number;
    totalPassed: number;
    totalFailed: number;
    gradedWithThreshold: number;
    averageScore: number | null;
    highestScore: number | null;
    topPerformers: Array<{
      rank: number;
      clerkId: string;
      name: string | null;
      email: string | null;
      overallScore: number;
      interviewId: string;
      scheduledAt: string;
    }>;
    inProgress: Array<{
      clerkId: string;
      name: string | null;
      email: string | null;
      interviewId: string;
    }>;
  }> => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/admin/batches/${batchId}/performance`
    );
    return response.data.data;
  },

  listBatchScheduleRuns: async (
    batchId: string
  ): Promise<{
    runs: Array<{
      runId: string;
      role: string;
      scheduledAt: string;
      passingScore: number | null;
      candidateCount: number;
      createdAt: string;
      scheduleGroupId: string | null;
    }>;
  }> => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/admin/batches/${batchId}/schedule-runs`
    );
    return response.data.data;
  },

  getBatchScheduleRunDetail: async (
    batchId: string,
    runId: string
  ): Promise<{
    runId: string;
    role: string;
    scheduledAt: string;
    passingScore: number | null;
    scheduleGroupId: string | null;
    totalScheduled: number;
    interviewsStarted: number;
    reportsCompleted: number;
    totalPassed: number;
    totalFailed: number;
    gradedWithThreshold: number;
    averageScore: number | null;
    highestScore: number | null;
    topPerformers: Array<{
      rank: number;
      clerkId: string;
      name: string | null;
      email: string | null;
      overallScore: number;
      interviewId: string;
      scheduledAt: string;
    }>;
    inProgress: Array<{
      clerkId: string;
      name: string | null;
      email: string | null;
      interviewId: string;
    }>;
    participants: Array<{
      scheduleId: string;
      clerkId: string;
      name: string | null;
      email: string | null;
      status: string;
      scheduledAt: string;
      interviewId: string | null;
      overallScore: number | null;
      passed: boolean | null;
    }>;
  }> => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/admin/batches/${batchId}/schedule-runs/${encodeURIComponent(runId)}`
    );
    return response.data.data;
  },

  updateBatch: async (batchId: string, name: string): Promise<any> => {
    const response = await apiClient.put<{ success: boolean; data: any }>(
      `/admin/batches/${batchId}`,
      { name }
    );
    return response.data.data;
  },

  deleteBatch: async (batchId: string): Promise<void> => {
    await apiClient.delete(`/admin/batches/${batchId}`);
  },

  addBatchMembers: async (
    batchId: string,
    body: { emails?: string[]; clerkIds?: string[] }
  ): Promise<{ added: string[]; skipped: { email?: string; clerkId?: string; reason: string }[] }> => {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/admin/batches/${batchId}/members`,
      body
    );
    return response.data.data;
  },

  removeBatchMember: async (batchId: string, clerkId: string): Promise<any> => {
    const response = await apiClient.delete<{ success: boolean; data: any }>(
      `/admin/batches/${batchId}/members/${encodeURIComponent(clerkId)}`
    );
    return response.data.data;
  },

  bulkScheduleBatchInterviews: async (
    batchId: string,
    data: {
      scheduledAt: string;
      expiresAt?: string | null;
      role: string;
      experience: number;
      language?: "en" | "hi";
      targetCompany?: string;
      interviewDuration?: 15 | 30;
      notes?: string;
      /** One entry per question, in order; AI asks these instead of generated questions */
      customQuestions?: string[];
      /** Minimum overall score (0–100) for pass/fail on reports */
      passingScore?: number;
      /** Optional; copied to each schedule and into interview context when they start */
      jobDescription?: string;
    }
  ): Promise<{
    institutionId: string;
    total: number;
    created: number;
    failures: { clerkId: string; error: string }[];
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        institutionId: string;
        total: number;
        created: number;
        failures: { clerkId: string; error: string }[];
      };
    }>(`/admin/batches/${batchId}/schedule-interviews`, data);
    return response.data.data;
  },

  listInterviewSchedules: async (institutionId?: string): Promise<any[]> => {
    const q = institutionId
      ? `?institutionId=${encodeURIComponent(institutionId)}`
      : "";
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/admin/interview-schedules${q}`
    );
    return response.data.data;
  },

  getInstitutionDashboard: async (institutionId: string): Promise<{
    institution: Record<string, unknown> & { userCount?: number };
    userCount: number;
    planCounts: Record<string, number>;
    scheduledPending: number;
    batchCount: number;
    totalBatchMemberSlots: number;
    scheduleCounts: { scheduled: number; started: number; cancelled: number };
    creditsPool: number;
    interviewsCompleted: number;
  }> => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/admin/institutions/${institutionId}/dashboard`
    );
    return response.data.data;
  },

  /** Payments from the institution admin account (plans/credits), not candidate subscriptions. */
  getInstitutionPayments: async (
    institutionId: string,
    params?: { limit?: number; skip?: number }
  ): Promise<{ data: any[]; total: number }> => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.skip) q.set("skip", String(params.skip));
    const response = await apiClient.get<{
      success: boolean;
      data: any[];
      total: number;
    }>(`/admin/institutions/${institutionId}/payments?${q.toString()}`);
    return { data: response.data.data, total: response.data.total };
  },

  createInterviewSchedule: async (data: {
    candidateClerkId: string;
    institutionId?: string;
    scheduledAt: string;
    /** ISO datetime — latest time the candidate may start (optional) */
    expiresAt?: string;
    role: string;
    experience: number;
    language?: "en" | "hi";
    targetCompany?: string;
    interviewDuration?: 15 | 30;
    notes?: string;
    customQuestions?: string[];
    passingScore?: number;
    /** Pasted JD — passed into interview context when the candidate starts */
    jobDescription?: string;
  }): Promise<any> => {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      "/admin/interview-schedules",
      data
    );
    return response.data.data;
  },

  updateInterviewSchedule: async (
    scheduleId: string,
    data: {
      scheduledAt?: string;
      expiresAt?: string | null;
      role?: string;
      experience?: number;
      language?: "en" | "hi";
      targetCompany?: string | null;
      interviewDuration?: 15 | 30;
      notes?: string | null;
      customQuestions?: string[] | null;
      passingScore?: number | null;
      jobDescription?: string | null;
    }
  ): Promise<any> => {
    const response = await apiClient.put<{ success: boolean; data: any }>(
      `/admin/interview-schedules/${scheduleId}`,
      data
    );
    return response.data.data;
  },

  cancelInterviewSchedule: async (scheduleId: string): Promise<void> => {
    await apiClient.delete(`/admin/interview-schedules/${scheduleId}`);
  },

  invalidateClientCache: async (): Promise<{
    version: number;
    updatedAt: string;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { version: number; updatedAt: string };
    }>("/admin/client-cache/invalidate");
    return response.data.data;
  },
};

/** Scheduled interviews (candidate: list mine, start). */
export const interviewScheduleApi = {
  listMine: async (): Promise<any[]> => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      "/interview-schedules/me"
    );
    return response.data.data;
  },

  start: async (scheduleId: string): Promise<{ interviewId: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { interviewId: string };
    }>(`/interview-schedules/${scheduleId}/start`);
    return response.data.data;
  },
};

// ── Job Board (dashboard) ───────────────────────────────────────────────────

export type JobBoardWorkMode = "on_site" | "hybrid" | "remote";
export type JobBoardEmploymentFilter = "full_time" | "part_time" | "any";

/** Matches JSearch `date_posted` mapping on the server. */
export type JobBoardPostedWithin =
  | "any"
  | "today"
  | "2d"
  | "week"
  | "10d"
  | "30d";

/** JSearch `job_requirements` experience buckets (RapidAPI). */
export type JobBoardJSearchJobRequirement =
  | "no_experience"
  | "under_3_years_experience"
  | "more_than_3_years_experience";

export interface JobBoardListMeta {
  page: number;
  numPagesRequested: number;
  hasMore: boolean;
  requestId?: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: JobBoardWorkMode;
  salaryRangeLabel: string;
  ctcMinInr: number;
  ctcMaxInr: number;
  employmentType: "full_time" | "part_time";
  postedAgo: string;
  isPremium: boolean;
  earlyApplicant?: boolean;
  summary: string;
  qualifications: string[];
  responsibilities: string[];
  skills: string[];
  tools: string[];
  applyUrl: string;
  source?: "sample" | "jsearch";
  jobSite?: string;
  /** Raw JSearch job_description when present. */
  fullDescription?: string;
  jsearchHighlightSections?: { heading: string; items: string[] }[];
}

export interface JobBoardPreferences {
  _id?: string;
  clerkId: string;
  location?: string;
  workModes: JobBoardWorkMode[];
  minCtcInr: number;
  employmentType: JobBoardEmploymentFilter;
  createdAt?: string;
  updatedAt?: string;
}

export type JobBoardTabParam =
  | "for_you"
  | "search"
  | "bookmarked"
  | "applied"
  | "not_interested";

export type JobBoardStateEngagements = Record<
  string,
  {
    bookmarked: boolean;
    dismissed: boolean;
    appliedSelfReported: boolean;
    appliedAt?: string;
    conflictAcknowledged: boolean;
  }
>;

export const jobBoardApi = {
  listCatalog: async (): Promise<JobListing[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { jobs: JobListing[] };
    }>("/jobs");
    return response.data.data.jobs;
  },

  getMyPreferences: async (): Promise<JobBoardPreferences> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { preferences: JobBoardPreferences };
    }>("/users/me/job-board/preferences");
    return response.data.data.preferences;
  },

  putMyPreferences: async (body: {
    location?: string;
    workModes?: JobBoardWorkMode[];
    minCtcInr?: number;
    employmentType?: JobBoardEmploymentFilter;
  }): Promise<JobBoardPreferences> => {
    const response = await apiClient.put<{
      success: boolean;
      data: { preferences: JobBoardPreferences };
    }>("/users/me/job-board/preferences", body);
    return response.data.data.preferences;
  },

  getMyState: async (): Promise<{
    counts: { bookmarked: number; applied: number; notInterested: number };
    engagements: JobBoardStateEngagements;
  }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        counts: {
          bookmarked: number;
          applied: number;
          notInterested: number;
        };
        engagements: JobBoardStateEngagements;
      };
    }>("/users/me/job-board/state");
    return response.data.data;
  },

  getMyJobs: async (
    tab: JobBoardTabParam,
    opts?: {
      searchTerm?: string;
      postedWithin?: JobBoardPostedWithin;
      jobRequirements?: JobBoardJSearchJobRequirement;
      /** JSearch page 1–50; default 1. */
      page?: number;
      /** Hint for server `num_pages` (capped); default 10 jobs ≈ resultsWanted 10. */
      resultsWanted?: number;
    }
  ): Promise<{
    tab: string;
    jobs: JobListing[];
    preferences: JobBoardPreferences;
    listMeta?: JobBoardListMeta;
  }> => {
    const p = new URLSearchParams({ tab });
    if (opts?.searchTerm?.trim()) {
      p.set("search_term", opts.searchTerm.trim());
    }
    if (opts?.postedWithin) {
      p.set("posted_within", opts.postedWithin);
    }
    if (opts?.jobRequirements) {
      p.set("job_requirements", opts.jobRequirements);
    }
    if (typeof opts?.page === "number" && opts.page >= 1) {
      p.set("page", String(Math.min(50, Math.floor(opts.page))));
    }
    if (typeof opts?.resultsWanted === "number" && opts.resultsWanted > 0) {
      p.set("results_wanted", String(opts.resultsWanted));
    }
    const response = await apiClient.get<{
      success: boolean;
      data: {
        tab: string;
        jobs: JobListing[];
        preferences: JobBoardPreferences;
        listMeta?: JobBoardListMeta;
      };
    }>(`/users/me/job-board/jobs?${p.toString()}`);
    return response.data.data;
  },

  postEngagement: async (body: {
    jobId: string;
    action: "bookmark" | "dismiss" | "mark_applied";
    conflictAcknowledged?: boolean;
    /** Required for live API / off-catalog jobs so bookmark & dismissed tabs can render. */
    jobSnapshot?: Record<string, unknown>;
  }): Promise<{
    engagement: Record<string, unknown>;
    counts: { bookmarked: number; applied: number; notInterested: number };
    engagements: JobBoardStateEngagements;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        engagement: Record<string, unknown>;
        counts: { bookmarked: number; applied: number; notInterested: number };
        engagements: JobBoardStateEngagements;
      };
    }>("/users/me/job-board/engagement", body);
    return response.data.data;
  },
};

// ── System Design Practice ──────────────────────────────────────────────────

export type SystemDesignDifficulty = "easy" | "medium" | "hard";

export interface SystemDesignProblemSummary {
  id: string;
  title: string;
  shortTitle?: string;
  difficulty: SystemDesignDifficulty;
  category: string;
  adminRating?: number;
  askedAt?: string[];
}

export interface SystemDesignProblemDetail extends SystemDesignProblemSummary {
  scenario: string;
  coreRequirements: string[];
  scaleRequirements: string[];
  considerations: string[];
  outOfScopeFunctional?: string[];
  outOfScopeNonFunctional?: string[];
  coreEntities?: string[];
  apiHints?: string[];
  askedAt?: string[];
  analog?: string;
}

export interface SystemDesignChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SystemDesignFeedbackEntry {
  feedback: string;
  timestamp: string;
}

/** Session snapshot from Gemini at finalize (aligned to SYSTEM_DESIGN_SCORING_PLAN rubric). */
export interface SystemDesignDimensionScores {
  scopeRequirements: number;
  componentArchitecture: number;
  scalingDeepDive: number;
  tradeoffsCommunication: number;
}

export interface SystemDesignDimensionVerdicts {
  scopeRequirements?: string;
  componentArchitecture?: string;
  scalingDeepDive?: string;
  tradeoffsCommunication?: string;
}

export interface SystemDesignScoreReport {
  overallScore: number;
  dimensionScores?: SystemDesignDimensionScores;
  dimensionVerdicts?: SystemDesignDimensionVerdicts;
  /** @deprecated Legacy finalize shape */
  architectureScore?: number;
  scalabilityScore?: number;
  tradeoffsScore?: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface SystemDesignSession {
  sessionId: string;
  userId: string;
  problemId: string;
  status: "active" | "completed";
  chatHistory: SystemDesignChatMessage[];
  feedbackHistory: SystemDesignFeedbackEntry[];
  score?: number;
  scoreReport?: SystemDesignScoreReport;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  /** Why the session ended (e.g. auto-ended for candidate inactivity); null when normal. */
  endReason?: string | null;
  whiteboardSnapshot?: string | null;
  recordingPhaseStartedAt?: string | null;
  recordingS3Key?: string | null;
  recordingVideoUrl?: string | null;
  reportPdfS3Key?: string | null;
}

export interface SystemDesignPracticeReport {
  reportId: string;
  sessionId: string;
  userId: string;
  generatedAt: string;
  llmMetadata: {
    model: string;
    promptVersion?: string;
    tokens: { input: number; output: number };
    cost: number;
    generatedAt?: string;
  };
  overallScore: number;
  dimensionScores: SystemDesignDimensionScores;
  dimensionVerdicts: SystemDesignDimensionVerdicts;
  whatYouDidWell: string[];
  gapsInDesign: string[];
  approachesCovered: string[];
  approachesMissedOrWeak: string[];
  concreteRecommendations: string[];
  overallSummary: string;
  fullReportMarkdown: string;
  createdAt?: string;
  updatedAt?: string;
}
/** Session summary bundled with lazy-generated practice report payload. */
export interface SystemDesignReportSessionLite {
  sessionId: string;
  problemId: string;
  status: "completed";
  completedAt?: string;
  score?: number;
  scoreReport?: SystemDesignScoreReport;
  endReason?: string | null;
  whiteboardSnapshot?: string | null;
  recordingS3Key?: string | null;
  recordingVideoUrl?: string | null;
  reportPdfS3Key?: string | null;
}

export const systemDesignApi = {
  listProblems: async (): Promise<SystemDesignProblemSummary[]> => {
    const r = await apiClient.get<{
      success: boolean;
      data: { problems: SystemDesignProblemSummary[] };
    }>("/system-design/problems");
    return r.data.data.problems;
  },

  getProblem: async (problemId: string): Promise<SystemDesignProblemDetail> => {
    const r = await apiClient.get<{
      success: boolean;
      data: { problem: SystemDesignProblemDetail };
    }>(`/system-design/problems/${encodeURIComponent(problemId)}`);
    return r.data.data.problem;
  },

  createSession: async (problemId?: string): Promise<SystemDesignSession> => {
    const r = await apiClient.post<{
      success: boolean;
      data: { session: SystemDesignSession };
    }>("/system-design/sessions", { problemId });
    return r.data.data.session;
  },

  listMySessions: async (): Promise<SystemDesignSession[]> => {
    const r = await apiClient.get<{
      success: boolean;
      data: { sessions: SystemDesignSession[] };
    }>("/system-design/sessions/mine");
    return r.data.data.sessions;
  },

  getSession: async (sessionId: string): Promise<SystemDesignSession> => {
    const r = await apiClient.get<{
      success: boolean;
      data: { session: SystemDesignSession };
    }>(`/system-design/sessions/${sessionId}`);
    return r.data.data.session;
  },

  evaluate: async (
    sessionId: string,
    image: string,
    mimeType?: string,
  ): Promise<string> => {
    const r = await apiClient.post<{
      success: boolean;
      data: { feedback: string };
    }>(`/system-design/sessions/${sessionId}/evaluate`, {
      image,
      mimeType: mimeType ?? "image/png",
    });
    return r.data.data.feedback;
  },

  chat: async (sessionId: string, message: string): Promise<string> => {
    const r = await apiClient.post<{
      success: boolean;
      data: { reply: string };
    }>(`/system-design/sessions/${sessionId}/chat`, { message });
    return r.data.data.reply;
  },

  saveWhiteboardSnapshot: async (
    sessionId: string,
    snapshot: string,
  ): Promise<SystemDesignSession> => {
    const r = await apiClient.put<{
      success: boolean;
      data: { session: SystemDesignSession };
    }>(`/system-design/sessions/${sessionId}/whiteboard`, { snapshot });
    return r.data.data.session;
  },

  startRecordingPhase: async (
    sessionId: string,
  ): Promise<SystemDesignSession> => {
    const r = await apiClient.post<{
      success: boolean;
      data: { session: SystemDesignSession };
    }>(`/system-design/sessions/${sessionId}/recording/start`);
    return r.data.data.session;
  },

  getRecordingUploadUrl: async (
    sessionId: string,
  ): Promise<{ uploadUrl: string; s3Key: string; expiresIn: number }> => {
    const r = await apiClient.get<{
      success: boolean;
      data: { uploadUrl: string; s3Key: string; expiresIn: number };
    }>(`/system-design/sessions/${sessionId}/recording/upload-url`);
    return r.data.data;
  },

  /** Temporary presigned HTTPS URL (~1h) for browsers; plain recordingVideoUrl is not publicly readable on private buckets. */
  getRecordingPlaybackUrl: async (
    sessionId: string,
  ): Promise<{ videoUrl: string; expiresIn: number }> => {
    const r = await apiClient.get<{
      success: boolean;
      data: { videoUrl: string; expiresIn: number };
    }>(`/system-design/sessions/${sessionId}/recording/playback-url`);
    return r.data.data;
  },

  saveRecordingKey: async (
    sessionId: string,
    s3Key: string,
  ): Promise<{ s3Key: string; videoUrl: string; sessionId: string }> => {
    const r = await apiClient.post<{
      success: boolean;
      data: { s3Key: string; videoUrl: string; sessionId: string };
    }>(`/system-design/sessions/${sessionId}/recording/save-key`, { s3Key });
    return r.data.data;
  },

  finalize: async (sessionId: string): Promise<SystemDesignSession> => {
    const r = await apiClient.post<{
      success: boolean;
      data: { session: SystemDesignSession };
    }>(`/system-design/sessions/${sessionId}/finalize`);
    return r.data.data.session;
  },

  getPracticeReport: async (
    sessionId: string,
  ): Promise<{ report: SystemDesignPracticeReport; session: SystemDesignReportSessionLite }> => {
    const r = await apiClient.get<{
      success: boolean;
      data: {
        report: SystemDesignPracticeReport;
        session: SystemDesignReportSessionLite;
      };
    }>(`/system-design/sessions/${sessionId}/report`);
    return r.data.data;
  },

  getPracticeReportPdfShareUrl: async (
    sessionId: string,
  ): Promise<
    | {
        stored: true;
        shareUrl: string;
        expiresIn: number;
      }
    | { stored: false; expiresIn: number }
  > => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) throw new Error("User not authenticated");
    const response = await apiClient.get<{
      data:
        | { stored: true; shareUrl: string; expiresIn: number }
        | { stored: false; expiresIn: number };
    }>(`/system-design/sessions/${sessionId}/report/pdf-share-url`, {
      params: { userId },
    });
    return response.data.data;
  },

  getPracticeReportPdfUploadUrl: async (
    sessionId: string,
  ): Promise<{ uploadUrl: string; s3Key: string; expiresIn: number }> => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) throw new Error("User not authenticated");
    const response = await apiClient.get<{
      data: { uploadUrl: string; s3Key: string; expiresIn: number };
    }>(`/system-design/sessions/${sessionId}/report/pdf-upload-url`, {
      params: { userId },
    });
    return response.data.data;
  },

  confirmPracticeReportPdfUpload: async (
    sessionId: string,
    s3Key: string,
  ): Promise<{ downloadUrl: string; s3Key: string; expiresIn: number }> => {
    const userId = localStorage.getItem("clerk-user-id");
    if (!userId) throw new Error("User not authenticated");
    const response = await apiClient.post<{
      data: { downloadUrl: string; s3Key: string; expiresIn: number };
    }>(
      `/system-design/sessions/${sessionId}/report/confirm-pdf-upload`,
      { s3Key },
      { params: { userId } },
    );
    return response.data.data;
  },

  generatePracticeReportPdf: async (
    sessionId: string,
    htmlContent: string,
    padding?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    },
    templateCSS?: string,
  ): Promise<{ downloadUrl: string; s3Key: string }> => {
    const response = await apiClient.post<{
      data: { downloadUrl: string; s3Key: string };
    }>(
      `/system-design/sessions/${sessionId}/report/generate-pdf`,
      {
        htmlContent,
        padding,
        templateCSS,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      },
    );
    return response.data.data;
  },
};

// ============================================================================
// Peer Interview
// ============================================================================

export interface PeerInterviewType {
  _id: string;
  key: string;
  name: string;
  shortDescription: string;
  maxPriceCap: number;
  defaultDurationMins: number;
  order: number;
}

export interface PeerIndustry {
  _id: string;
  key: string;
  name: string;
  roles: string[];
  order: number;
}

export type PeerAvailability = "available" | "away" | "offline";
export type PeerInterviewerStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "blocked";

export interface PeerInterviewerProfile {
  _id: string;
  clerkId: string;
  name: string;
  jobRole: string;
  company: string;
  industry?: string;
  yearsOfExperience: number;
  workEmail: string;
  corporateIdFrontKey?: string;
  corporateIdBackKey?: string;
  canTakeTypes: string[];
  pricing: Record<string, number>;
  availabilityStatus: PeerAvailability;
  status: PeerInterviewerStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  ratingAvg: number;
  ratingCount: number;
  profilePictureUrl?: string;
  approvedAt?: string;
}

export interface PeerInterviewerCard {
  id: string;
  name: string;
  jobRole: string;
  company: string;
  industry?: string;
  yearsOfExperience: number;
  canTakeTypes: string[];
  pricing: Record<string, number>;
  availabilityStatus: PeerAvailability;
  ratingAvg: number;
  ratingCount: number;
  profilePictureUrl?: string;
  /** IANA timezone when loaded from detail endpoint */
  timezone?: string;
}

export interface PeerMeetCoHostInfo {
  email: string;
  assigned: boolean;
  error?: string;
}

export interface PeerSlot {
  id: string;
  start: string;
  end: string;
  durationMins: number;
  availableForTypes: string[];
  prices: Record<string, number>;
  videoLink?: string;
  googleMeetSpaceName?: string;
  videoLinkSource?: "google_meet_api" | "manual";
  meetCoHostEmail?: string;
  meetCoHostAssigned?: boolean;
  meetCoHost?: PeerMeetCoHostInfo;
  status: "open" | "booked" | "blocked" | "expired";
  bookingId?: string;
}

export type PeerBookingStatus =
  | "pending_acceptance"
  | "rejected"
  | "accepted_unpaid"
  | "paid_confirmed"
  | "completed"
  | "cancelled"
  | "refunded";

export interface PeerFeedback {
  rating: number;
  comments?: string;
  at?: string;
}

export type PeerChatPresence = "online" | "away" | "offline";

export type PeerChatSenderRole = "candidate" | "interviewer";

export interface PeerChatMessage {
  id: string;
  bookingId: string;
  senderClerkId: string;
  senderRole: PeerChatSenderRole;
  body: string;
  clientMessageId?: string;
  createdAt: string;
}

export interface PeerChatPartner {
  clerkId: string;
  displayName: string;
  presence: PeerChatPresence;
}

export interface PeerInterviewerCandidateScore {
  technical: number;
  behaviour: number;
  communication: number;
  overall: number;
  comments?: string;
  submittedAt?: string;
}

export interface PeerBookingCandidatePreview {
  name: string;
  email?: string;
  role?: string;
  experienceYears?: number;
  resume?: {
    url: string;
    filename: string;
    source: "uploaded" | "builder";
  };
}

export interface PeerBookingInterviewerPreview {
  name: string;
  company: string;
  jobRole?: string;
  industry?: string;
  yearsOfExperience?: number;
  ratingAvg?: number;
  ratingCount?: number;
  profilePictureUrl?: string;
}

export interface PeerBookingCancelPolicy {
  refundType: "none" | "partial" | "full";
  refundAmount: number;
  refundPercent: number;
  hoursUntilStart: number;
  message: string;
}

export interface PeerMeetArtifactsPreview {
  transcriptAvailable?: boolean;
  recordingAvailable?: boolean;
  meetRecordingS3Status?: "pending" | "complete" | "failed" | "skipped";
  fetchedAt?: string;
}

export interface PeerSessionRecording {
  s3Key?: string;
  uploadedAt?: string;
  uploadedByClerkId?: string;
  durationSec?: number;
}

export type PeerReportStatus =
  | "none"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type PeerArtifactsStatus =
  | "none"
  | "waiting"
  | "processing"
  | "complete"
  | "failed";

export interface PeerInterviewReport {
  reportId: string;
  bookingRef: string;
  interviewType: string;
  overallScore: number;
  categoryScores: {
    technical: number;
    behavioral: number;
    communication: number;
    confidence: number;
  };
  qaAnalysis: Array<{
    question: string;
    candidateAnswer: string;
    suggestedAnswer: string;
    correctnessScore: number;
    clarityScore: number;
    completenessScore: number;
    answerQuality?: "strong" | "partial" | "weak" | "avoided";
    questionType: "technical" | "behavioral" | "system-design" | "hr";
    questionDifficulty: "easy" | "medium" | "hard";
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  strengths: string[];
  improvements: string[];
  behavioral: {
    confidence: number;
    clarity: number;
    fluency: number;
    fillersPerMinute: number;
  };
  pass2Analysis?: {
    overallSummary?: string;
    topStrengths?: string[];
    topImprovements?: string[];
    communicationScore?: number;
  };
  transcriptSource?: "google_meet" | "manual" | "interviewer_score";
  createdAt?: string;
}

export interface PeerBooking {
  id: string;
  bookingRef: string;
  slotId: string;
  interviewerId: string;
  candidateId: string;
  interviewType: string;
  start: string;
  end: string;
  amount: number;
  currency: string;
  status: PeerBookingStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  videoLink?: string;
  candidateFeedback?: PeerFeedback;
  interviewerFeedback?: PeerFeedback;
  interviewerCandidateScore?: PeerInterviewerCandidateScore;
  candidateMarkedDone: boolean;
  interviewerMarkedDone: boolean;
  rescheduleCount?: number;
  googleMeetSpaceName?: string;
  meetCoHostEmail?: string;
  meetCoHostAssigned?: boolean;
  sessionRecording?: PeerSessionRecording;
  meetArtifacts?: PeerMeetArtifactsPreview;
  conferenceEndedAt?: string;
  artifactsStatus?: PeerArtifactsStatus;
  reportStatus?: PeerReportStatus;
  peerReportId?: string;
  adminPayout?: { status: string; amount?: number; decidedBy?: string; at?: string };
  refund?: { type?: string; amount?: number; status: string; reason?: string; at?: string };
  razorpayOrderId?: string;
  createdAt: string;
  // admin-enriched
  interviewerName?: string;
  interviewerCompany?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidate?: PeerBookingCandidatePreview;
  interviewer?: PeerBookingInterviewerPreview;
  viewerRole?: "candidate" | "interviewer";
  cancelPolicy?: PeerBookingCancelPolicy;
  canReschedule?: boolean;
  rescheduleBlockedReason?: string;
  earning?: PeerEarning;
}

export type PeerEarningStatus = "pending" | "approved" | "paid" | "rejected";

export interface PeerEarning {
  id: string;
  bookingId: string;
  bookingRef: string;
  interviewType: string;
  grossAmount: number;
  platformFee: number;
  platformFeePercent: number;
  amount: number;
  status: PeerEarningStatus;
  earnedAt?: string;
  paidAt?: string;
  decidedBy?: string;
  notes?: string;
  createdAt?: string;
}

export interface PeerEarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  approvedEarnings: number;
  paidOutEarnings: number;
}

export interface PeerEarningsListResponse {
  items: PeerEarning[];
  summary: PeerEarningsSummary;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PeerReassignInterviewerOption {
  _id: string;
  name: string;
  company: string;
  workEmail: string;
  industry?: string;
  jobRole?: string;
  canTakeTypes: string[];
  availabilityStatus: string;
  hasOpenSlot?: boolean;
}

export interface PeerReassignInterviewerFilters {
  industry: string;
  jobRole: string;
  interviewType: string;
  interviewTypeName: string;
  availability: "available_away" | "available" | "away" | "any";
  requireOpenSlot: boolean;
}

export interface PeerReassignInterviewerList {
  defaults: PeerReassignInterviewerFilters;
  filters: PeerReassignInterviewerFilters;
  interviewers: PeerReassignInterviewerOption[];
}

export interface PeerPaginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PeerInterviewerAnalytics {
  totalBookings: number;
  interviewsDone: number;
  cancelled: number;
  pending: number;
  totalEarnings: number;
  pendingEarnings: number;
  approvedEarnings: number;
  paidOutEarnings: number;
  ratingAvg: number;
  ratingCount: number;
  availabilityStatus: PeerAvailability;
  pendingRequests: Array<{
    id: string;
    bookingRef: string;
    interviewType: string;
    start: string;
    end: string;
    amount: number;
    status: PeerBookingStatus;
  }>;
  upcoming: Array<{
    bookingRef: string;
    interviewType: string;
    start: string;
    end: string;
    status: PeerBookingStatus;
  }>;
}

function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return p.then((r) => r.data.data);
}

export const peerApi = {
  // Catalog
  listInterviewTypes: () =>
    unwrap<PeerInterviewType[]>(apiClient.get("/peer/interview-types")),
  listIndustries: () =>
    unwrap<PeerIndustry[]>(apiClient.get("/peer/industries")),

  // Uploads (single file -> { key })
  uploadIdDocument: async (file: File): Promise<{ key: string }> => {
    const blob = await snapshotFileForUpload(file);
    const formData = new FormData();
    formData.append("file", blob, file.name);
    const r = await apiClient.post<{ data: { key: string } }>("/peer/uploads", formData);
    return r.data.data;
  },

  // Interviewer profile
  apply: (body: Record<string, unknown>) =>
    unwrap<PeerInterviewerProfile>(apiClient.post("/peer/interviewer/apply", body)),
  getMyInterviewerProfile: () =>
    unwrap<PeerInterviewerProfile | null>(apiClient.get("/peer/interviewer/me")),
  setAvailability: (status: PeerAvailability) =>
    unwrap<PeerInterviewerProfile>(
      apiClient.patch("/peer/interviewer/availability", { status }),
    ),
  setPricing: (pricing: Record<string, number>) =>
    unwrap<PeerInterviewerProfile>(
      apiClient.patch("/peer/interviewer/pricing", { pricing }),
    ),
  getAnalytics: () =>
    unwrap<PeerInterviewerAnalytics>(apiClient.get("/peer/interviewer/analytics")),
  getEarningsSummary: () =>
    unwrap<PeerEarningsSummary>(apiClient.get("/peer/interviewer/earnings/summary")),
  listEarnings: (params?: { status?: string; page?: number; pageSize?: number }) =>
    unwrap<PeerEarningsListResponse>(
      apiClient.get("/peer/interviewer/earnings", { params }),
    ),

  getTimezone: () =>
    unwrap<{ timezone: string }>(apiClient.get("/peer/me/timezone")),
  setTimezone: (timezone: string) =>
    unwrap<{ timezone: string }>(apiClient.patch("/peer/me/timezone", { timezone })),

  // Slots
  createSlot: (body: {
    start: string;
    end: string;
    availableForTypes: string[];
    videoLink?: string;
    googleMeetSpaceName?: string;
    videoLinkSource?: "google_meet_api" | "manual";
  }) => unwrap<PeerSlot>(apiClient.post("/peer/slots", body)),
  createSlotsBulk: (body: {
    slots: { start: string; end: string }[];
    availableForTypes: string[];
  }) =>
    unwrap<{
      created: PeerSlot[];
      skippedPast: number;
      skippedOverlap: number;
      skippedMeet: number;
    }>(apiClient.post("/peer/slots/bulk", body)),
  listMySlots: () => unwrap<PeerSlot[]>(apiClient.get("/peer/slots/me")),
  updateSlot: (
    id: string,
    body: {
      start: string;
      end: string;
      availableForTypes: string[];
      videoLink?: string;
      googleMeetSpaceName?: string;
      videoLinkSource?: "google_meet_api" | "manual";
    },
  ) => unwrap<PeerSlot>(apiClient.patch(`/peer/slots/${id}`, body)),
  createMeetSpace: () =>
    unwrap<{
      videoLink: string;
      googleMeetSpaceName: string;
      meetingCode: string;
      videoLinkSource: "google_meet_api";
      meetCoHost?: PeerMeetCoHostInfo;
    }>(apiClient.post("/peer/meet/create-space")),
  generateMeetLink: (slotId: string) =>
    unwrap<PeerSlot>(apiClient.post(`/peer/slots/${slotId}/generate-meet-link`)),
  deleteSlot: (id: string) =>
    unwrap<{ deleted: boolean }>(apiClient.delete(`/peer/slots/${id}`)),
  bulkDeleteSlots: (ids: string[]) =>
    unwrap<{ deleted: number; skipped: number }>(
      apiClient.post("/peer/slots/bulk-delete", { ids }),
    ),

  // Directory
  listInterviewers: (params: Record<string, unknown>) =>
    unwrap<PeerPaginated<PeerInterviewerCard>>(
      apiClient.get("/peer/interviewers", { params }),
    ),
  getInterviewer: (id: string) =>
    unwrap<{ interviewer: PeerInterviewerCard; slots: PeerSlot[] }>(
      apiClient.get(`/peer/interviewers/${id}`),
    ),

  // Bookings
  createBooking: (body: { slotId: string; interviewType: string }) =>
    unwrap<PeerBooking>(apiClient.post("/peer/bookings", body)),
  listMyBookings: () => unwrap<PeerBooking[]>(apiClient.get("/peer/bookings/me")),
  listInterviewerBookings: () =>
    unwrap<PeerBooking[]>(apiClient.get("/peer/bookings/interviewer")),
  getBooking: (id: string) =>
    unwrap<PeerBooking>(apiClient.get(`/peer/bookings/${id}`)),
  listChatMessages: (
    id: string,
    params?: { limit?: number; before?: string },
  ) =>
    unwrap<{ messages: PeerChatMessage[]; hasMore: boolean }>(
      apiClient.get(`/peer/bookings/${id}/chat/messages`, { params }),
    ),
  acceptBooking: (id: string) =>
    unwrap<PeerBooking>(apiClient.post(`/peer/bookings/${id}/accept`)),
  rejectBooking: (id: string, reason: string) =>
    unwrap<PeerBooking>(apiClient.post(`/peer/bookings/${id}/reject`, { reason })),
  cancelBooking: (id: string, reason?: string) =>
    unwrap<PeerBooking>(apiClient.post(`/peer/bookings/${id}/cancel`, { reason })),
  rescheduleBooking: (id: string, slotId: string) =>
    unwrap<PeerBooking>(apiClient.post(`/peer/bookings/${id}/reschedule`, { slotId })),
  payBooking: (id: string) =>
    unwrap<{ order: RazorpayOrder }>(apiClient.post(`/peer/bookings/${id}/pay`)),
  verifyBookingPayment: (
    id: string,
    body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) => unwrap<PeerBooking>(apiClient.post(`/peer/bookings/${id}/verify-payment`, body)),
  submitFeedback: (id: string, body: { rating: number; comments?: string }) =>
    unwrap<PeerBooking>(apiClient.post(`/peer/bookings/${id}/feedback`, body)),
  submitInterviewerCandidateScore: (
    id: string,
    body: { technical: number; behaviour: number; communication: number; comments?: string },
  ) =>
    unwrap<PeerBooking>(
      apiClient.post(`/peer/bookings/${id}/candidate-score`, body),
    ),
  markDone: (id: string) =>
    unwrap<PeerBooking>(apiClient.post(`/peer/bookings/${id}/mark-done`)),
  getRecordingUploadUrl: (id: string) =>
    unwrap<{ uploadUrl: string; s3Key: string; expiresIn: number; bookingRef: string }>(
      apiClient.get(`/peer/bookings/${id}/recording/upload-url`),
    ),
  saveRecordingKey: (id: string, body: { s3Key: string; durationSec?: number }) =>
    unwrap<PeerBooking>(apiClient.post(`/peer/bookings/${id}/recording/save-key`, body)),
  markRecordingStarted: (id: string) =>
    unwrap<{ started: boolean }>(apiClient.post(`/peer/bookings/${id}/recording/start`)),
  getRecordingVideoUrl: (id: string) =>
    unwrap<{ url: string; expiresIn: number | null; source?: string }>(
      apiClient.get(`/peer/bookings/${id}/recording/video-url`),
    ),
  getPeerReport: (id: string) =>
    unwrap<PeerInterviewReport | null>(apiClient.get(`/peer/bookings/${id}/report`)),
  generatePeerReport: (id: string) =>
    unwrap<{ report: PeerInterviewReport; generated: boolean }>(
      apiClient.post(`/peer/bookings/${id}/report/generate`),
    ),

  // Admin
  admin: {
    listInterviewers: (status?: string) =>
      unwrap<PeerInterviewerProfile[]>(
        apiClient.get("/admin/peer/interviewers", { params: status ? { status } : {} }),
      ),
    getInterviewer: (id: string) =>
      unwrap<any>(apiClient.get(`/admin/peer/interviewers/${id}`)),
    setInterviewerStatus: (
      id: string,
      action: "approve" | "reject" | "suspend" | "block" | "unblock",
      reason?: string,
    ) =>
      unwrap<PeerInterviewerProfile>(
        apiClient.post(`/admin/peer/interviewers/${id}/status`, { action, reason }),
      ),
    listBookings: (params: Record<string, unknown>) =>
      unwrap<PeerPaginated<PeerBooking>>(
        apiClient.get("/admin/peer/bookings", { params }),
      ),
    getBooking: (id: string) =>
      unwrap<any>(apiClient.get(`/admin/peer/bookings/${id}`)),
    listReassignInterviewers: (
      bookingId: string,
      params?: Partial<{
        industry: string;
        jobRole: string;
        interviewType: string;
        availability: PeerReassignInterviewerFilters["availability"];
        requireOpenSlot: boolean;
      }>,
    ) =>
      unwrap<PeerReassignInterviewerList>(
        apiClient.get(`/admin/peer/bookings/${bookingId}/reassign-interviewers`, {
          params: params
            ? {
                ...params,
                requireOpenSlot:
                  params.requireOpenSlot === undefined
                    ? undefined
                    : String(params.requireOpenSlot),
              }
            : undefined,
        }),
      ),
    decidePayout: (id: string, approve: boolean) =>
      unwrap<PeerBooking & { earning?: PeerEarning }>(
        apiClient.post(`/admin/peer/bookings/${id}/payout`, { approve }),
      ),
    markEarningPaid: (earningId: string) =>
      unwrap<PeerEarning>(apiClient.post(`/admin/peer/earnings/${earningId}/mark-paid`)),
    refund: (id: string, body: { type: "full" | "partial"; amount?: number; reason: string }) =>
      unwrap<PeerBooking>(apiClient.post(`/admin/peer/bookings/${id}/refund`, body)),
    reassign: (id: string, newSlotId: string) =>
      unwrap<PeerBooking>(apiClient.post(`/admin/peer/bookings/${id}/reassign`, { newSlotId })),
  },
};

export const ixScoreApi = {
  getSnapshot: (refresh = false) =>
    unwrap<IxScoreSnapshot>(
      apiClient.get("/ix-score", { params: refresh ? { refresh: "true" } : {} }),
    ),

  listSessions: (params?: {
    category?: IxCategoryKey | "all";
    from?: string;
    to?: string;
    minScore?: number;
    maxScore?: number;
    page?: number;
    limit?: number;
  }) =>
    unwrap<{
      rows: IxSessionRow[];
      total: number;
      page: number;
      limit: number;
    }>(apiClient.get("/ix-score/sessions", { params })),

  updateInterviewOptIns: (optIns: InterviewOptIns) =>
    unwrap<IxScoreSnapshot>(
      apiClient.put("/users/me/interview-opt-ins", optIns),
    ),

  getReportPdfUploadUrl: () =>
    unwrap<{ uploadUrl: string; s3Key: string; expiresIn: number }>(
      apiClient.get("/ix-score/report/pdf-upload-url"),
    ),

  confirmReportPdfUpload: (s3Key: string) =>
    unwrap<{ stored: true; shareUrl?: string }>(
      apiClient.post("/ix-score/report/confirm-pdf-upload", { s3Key }),
    ),

  getReportPdfShareUrl: () =>
    unwrap<
      | { stored: true; shareUrl: string; expiresIn: number }
      | { stored: false; expiresIn: number }
    >(apiClient.get("/ix-score/report/pdf-share-url")),

  generateReportPDF: (body: {
    htmlContent: string;
    candidateName?: string;
    padding?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    templateCSS?: string;
  }) =>
    unwrap<{ downloadUrl: string; s3Key: string }>(
      apiClient.post("/ix-score/report/generate-pdf", body, {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      }),
    ),
};

// ---- iX Talent (Recruiter) -------------------------------------------------

export type RecruiterStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "blocked";
export type RecruiterType = "individual" | "company";
export type HiringStatus =
  | "shortlisted"
  | "interviewing"
  | "on_hold"
  | "hired";

export interface RecruiterCompanyDocs {
  registrationCertKey?: string;
  panCardKey?: string;
  tradeCertKey?: string;
}

export interface RecruiterProfile {
  _id: string;
  clerkId: string;
  recruiterType: RecruiterType;
  firstName: string;
  lastName: string;
  recruiterRole: string;
  workEmail: string;
  companyName?: string;
  companyDocs?: RecruiterCompanyDocs;
  workIdKey?: string;
  status: RecruiterStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  reviewedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecruiterAdminView extends RecruiterProfile {
  stats: { totalHires: number; totalShortlisted: number };
  documentUrls: {
    registrationCertUrl?: string;
    panCardUrl?: string;
    tradeCertUrl?: string;
    workIdUrl?: string;
  };
}

export interface RecruiterApplyBody {
  recruiterType: RecruiterType;
  firstName: string;
  lastName: string;
  recruiterRole: string;
  workEmail: string;
  companyName?: string;
  companyDocs?: RecruiterCompanyDocs;
  workIdKey: string;
}

export interface TalentCandidateRow {
  clerkId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  industry?: string;
  industries?: string[];
  candidateStatus?: CandidateStatus | null;
  experience?: number;
  ixScore: number | null;
  hiringStatus: HiringStatus | null;
  hasResume: boolean;
}

export interface ShortlistedCandidateRow {
  clerkId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  candidateStatus?: CandidateStatus | null;
  ixScore: number | null;
  hiringStatus: HiringStatus;
  shortlistedAt: string;
  statusUpdatedAt: string;
  hasResume: boolean;
}

export interface TalentCandidateDetail {
  clerkId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  industry?: string;
  industries?: string[];
  skills?: string[];
  experience?: number;
  userType?: string;
  candidateStatus: CandidateStatus | null;
  ixScore: number | null;
  categories: Partial<Record<IxCategoryKey, IxCategorySnapshot>> | null;
  overall: IxScoreSnapshot["overall"] | null;
  communication: IxScoreSnapshot["communication"] | null;
  sessions: IxSessionRow[];
  hasResume: boolean;
  profilePictureUrl?: string | null;
  hiringStatus: HiringStatus | null;
}

export interface RecruiterDashboardStats {
  shortlisted: number;
  interviewing: number;
  on_hold: number;
  hired: number;
  total: number;
}

export interface CandidateResumeLink {
  url: string;
  filename: string;
  source: "uploaded" | "builder";
}

export const recruiterApi = {
  // Onboarding / profile
  uploadDocument: async (file: File): Promise<{ key: string }> => {
    const blob = await snapshotFileForUpload(file);
    const formData = new FormData();
    formData.append("file", blob, file.name);
    const r = await apiClient.post<{ data: { key: string } }>(
      "/recruiter/uploads",
      formData,
    );
    return r.data.data;
  },
  apply: (body: RecruiterApplyBody) =>
    unwrap<RecruiterProfile>(apiClient.post("/recruiter/apply", body)),
  getMyProfile: () =>
    unwrap<RecruiterProfile | null>(apiClient.get("/recruiter/me")),

  // Dashboard + pipeline
  getDashboard: () =>
    unwrap<RecruiterDashboardStats>(apiClient.get("/recruiter/dashboard")),
  listShortlisted: (params: {
    page?: number;
    pageSize?: number;
    hiringStatus?: string;
    q?: string;
  }) =>
    unwrap<PeerPaginated<ShortlistedCandidateRow>>(
      apiClient.get("/recruiter/shortlisted", { params }),
    ),

  // Candidate discovery
  listCandidates: (params: {
    page?: number;
    pageSize?: number;
    q?: string;
    candidateStatus?: string;
    role?: string;
    industry?: string;
    skills?: string;
    minIxScore?: number;
  }) =>
    unwrap<PeerPaginated<TalentCandidateRow>>(
      apiClient.get("/recruiter/candidates", { params }),
    ),
  getCandidate: (clerkId: string) =>
    unwrap<TalentCandidateDetail>(
      apiClient.get(`/recruiter/candidates/${clerkId}`),
    ),
  getCandidateResumeUrl: (clerkId: string) =>
    unwrap<CandidateResumeLink>(
      apiClient.get(`/recruiter/candidates/${clerkId}/resume-url`),
    ),
  getCandidateIxReport: (clerkId: string) =>
    unwrap<{
      candidate: { clerkId: string; name: string; email?: string };
      snapshot: IxScoreSnapshot;
    }>(apiClient.get(`/recruiter/candidates/${clerkId}/ix-report`)),
  listCandidateSessions: (
    clerkId: string,
    params?: {
      category?: IxCategoryKey | "all";
      from?: string;
      to?: string;
      minScore?: number;
      maxScore?: number;
      page?: number;
      limit?: number;
    },
  ) =>
    unwrap<{
      rows: IxSessionRow[];
      total: number;
      page: number;
      limit: number;
    }>(apiClient.get(`/recruiter/candidates/${clerkId}/sessions`, { params })),
  getCandidateSessionReport: (
    clerkId: string,
    sessionId: string,
    source: RecruiterSessionSource,
  ) =>
    unwrap<RecruiterSessionReportPayload>(
      apiClient.get(
        `/recruiter/candidates/${clerkId}/sessions/${sessionId}/report`,
        { params: { source } },
      ),
    ),
  getCandidateSessionVideoUrl: (
    clerkId: string,
    sessionId: string,
    source: RecruiterSessionSource,
  ) =>
    unwrap<{ videoUrl: string; expiresIn: number }>(
      apiClient.get(
        `/recruiter/candidates/${clerkId}/sessions/${sessionId}/video-url`,
        { params: { source } },
      ),
    ),
  getCandidateSessionDownloadUrl: (
    clerkId: string,
    sessionId: string,
    source: RecruiterSessionSource,
    kind: "report" | "video",
  ) =>
    unwrap<{ downloadUrl: string; filename: string; expiresIn: number }>(
      apiClient.get(
        `/recruiter/candidates/${clerkId}/sessions/${sessionId}/download-url`,
        { params: { source, kind } },
      ),
    ),

  // Pipeline mutations
  shortlist: (clerkId: string) =>
    unwrap<{ hiringStatus: HiringStatus }>(
      apiClient.post(`/recruiter/candidates/${clerkId}/shortlist`, {}),
    ),
  updateHiringStatus: (clerkId: string, hiringStatus: HiringStatus) =>
    unwrap<{ hiringStatus: HiringStatus }>(
      apiClient.patch(`/recruiter/candidates/${clerkId}/hiring-status`, {
        hiringStatus,
      }),
    ),
  removeFromShortlist: (clerkId: string) =>
    unwrap<{ removed: boolean }>(
      apiClient.delete(`/recruiter/candidates/${clerkId}/shortlist`),
    ),

  admin: {
    listRecruiters: (status?: string) =>
      unwrap<RecruiterProfile[]>(
        apiClient.get("/admin/recruiters", {
          params: status ? { status } : {},
        }),
      ),
    getRecruiter: (id: string) =>
      unwrap<RecruiterAdminView>(apiClient.get(`/admin/recruiters/${id}`)),
    setRecruiterStatus: (
      id: string,
      action: "approve" | "reject" | "suspend" | "block" | "unblock",
      reason?: string,
    ) =>
      unwrap<RecruiterProfile>(
        apiClient.post(`/admin/recruiters/${id}/status`, { action, reason }),
      ),
  },
};

// ─── Notification Hub (Super Admin) ──────────────────────────────────────────
export type NotificationChannelKey = "email" | "whatsapp";

export interface NotificationTemplate {
  _id: string;
  eventType: string;
  channel: NotificationChannelKey;
  name: string;
  subject?: string;
  content: string;
  expectedVariables: string[];
  isActive: boolean;
  emailTheme?: Partial<EmailThemeSettings>;
  useCustomEmailTheme?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailThemeSettings {
  desktopMaxWidth: number;
  mobileBreakpoint: number;
  contentPadding: number;
  mobileContentPadding: number;
  fontFamily: string;
  bodyFontSize: number;
  lineHeight: number;
  h1FontSize: number;
  h2FontSize: number;
  h3FontSize: number;
  eyebrowFontSize: number;
  footerFontSize: number;
  taglineFontSize: number;
  copyrightFontSize: number;
  brandColor: string;
  brandLightColor: string;
  bodyTextColor: string;
  mutedTextColor: string;
  backgroundColor: string;
  scaleTypographyOnMobile: boolean;
  stackButtonsOnMobile: boolean;
}

export interface NotificationConfig {
  _id: string;
  configKey: string;
  adminEmails: string[];
  alertToggles: {
    checkoutFailures: boolean;
    contactForm: boolean;
  };
  channelToggles: {
    email: boolean;
    whatsapp: boolean;
  };
  emailTheme?: Partial<EmailThemeSettings>;
}

export interface UpdateNotificationTemplateInput {
  name?: string;
  subject?: string;
  content?: string;
  expectedVariables?: string[];
  isActive?: boolean;
  emailTheme?: Partial<EmailThemeSettings>;
  useCustomEmailTheme?: boolean;
}

export interface UpdateNotificationConfigInput {
  adminEmails?: string[];
  alertToggles?: Partial<NotificationConfig["alertToggles"]>;
  channelToggles?: Partial<NotificationConfig["channelToggles"]>;
  emailTheme?: Partial<EmailThemeSettings>;
}

export interface TemplatePreviewResult {
  subject: string;
  html: string;
  variables: Record<string, string>;
}

export interface SendTestTemplateResult {
  subject: string;
  sentTo: string;
}

export interface AdminSystemDesignLevelExpectations {
  mid?: string;
  senior?: string;
  staff?: string;
}

export interface AdminSystemDesignProblemStats {
  attemptCount: number;
  completedCount: number;
  averageScore: number | null;
}

export interface AdminSystemDesignProblemListItem {
  problemId: string;
  title: string;
  shortTitle: string;
  category: string;
  difficulty: SystemDesignDifficulty;
  askedAt: string[];
  adminRating?: number;
  sortOrder: number;
  isActive: boolean;
  attemptCount: number;
  completedCount: number;
  averageScore: number | null;
  updatedAt: string;
}

export interface AdminSystemDesignProblemDetail {
  problemId: string;
  knowledgeDocId: string;
  legacyAliases: string[];
  title: string;
  shortTitle: string;
  analog?: string;
  category: string;
  difficulty: SystemDesignDifficulty;
  askedAt: string[];
  scenario: string;
  descriptionHtml?: string;
  coreRequirements: string[];
  outOfScopeFunctional: string[];
  scaleRequirements: string[];
  outOfScopeNonFunctional: string[];
  coreEntities: string[];
  apiHints: string[];
  considerations: string[];
  levelExpectations: AdminSystemDesignLevelExpectations;
  sourcePath: string;
  contentHash: string;
  corpusVersion: string;
  adminRating?: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: AdminSystemDesignProblemStats;
}

export interface AdminSystemDesignProblemListResponse {
  items: AdminSystemDesignProblemListItem[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalActive: number;
    totalAttempts: number;
    avgCompletionRate: number | null;
    avgScore: number | null;
  };
}

export interface AdminSystemDesignProblemUpsertBody {
  problemId?: string;
  knowledgeDocId?: string;
  legacyAliases?: string[];
  title: string;
  shortTitle: string;
  analog?: string;
  category: string;
  difficulty: SystemDesignDifficulty;
  askedAt?: string[];
  scenario: string;
  descriptionHtml?: string;
  coreRequirements?: string[];
  outOfScopeFunctional?: string[];
  scaleRequirements?: string[];
  outOfScopeNonFunctional?: string[];
  coreEntities?: string[];
  apiHints?: string[];
  considerations?: string[];
  levelExpectations?: AdminSystemDesignLevelExpectations;
  adminRating?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminSystemDesignProblemListQuery {
  search?: string;
  category?: string;
  difficulty?: SystemDesignDifficulty;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "title" | "attemptCount" | "averageScore" | "adminRating" | "updatedAt";
  sortDir?: "asc" | "desc";
}

export const adminSystemDesignApi = {
  list: (params?: AdminSystemDesignProblemListQuery) =>
    unwrap<AdminSystemDesignProblemListResponse>(
      apiClient.get("/admin/system-design-problems", { params }),
    ),
  get: (problemId: string) =>
    unwrap<AdminSystemDesignProblemDetail>(
      apiClient.get(`/admin/system-design-problems/${encodeURIComponent(problemId)}`),
    ),
  create: (body: AdminSystemDesignProblemUpsertBody) =>
    unwrap<AdminSystemDesignProblemDetail>(
      apiClient.post("/admin/system-design-problems", body),
    ),
  update: (problemId: string, body: AdminSystemDesignProblemUpsertBody) =>
    unwrap<AdminSystemDesignProblemDetail>(
      apiClient.put(
        `/admin/system-design-problems/${encodeURIComponent(problemId)}`,
        body,
      ),
    ),
  remove: (problemId: string) =>
    unwrap<void>(
      apiClient.delete(
        `/admin/system-design-problems/${encodeURIComponent(problemId)}`,
      ),
    ),
  restore: (problemId: string) =>
    unwrap<AdminSystemDesignProblemDetail>(
      apiClient.post(
        `/admin/system-design-problems/${encodeURIComponent(problemId)}/restore`,
      ),
    ),
  listCategories: () =>
    unwrap<{ categories: string[] }>(
      apiClient.get("/admin/system-design-problems/categories"),
    ).then((r) => r.categories ?? []),
};

export type CodingDifficulty = "easy" | "medium" | "hard";
export type CodingLanguage = "javascript" | "java" | "c" | "cpp" | "python";
export type CompanyTierTag =
  | "FAANG"
  | "TIER1"
  | "TIER2"
  | "STARTUP"
  | "SERVICE";

export interface AdminCodingTestCase {
  input: string;
  expectedOutput: string;
  compareMode?: "exact" | "trim";
}

export interface AdminCodingProblemStats {
  attemptCount: number;
  averageSubmitScore: number | null;
}

export interface AdminCodingProblemListItem {
  problemId: string;
  title: string;
  categories: string[];
  difficulty: CodingDifficulty;
  companyTierTags: CompanyTierTag[];
  publicTestCount: number;
  hiddenTestCount: number;
  isActive: boolean;
  attemptCount: number;
  averageSubmitScore: number | null;
  updatedAt: string;
}

export interface AdminCodingFunctionCase {
  inputs: Record<string, unknown>;
  expectedOutput: string;
}

export interface AdminCodingSnippetMeta {
  entryPoint: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
  outputParam?: string;
  outputSlice?: { param: string; lengthExpr: string };
  publicCases: AdminCodingFunctionCase[];
  hiddenCases: AdminCodingFunctionCase[];
}

export interface AdminCodingDesignCase {
  operations: string[];
  args: unknown[][];
  expectedOutput: string;
}

export interface AdminCodingDesignMeta {
  className: string;
  constructorParams?: Array<{ name: string; type: string }>;
  methods: Array<{
    name: string;
    params: Array<{ name: string; type: string }>;
    returnType: string;
  }>;
  publicCases: AdminCodingDesignCase[];
  hiddenCases: AdminCodingDesignCase[];
}

export interface AdminCodingProblemDetail {
  problemId: string;
  title: string;
  statement: string;
  categories: string[];
  difficulty: CodingDifficulty;
  companyTierTags: CompanyTierTag[];
  skillTags: string[];
  starterCode: Partial<Record<CodingLanguage, string>>;
  referenceSolution: Partial<Record<CodingLanguage, string>>;
  publicTests: AdminCodingTestCase[];
  hiddenTests: AdminCodingTestCase[];
  executionMode?: "stdin" | "snippet";
  snippetMeta?: AdminCodingSnippetMeta;
  designMeta?: AdminCodingDesignMeta;
  timeLimitMs?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: AdminCodingProblemStats;
}

export interface AdminCodingProblemListResponse {
  items: AdminCodingProblemListItem[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalActive: number;
    totalAttempts: number;
  };
}

export interface AdminCodingProblemUpsertBody {
  problemId?: string;
  title: string;
  statement: string;
  categories?: string[];
  difficulty: CodingDifficulty;
  companyTierTags?: CompanyTierTag[];
  skillTags?: string[];
  starterCode?: Partial<Record<CodingLanguage, string>>;
  referenceSolution?: Partial<Record<CodingLanguage, string>>;
  publicTests?: AdminCodingTestCase[];
  hiddenTests?: AdminCodingTestCase[];
  executionMode?: "stdin" | "snippet";
  snippetMeta?: AdminCodingSnippetMeta;
  designMeta?: AdminCodingDesignMeta;
  timeLimitMs?: number;
  isActive?: boolean;
}

export interface AdminCodingProblemListQuery {
  search?: string;
  category?: string;
  difficulty?: CodingDifficulty;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "title" | "attemptCount" | "averageSubmitScore" | "updatedAt";
  sortDir?: "asc" | "desc";
}

export interface AdminCodingValidateTestsBody {
  language: CodingLanguage;
  code?: string;
  visibility?: "public" | "hidden" | "all";
}

export interface AdminCodingValidateTestsResult {
  passed: number;
  total: number;
  results: Array<{
    index: number;
    passed: boolean;
    expected?: string;
    actual?: string;
    stderr?: string;
    compileOutput?: string;
    status?: string;
    error?: string;
    visibility: "public" | "hidden";
    inputs?: Array<{ name: string; value: string }>;
  }>;
}

export interface AdminCodingStarterTemplateItem {
  id: string;
  label: string;
  starters: Partial<Record<CodingLanguage, string>>;
}

export const adminCodingProblemApi = {
  list: (params?: AdminCodingProblemListQuery) =>
    unwrap<AdminCodingProblemListResponse>(
      apiClient.get("/admin/coding-problems", { params }),
    ),
  get: (problemId: string) =>
    unwrap<AdminCodingProblemDetail>(
      apiClient.get(`/admin/coding-problems/${encodeURIComponent(problemId)}`),
    ),
  create: (body: AdminCodingProblemUpsertBody) =>
    unwrap<AdminCodingProblemDetail>(
      apiClient.post("/admin/coding-problems", body),
    ),
  update: (problemId: string, body: AdminCodingProblemUpsertBody) =>
    unwrap<AdminCodingProblemDetail>(
      apiClient.put(
        `/admin/coding-problems/${encodeURIComponent(problemId)}`,
        body,
      ),
    ),
  remove: (problemId: string) =>
    unwrap<void>(
      apiClient.delete(
        `/admin/coding-problems/${encodeURIComponent(problemId)}`,
      ),
    ),
  restore: (problemId: string) =>
    unwrap<AdminCodingProblemDetail>(
      apiClient.post(
        `/admin/coding-problems/${encodeURIComponent(problemId)}/restore`,
      ),
    ),
  listCategories: () =>
    unwrap<{ categories: string[] }>(
      apiClient.get("/admin/coding-problems/categories"),
    ).then((r) => r.categories ?? []),
  listStarterTemplates: () =>
    unwrap<{ templates: AdminCodingStarterTemplateItem[] }>(
      apiClient.get("/admin/coding-problems/starter-templates"),
    ).then((r) => r.templates ?? []),
  validateTests: (problemId: string, body: AdminCodingValidateTestsBody) =>
    unwrap<AdminCodingValidateTestsResult>(
      apiClient.post(
        `/admin/coding-problems/${encodeURIComponent(problemId)}/validate-tests`,
        body,
      ),
    ),
};

// --- Blog CMS ---

export type BlogStatus = "draft" | "published" | "archived";

export interface AdminBlogListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string;
  categories: string[];
  status: BlogStatus;
  authorName: string;
  publishedAt: string | null;
  readingTimeMinutes: number;
  isActive: boolean;
  updatedAt: string;
}

export interface AdminBlogDetail extends AdminBlogListItem {
  content: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string[];
  canonicalUrl: string;
  authorId: string;
  createdAt: string;
}

export interface AdminBlogListResponse {
  items: AdminBlogListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminBlogUpsertBody {
  slug?: string;
  title: string;
  excerpt?: string;
  content?: string;
  thumbnailUrl?: string;
  categories?: string[];
  status?: BlogStatus;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  keywords?: string[];
  canonicalUrl?: string;
}

export interface AdminBlogListQuery {
  search?: string;
  category?: string;
  status?: BlogStatus;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "title" | "publishedAt" | "updatedAt";
  sortDir?: "asc" | "desc";
}

export interface PublicBlogListItem {
  slug: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string;
  categories: string[];
  authorName: string;
  publishedAt: string;
  readingTimeMinutes: number;
  updatedAt: string;
}

export interface PublicBlogDetail extends PublicBlogListItem {
  content: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string[];
  canonicalUrl: string;
}

export interface PublicBlogListResponse {
  items: PublicBlogListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BlogImageUploadBody {
  filename: string;
  contentType: string;
}

export interface BlogImageUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  s3Key: string;
}

export const adminBlogApi = {
  list: (params?: AdminBlogListQuery) =>
    unwrap<AdminBlogListResponse>(apiClient.get("/admin/blogs", { params })),
  get: (blogId: string) =>
    unwrap<AdminBlogDetail>(
      apiClient.get(`/admin/blogs/${encodeURIComponent(blogId)}`),
    ),
  create: (body: AdminBlogUpsertBody) =>
    unwrap<AdminBlogDetail>(apiClient.post("/admin/blogs", body)),
  update: (blogId: string, body: AdminBlogUpsertBody) =>
    unwrap<AdminBlogDetail>(
      apiClient.put(`/admin/blogs/${encodeURIComponent(blogId)}`, body),
    ),
  remove: (blogId: string) =>
    unwrap<void>(apiClient.delete(`/admin/blogs/${encodeURIComponent(blogId)}`)),
  restore: (blogId: string) =>
    unwrap<AdminBlogDetail>(
      apiClient.post(`/admin/blogs/${encodeURIComponent(blogId)}/restore`),
    ),
  publish: (blogId: string) =>
    unwrap<AdminBlogDetail>(
      apiClient.post(`/admin/blogs/${encodeURIComponent(blogId)}/publish`),
    ),
  listCategories: () =>
    unwrap<{ categories: string[] }>(
      apiClient.get("/admin/blogs/categories"),
    ).then((r) => r.categories ?? []),
  getUploadUrl: (body: BlogImageUploadBody) =>
    unwrap<BlogImageUploadResponse>(
      apiClient.post("/admin/blogs/upload-image", body),
    ),
  uploadImage: async (file: File): Promise<{ publicUrl: string; s3Key: string }> => {
    const blob = await snapshotImageForUpload(file);
    const formData = new FormData();
    formData.append("file", blob, file.name);
    return unwrap<{ publicUrl: string; s3Key: string }>(
      apiClient.post("/admin/blogs/upload-image", formData),
    );
  },
};

export const blogApi = {
  list: (params?: { page?: number; limit?: number; category?: string }) =>
    unwrap<PublicBlogListResponse>(apiClient.get("/blogs", { params })),
  getBySlug: (slug: string) =>
    unwrap<PublicBlogDetail>(
      apiClient.get(`/blogs/${encodeURIComponent(slug)}`),
    ),
  listCategories: () =>
    unwrap<{ categories: string[] }>(apiClient.get("/blogs/categories")).then(
      (r) => r.categories ?? [],
    ),
};

export const notificationAdminApi = {
  listTemplates: (channel?: NotificationChannelKey) =>
    unwrap<NotificationTemplate[]>(
      apiClient.get("/admin/notifications/templates", {
        params: channel ? { channel } : {},
      }),
    ),
  getTemplate: (id: string) =>
    unwrap<NotificationTemplate>(
      apiClient.get(`/admin/notifications/templates/${id}`),
    ),
  updateTemplate: (id: string, input: UpdateNotificationTemplateInput) =>
    unwrap<NotificationTemplate>(
      apiClient.put(`/admin/notifications/templates/${id}`, input),
    ),
  previewTemplate: (
    id: string,
    input: Pick<
      UpdateNotificationTemplateInput,
      "subject" | "content" | "emailTheme" | "useCustomEmailTheme"
    > & { variables?: Record<string, string> },
  ) =>
    unwrap<TemplatePreviewResult>(
      apiClient.post(`/admin/notifications/templates/${id}/preview`, input),
    ),
  getTemplateSampleVariables: (id: string) =>
    unwrap<Record<string, string>>(
      apiClient.get(`/admin/notifications/templates/${id}/sample-variables`),
    ),
  sendTestTemplate: (
    id: string,
    input: Pick<
      UpdateNotificationTemplateInput,
      "subject" | "content" | "emailTheme" | "useCustomEmailTheme"
    > & {
      to: string;
      variables?: Record<string, string>;
    },
  ) =>
    unwrap<SendTestTemplateResult>(
      apiClient.post(`/admin/notifications/templates/${id}/send-test`, input),
    ),
  getConfig: () =>
    unwrap<NotificationConfig>(apiClient.get("/admin/notifications/config")),
  updateConfig: (input: UpdateNotificationConfigInput) =>
    unwrap<NotificationConfig>(
      apiClient.put("/admin/notifications/config", input),
    ),
};

export default apiClient;

export const configApi = {
  getClientCacheVersion: async (): Promise<{
    version: number;
    updatedAt: string;
  }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { version: number; updatedAt: string };
    }>("/config/client-cache");
    return response.data.data;
  },
};
