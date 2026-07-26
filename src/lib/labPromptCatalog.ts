import type { PromptRecord } from "@/lib/runtimeApi";

/** How this prompt is exercised in production. */
export type PromptKind = "voice" | "execute" | "profile";

export type PromptCategoryId =
  | "live-voice"
  | "coding-voice"
  | "profiles"
  | "reports"
  | "transcript"
  | "ats"
  | "resume"
  | "system-design";

export type PromptClassification = {
  kind: PromptKind;
  category: PromptCategoryId;
  /** Human label for the category group in the sidebar */
  categoryLabel: string;
  shortLabel: string;
  description: string;
  needsProfileRef: boolean;
  supportsVoiceTest: boolean;
  supportsExecuteTest: boolean;
  executeReturnsJson: boolean;
  /** When true, best preview uses interviewer-system + this profile as profileRef */
  previewViaLiveWrapper: boolean;
};

export type LabCategory = {
  id: PromptCategoryId;
  label: string;
  description: string;
  /** Lucide icon name hint — resolved in component */
  icon: "mic" | "code" | "layers" | "bar-chart" | "file-text" | "briefcase" | "network" | "message";
};

export const LAB_CATEGORIES: LabCategory[] = [
  {
    id: "live-voice",
    label: "Live interview",
    description: "Real-time voice sessions — composed with a department profile + RAG body.",
    icon: "mic",
  },
  {
    id: "coding-voice",
    label: "Coding discussion",
    description: "Post-coding voice walkthrough of submissions.",
    icon: "code",
  },
  {
    id: "profiles",
    label: "Department profiles",
    description: "Domain preamble injected via profileRef (not run standalone).",
    icon: "layers",
  },
  {
    id: "reports",
    label: "Interview reports",
    description: "Post-interview analysis — one-shot LLM execute per call.",
    icon: "bar-chart",
  },
  {
    id: "transcript",
    label: "Transcript",
    description: "Normalize Q/A pairs to English JSON.",
    icon: "message",
  },
  {
    id: "ats",
    label: "ATS scoring",
    description: "Resume extract + feedback — batch text LLM.",
    icon: "briefcase",
  },
  {
    id: "resume",
    label: "Resume builder",
    description: "Parse, extract, and refine resume sections.",
    icon: "file-text",
  },
  {
    id: "system-design",
    label: "System design",
    description: "Chat, diagram review, scoring, reports, and voice practice.",
    icon: "network",
  },
];

const KIND_LABELS: Record<PromptKind, string> = {
  voice: "Live",
  execute: "Batch",
  profile: "Profile",
};

/** Sidebar groups — agent-type first, not product surface. */
export const AGENT_TYPE_GROUPS: {
  kind: PromptKind;
  label: string;
  description: string;
}[] = [
  { kind: "voice", label: "Live agents", description: "Real-time voice sessions" },
  { kind: "execute", label: "Batch agents", description: "One-shot text / JSON LLM" },
  { kind: "profile", label: "Profiles", description: "Composed into live agents" },
];

const KIND_DESCRIPTIONS: Record<PromptKind, string> = {
  voice: "Session + WebSocket — test with mic in lab or full interview UI.",
  execute: "One-shot POST /v1/execute — text/JSON LLM, no voice.",
  profile: "Composed into a voice wrapper via profileRef — preview with Render.",
};

/** Static overrides — seed tags + names are the source of truth in Mongo. */
const PROMPT_OVERRIDES: Record<string, Partial<PromptClassification>> = {
  "interviewer-system": {
    kind: "voice",
    category: "live-voice",
    categoryLabel: "Live interview",
    shortLabel: "Main interviewer",
    description: "Voice wrapper: profileContent + interviewerBody + session vars.",
    needsProfileRef: true,
    supportsVoiceTest: true,
    supportsExecuteTest: false,
    executeReturnsJson: false,
    previewViaLiveWrapper: false,
  },
  "interviewer-coding-discussion": {
    kind: "voice",
    category: "coding-voice",
    categoryLabel: "Coding discussion",
    shortLabel: "Coding discussion",
    description: "Voice session after coding round — problem blocks in interviewerBody.",
    needsProfileRef: false,
    supportsVoiceTest: true,
    supportsExecuteTest: false,
    executeReturnsJson: false,
    previewViaLiveWrapper: false,
  },
  "system-design-voice": {
    kind: "voice",
    category: "system-design",
    categoryLabel: "System design",
    shortLabel: "SD voice",
    description: "System design practice interviewer (voice).",
    needsProfileRef: false,
    supportsVoiceTest: true,
    supportsExecuteTest: false,
    executeReturnsJson: false,
    previewViaLiveWrapper: false,
  },
  "system-design-diagram-review": {
    kind: "execute",
    category: "system-design",
    categoryLabel: "System design",
    shortLabel: "Diagram review",
    description: "Vision + text feedback — execute in prod with image; lab runs text-only.",
    needsProfileRef: false,
    supportsVoiceTest: false,
    supportsExecuteTest: true,
    executeReturnsJson: false,
    previewViaLiveWrapper: false,
  },
};

function inferCategory(name: string, tags: string[]): PromptCategoryId {
  if (name.startsWith("profile-")) return "profiles";
  if (name === "interviewer-system") return "live-voice";
  if (name === "interviewer-coding-discussion") return "coding-voice";
  if (name.startsWith("report-")) return "reports";
  if (name === "transcript-normalize") return "transcript";
  if (name.startsWith("ats-")) return "ats";
  if (name.startsWith("resume-")) return "resume";
  if (name.startsWith("system-design-")) return "system-design";
  if (tags.includes("voice")) return "live-voice";
  if (tags.includes("report")) return "reports";
  if (tags.includes("ats")) return "ats";
  if (tags.includes("resume")) return "resume";
  if (tags.includes("system-design")) return "system-design";
  return "reports";
}

function inferKind(name: string, tags: string[]): PromptKind {
  if (name.startsWith("profile-")) return "profile";
  if (tags.includes("voice") || name === "interviewer-system" || name === "interviewer-coding-discussion") {
    return "voice";
  }
  return "execute";
}

export function classifyPrompt(prompt: PromptRecord): PromptClassification {
  const tags = prompt.tags ?? [];
  const override = PROMPT_OVERRIDES[prompt.name];

  const category = override?.category ?? inferCategory(prompt.name, tags);
  const kind = override?.kind ?? inferKind(prompt.name, tags);
  const catMeta = LAB_CATEGORIES.find((c) => c.id === category)!;
  const isVoice = kind === "voice";
  const isProfile = kind === "profile";
  const jsonExecute =
    tags.includes("report") ||
    prompt.name.includes("scoring") ||
    prompt.name.includes("transcript") ||
    (prompt.name.includes("extract") && prompt.name.startsWith("ats-"));

  return {
    kind,
    category,
    categoryLabel: override?.categoryLabel ?? catMeta.label,
    shortLabel:
      override?.shortLabel ??
      prompt.description?.split("—")[0]?.trim() ??
      prompt.name,
    description:
      override?.description ?? prompt.description ?? catMeta.description,
    needsProfileRef:
      override?.needsProfileRef ?? prompt.name === "interviewer-system",
    supportsVoiceTest: override?.supportsVoiceTest ?? isVoice,
    supportsExecuteTest:
      override?.supportsExecuteTest ?? (!isVoice && !isProfile),
    executeReturnsJson: override?.executeReturnsJson ?? jsonExecute,
    previewViaLiveWrapper:
      override?.previewViaLiveWrapper ?? prompt.name.startsWith("profile-"),
  };
}

export function getKindLabel(kind: PromptKind): string {
  return KIND_LABELS[kind];
}

/** Human-facing agent name for the lab UI (backend `name` unchanged). */
export function getAgentDisplayName(
  name: string,
  meta?: Pick<PromptClassification, "shortLabel">,
): string {
  if (meta?.shortLabel) return meta.shortLabel;
  if (name.startsWith("profile-")) {
    return name
      .slice("profile-".length)
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Two-letter initials for agent list avatars. */
export function getAgentInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

export function groupAgentsByKind(
  prompts: PromptRecord[],
): Map<PromptKind, PromptRecord[]> {
  const catalog = latestPromptsPerName(prompts);
  const groups = new Map<PromptKind, PromptRecord[]>();
  for (const { kind } of AGENT_TYPE_GROUPS) {
    groups.set(kind, []);
  }
  for (const p of catalog) {
    const { kind } = classifyPrompt(p);
    groups.get(kind)?.push(p);
  }
  for (const [, items] of groups) {
    items.sort((a, b) => {
      const la = getAgentDisplayName(a.name, classifyPrompt(a));
      const lb = getAgentDisplayName(b.name, classifyPrompt(b));
      return la.localeCompare(lb);
    });
  }
  return groups;
}

export function getKindDescription(kind: PromptKind): string {
  return KIND_DESCRIPTIONS[kind];
}

export function latestPromptsPerName(prompts: PromptRecord[]): PromptRecord[] {
  const byName = new Map<string, PromptRecord>();
  for (const p of prompts) {
    if (!byName.has(p.name)) byName.set(p.name, p);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function groupPromptsByCategory(
  prompts: PromptRecord[],
): Map<PromptCategoryId, PromptRecord[]> {
  const catalog = latestPromptsPerName(prompts);
  const groups = new Map<PromptCategoryId, PromptRecord[]>();
  for (const cat of LAB_CATEGORIES) {
    groups.set(cat.id, []);
  }
  for (const p of catalog) {
    const { category } = classifyPrompt(p);
    groups.get(category)?.push(p);
  }
  return groups;
}

export const DEFAULT_LIVE_FIXTURE = {
  candidateName: "Alex",
  role: "Backend Engineer",
  experience: "5",
  language: "en",
  targetCompany: "Acme Corp",
  jobDescription: "Build scalable APIs with Node.js and PostgreSQL.",
  interviewerBody:
    "You are conducting a technical interview. Ask one question at a time. Focus on system design and backend fundamentals.",
};

export const DEFAULT_REPORT_FIXTURE = {
  role: "Backend Engineer",
  experienceCategory: "mid",
  experienceYears: "5",
  experienceYearsLabel: "5 years",
  targetCompany: "Acme Corp",
  languageLabel: "English",
  resumeSkills: "Node.js, PostgreSQL, Redis",
  technicalExpectations: "API design, caching, observability",
  question: "How would you design a rate limiter?",
  answer: "I would use a token bucket in Redis with sliding windows per user.",
  index: "1",
  totalPairs: "3",
  codingContextRule: "",
};

export const DEFAULT_TRANSCRIPT_FIXTURE = {
  question: "Explain eventual consistency.",
  answer: "Los sistemas pueden estar temporalmente inconsistentes pero convergen.",
};

export const DEFAULT_ATS_EXTRACT_FIXTURE = {
  schemaJson: '{"name":"","skills":[]}',
  resumeText: "Jane Doe\nBackend Engineer\nSkills: Node.js, PostgreSQL",
};

export const DEFAULT_SD_CHAT_FIXTURE = {
  problemContext:
    "Design a URL shortener like bit.ly — 100M links/day, low latency redirects.",
};

export const DEFAULT_SD_VOICE_FIXTURE = {
  title: "URL Shortener",
  scenario: "Build a service that shortens URLs at scale.",
  coreRequirements: "Shorten, redirect, analytics",
  scaleRequirements: "100M links/day",
  considerations: "Hash collisions, cache, DB sharding",
};

export const DEFAULT_ATS_FEEDBACK_FIXTURE = {
  cosineSimilarityPercent: "72.50",
  cosineSimilarityRounded: 73,
  fontContext: "",
  sectionContext: "",
  schemaJson: '{"overallScore":0,"categoryScores":{}}',
  resumeText: "Jane Doe\nBackend Engineer\nSkills: Node.js, PostgreSQL",
  extractedKeywords: "Node.js, PostgreSQL, API",
};

export const DEFAULT_REPORT_COACHING_PASS2_FIXTURE = {
  role: "Backend Engineer",
  experience: 5,
  overallScore: 68,
  technicalScore: 72,
  codingRoundContext: "",
  qaScoreSummary: "Q1 [medium/good]: score=75, Q2 [hard/fair]: score=60",
  behavioralAnswers: "Q: Tell me about a conflict. A: I mediated between teams...",
};

export const DEFAULT_RESUME_DATA_EXTRACT_FIXTURE = {
  sectionNames: "personalInfo, experience, skills",
  resumeText: "Jane Doe\nSoftware Engineer at Acme\nSkills: Node.js, PostgreSQL",
};

export const DEFAULT_SD_SCORING_FIXTURE = {
  problemContext: "Design a URL shortener — 100M links/day.",
  boardHint: "Labels: API Gateway, Redis, DB",
  feedbackSummary: "(none)",
  transcriptBlock: "Candidate: I would start with an API layer...",
};

export const DEFAULT_SD_REPORT_FIXTURE = {
  problemBrief: "URL shortener — scale, redirects, analytics.",
  boardHint: "Labels: LB, API, Cache, DB",
  scoreBlock: '{"overallScore":65}',
  feedbackBlock: "(none)",
  mergedTranscript: "Candidate discussed hashing and cache layers.",
};

export const DEFAULT_RESUME_CONTENT_REFINE_FIXTURE = {
  taskMode: "refinement",
  contentType: "paragraph",
  rawText: "Worked on backend services and improved API performance.",
  wordCount: 8,
  maxWords: 11,
  hasUserPrompt: false,
  userPrompt: "",
  noQuantification: false,
  wantsBrevity: false,
  wantsFormalTone: false,
  wantsCasualTone: false,
};

export const DEFAULT_PEER_SEGMENT_FIXTURE = {
  interviewType: "technical",
  interviewerName: "Sam",
  candidateName: "Alex",
  transcript:
    "Sam: Tell me about your last project.\nAlex: I built an API gateway with rate limiting.\nSam: How did you handle failures?",
};

export const DEFAULT_PEER_QA_FIXTURE = {
  interviewType: "technical",
  interviewerName: "Sam",
  candidateName: "Alex",
  question: "How did you handle failures?",
  answer: "We used retries with exponential backoff and circuit breakers.",
  index: 1,
  total: 2,
};

export function defaultFixtureForPrompt(name: string, kind: PromptKind): Record<string, unknown> {
  if (name.startsWith("profile-")) {
    return {
      ...DEFAULT_LIVE_FIXTURE,
      profileContent: "(profile renders from selected profile template)",
    };
  }
  if (name === "interviewer-coding-discussion") {
    return {
      candidateName: "Alex",
      role: "Backend Engineer",
      experience: "5",
      interviewerBody:
        "### Two Sum (Easy)\nGiven an array...\n\nCandidate code:\n```\nfunction twoSum() {}\n```",
    };
  }
  if (name.startsWith("report-qa")) return DEFAULT_REPORT_FIXTURE;
  if (name === "report-coaching-pass2") return DEFAULT_REPORT_COACHING_PASS2_FIXTURE;
  if (name === "transcript-normalize") return DEFAULT_TRANSCRIPT_FIXTURE;
  if (name === "ats-resume-extract") return DEFAULT_ATS_EXTRACT_FIXTURE;
  if (name === "ats-resume-feedback") return DEFAULT_ATS_FEEDBACK_FIXTURE;
  if (name === "resume-data-extract") return DEFAULT_RESUME_DATA_EXTRACT_FIXTURE;
  if (name.startsWith("peer-")) {
    if (name === "peer-transcript-segment") return DEFAULT_PEER_SEGMENT_FIXTURE;
    if (name === "peer-qa-analysis") return DEFAULT_PEER_QA_FIXTURE;
    return {
      interviewType: "technical",
      candidateName: "Alex",
      overallScore: 72,
      qaCount: 5,
    };
  }
  if (name === "ats-batch-check") {
    return {
      resumeText: "Jane Doe\nBackend Engineer",
      bulletCount: 2,
      bulletsBlock: "1. Built APIs\n2. Led migrations",
      skillsList: "Node.js, PostgreSQL",
      profileJson: '{"targetRole":"Backend Engineer"}',
      jobDescriptionSection: "NO JOB DESCRIPTION — skip tailoring checks.",
      checksToRun: "spellingGrammar, quantifyingImpact",
      targetRole: "Backend Engineer",
    };
  }
  if (name === "ats-jd-extract") {
    return { jobDescription: "Senior Backend Engineer — 5+ years Node.js, AWS required." };
  }
  if (name === "linkedin-profile-enhance") {
    return {
      sectionNames: "personalInfo, experience, skills",
      profileJson: '{"fullName":"Jane Doe","headline":"Backend Engineer"}',
    };
  }
  if (name === "ats-resume-enhance") {
    return {
      resumeContentJson: '{"experience":[]}',
      profileSummaryLine: "",
      atsScoreLine: "ATS score: 65/100 (4 issues)",
      feedbackSummary: "Add metrics to bullets",
      jobDescriptionSection: "",
    };
  }
  if (name === "ats-issue-improve") {
    return {
      resumeSnippet: "Built backend services",
      checkLabel: "Quantifying impact",
      categoryLabelClause: "",
      issueTitle: "Missing metrics",
      issueDescription: "Bullet lacks measurable impact",
      suggestionLine: "SUGGESTION: Add throughput or latency improvements",
      rewriteSuggestionLine: "",
      interviewQuestionLine: "",
      fixBodyLine: "",
      sourceContent: "Built backend services",
      hasUserPrompt: false,
      userPrompt: "",
      noQuantification: false,
      wantsBrevity: false,
      wantsFormalTone: false,
      wantsCasualTone: false,
    };
  }
  if (name === "interviewer-voice-greeting") {
    return {
      candidateName: "Alex",
      role: "Backend Engineer",
      experienceText: "with 5 years of experience",
      additionalContext: "",
      topSkills: "Node.js, PostgreSQL, Redis",
      interviewerDisplayName: "Jordan Lee",
      interviewerTitle: "Engineering Manager",
      introArticle: "an",
      atCompany: " at Acme Corp",
    };
  }
  if (name === "resume-content-refine") return DEFAULT_RESUME_CONTENT_REFINE_FIXTURE;
  if (name === "system-design-scoring") return DEFAULT_SD_SCORING_FIXTURE;
  if (name === "system-design-report") return DEFAULT_SD_REPORT_FIXTURE;
  if (name.startsWith("system-design-voice")) return DEFAULT_SD_VOICE_FIXTURE;
  if (name.startsWith("system-design-chat") || name.startsWith("system-design-diagram")) {
    return DEFAULT_SD_CHAT_FIXTURE;
  }
  if (kind === "voice") return DEFAULT_LIVE_FIXTURE;
  return { note: "(no default fixture — add variables in the editor)" };
}
