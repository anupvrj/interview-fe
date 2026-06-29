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
  voice: "Voice",
  execute: "Execute",
  profile: "Profile",
};

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
  if (name.startsWith("report-")) return DEFAULT_REPORT_FIXTURE;
  if (name === "transcript-normalize") return DEFAULT_TRANSCRIPT_FIXTURE;
  if (name === "ats-resume-extract") return DEFAULT_ATS_EXTRACT_FIXTURE;
  if (name.startsWith("system-design-voice")) return DEFAULT_SD_VOICE_FIXTURE;
  if (name.startsWith("system-design-chat") || name.startsWith("system-design-diagram")) {
    return DEFAULT_SD_CHAT_FIXTURE;
  }
  if (kind === "voice") return DEFAULT_LIVE_FIXTURE;
  return { promptBody: "(assembled in core — paste or capture from interview)" };
}
