import axios, {
  AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

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

// Token getter - set by AuthTokenProvider for JWT verification on backend
let tokenGetter: (() => Promise<string | null>) | null = null;
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
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
        window.location.href = "/sign-in";
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
  onboardingCompleted?: boolean;
  userType?: "student" | "fresher" | "experienced";
  experience?: number;
  currentJob?: {
    company: string;
    role: string;
    industry: string;
  };
  industries?: string[];
  resume?: {
    s3Key: string;
    filename: string;
    uploadedAt: string;
    size: number;
  };
  subscription?: {
    plan: "free" | "premium" | "enterprise";
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
}

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
    /** When true (e.g. institute admin), denying screen capture may block the session. */
    requireSessionRecording?: boolean;
  };
  session?: {
    s3VideoKey?: string;
    videoUrl?: string;
    duration?: number;
    startedAt?: string;
    endedAt?: string;
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
  /** Set after PDF is uploaded for sharing */
  reportPdfS3Key?: string;
  createdAt: string;
  updatedAt: string;
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

  getProfile: async (userId: string): Promise<User> => {
    const response = await apiClient.get<{ data: User }>(`/users/${userId}`);
    return response.data.data;
  },

  getMyProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ data: User }>("/users/me/profile");
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
    currentJob?: {
      company: string;
      role: string;
      industry: string;
    };
    industries?: string[];
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
    currentJob?: {
      company: string;
      role: string;
      industry: string;
    };
    industries?: string[];
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

  closeAsFailed: async (interviewId: string): Promise<void> => {
    await apiClient.post(`/interviews/${interviewId}/close-failed`);
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

export interface Subscription {
    plan: "free" | "premium" | "enterprise";
  status: "active" | "cancelled" | "expired";
  interviewsUsed?: number; // Deprecated: now using credits
  interviewsLimit?: number; // Deprecated: now using credits
  creditsAvailable?: number; // New: credit-based system
  creditsUsed?: number; // New: credit-based system
  minimumRequired?: number; // New: minimum credits to start interview
  currentPeriodEnd?: string;
  resetDate?: string;
  autoRenew?: boolean;
}

export interface CreditBalance {
  available: number;
  total: number;
  used: number;
}

export interface InterviewLimitCheck {
  allowed: boolean;
  reason?: string;
  creditsAvailable?: number; // New: credit-based system
  minimumRequired?: number; // New: minimum credits required
  interviewsUsed?: number; // Deprecated
  interviewsLimit?: number; // Deprecated
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
    plan: "premium",
    billingCycle: "monthly" | "quarterly" | "yearly" = "monthly",
  ): Promise<RazorpayOrder> => {
    const response = await apiClient.post<{ data: RazorpayOrder }>(
      "/payments/create-order",
      { plan, billingCycle },
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
  ): Promise<{ subscription: Subscription | null }> => {
    const response = await apiClient.post<{
      data: { subscription: Subscription | null };
    }>("/payments/verify", {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return response.data.data;
  },

  getSubscription: async (): Promise<Subscription | null> => {
    const response = await apiClient.get<{ data: Subscription | null }>(
      "/payments/subscription",
    );
    return response.data.data;
  },

  checkInterviewLimit: async (): Promise<InterviewLimitCheck> => {
    const response = await apiClient.get<{ data: InterviewLimitCheck }>(
      "/payments/check-limit",
    );
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
  };
  atsScore?: number;
  atsFeedback?: {
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
  };
  isDefault?: boolean;
  pdfS3Key?: string; // S3 key for generated PDF
  thumbnailS3Key?: string; // S3 key for resume thumbnail
  createdAt: string;
  updatedAt: string;
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

  recalculateATS: async (resumeId: string): Promise<Resume> => {
    const response = await apiClient.post<{ data: Resume }>(
      `/resumes/${resumeId}/ats-score`,
      {},
      {
        timeout: 180000, // 3 minutes (180 seconds) for ATS score calculation
      },
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
export const resumeDataExtractionApi = {
  extractResumeData: async (
    templateId: string,
    resumeText?: string,
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
      "/extract-resume-data",
      {
        templateId,
        resumeText: resumeText || undefined,
      },
      {
        timeout: 180000, // 180 seconds (3 minutes) for AI extraction
      },
    );
    return response.data.data;
  },
};

// Content API
export const contentApi = {
  refineContent: async (
    content: string,
    contentType?: "paragraph" | "list" | "auto",
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
  }): Promise<{ data: User[]; total: number }> => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.skip) q.set("skip", String(params.skip));
    if (params?.search) q.set("search", params.search);
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
  }): Promise<any> => {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      "/admin/institutions",
      data
    );
    return response.data.data;
  },
};

export default apiClient;
