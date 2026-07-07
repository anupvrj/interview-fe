export type ATSCheckStatus = "pass" | "warn" | "fail" | "skipped";

export type ATSCategoryId =
  | "content"
  | "sections"
  | "atsEssentials"
  | "hrRedFlags"
  | "discrimination"
  | "seniority"
  | "tailoring"
  | "jobMatch";

export type ATSCheckId =
  | "atsParseRate"
  | "quantifyingImpact"
  | "repetition"
  | "spellingGrammar"
  | "bulletsConsistency"
  | "essentialSections"
  | "contactInformation"
  | "sectionOrder"
  | "fileFormatSize"
  | "design"
  | "emailAddress"
  | "headerLinks"
  | "fileNameCheck"
  | "datesLinksConsistency"
  | "credibility"
  | "interviewRisks"
  | "peerBenchmarking"
  | "linkedinMatch"
  | "ageismDateBias"
  | "employmentGaps"
  | "careerProgression"
  | "skillEvidence"
  | "leadershipSignals"
  | "hardSkillsMatch"
  | "softSkillsMatch"
  | "actionVerbs"
  | "titleMatch"
  | "experienceMatch"
  | "mustHaveSkillsMatch"
  | "preferredSkillsMatch"
  | "educationMatch"
  | "certificationMatch"
  | "responsibilitiesMatch";

export type ATSIssueKind =
  | "negative"
  | "positive"
  | "rewrite"
  | "synonym"
  | "spelling"
  | "interview_risk"
  | "credibility_risk"
  | "credibility_positive"
  | "skill_gap"
  | "skill_present";

export type ATSIssueSeverity = "fail" | "warn" | "info";

export interface ATSIssue {
  title: string;
  description: string;
  excerpt?: string;
  suggestion?: string;
  rewriteSuggestion?: string;
  kind?: ATSIssueKind;
  severity?: ATSIssueSeverity;
  alternatives?: string[];
  interviewQuestion?: string;
  fixTitle?: string;
  fixBody?: string;
  wordCount?: number;
  skillPresent?: boolean;
}

export interface ATSIgnoredIssue {
  checkId: ATSCheckId;
  issueKey: string;
  ignoredAt: string;
  title?: string;
}

export interface ATSCheckSummary {
  headline: string;
  badge?: string;
  stats?: Record<string, number>;
  strongTrustSignal?: string;
  mainCredibilityRisk?: string;
  intro?: string;
}

export interface ATSCheckFAQ {
  question: string;
  answer: string;
}

export interface ATSMatchMeta {
  matchPercent?: number;
  matched?: string[];
  missing?: string[];
  partial?: string[];
  requiredLabel?: string;
  foundLabel?: string;
  verdict?: "strong" | "partial" | "weak";
  benchmarkSkills?: Array<{ name: string; present: boolean }>;
  targetRole?: string;
  experienceYears?: number;
  experienceHeadline?: string;
  experienceDetail?: string;
  uniquenessPercent?: number;
  detectedSections?: string[];
}

export interface ATSCheckResult {
  id: ATSCheckId;
  label: string;
  description: string;
  status: ATSCheckStatus;
  score: number;
  issueCount: number;
  issues: ATSIssue[];
  parseRate?: number;
  meta?: ATSMatchMeta;
  summary?: ATSCheckSummary;
  faq?: ATSCheckFAQ[];
  scoreMeta?: {
    totalBullets?: number;
    quantifiedBullets?: number;
    outOfRangeBullets?: number;
  };
}

export interface ATSCategoryResult {
  id: ATSCategoryId;
  label: string;
  score: number;
  issueCount: number;
  checks: ATSCheckResult[];
}

export interface ATSInferredProfile {
  seniority: string;
  targetRole: string;
  isIntern: boolean;
}

export interface JobMatchSummary {
  overallMatch: number;
  verdict: "strong" | "partial" | "weak";
  jobTitle?: string;
  requiredYears?: number | null;
  candidateYears?: number;
  mustHaveCoverage?: number;
  missingMustHaveCount?: number;
}

export interface ATSReportV3 {
  version: 3;
  score: number;
  issueCount: number;
  mode: "standalone" | "tailored";
  inferredProfile?: ATSInferredProfile;
  categories: Record<ATSCategoryId, ATSCategoryResult>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  jobMatch?: JobMatchSummary;
}

export function isATSReportV3(
  feedback: unknown,
): feedback is ATSReportV3 {
  return (
    typeof feedback === "object" &&
    feedback !== null &&
    "version" in feedback &&
    (feedback as ATSReportV3).version === 3
  );
}

export const CATEGORY_LABELS: Record<ATSCategoryId, string> = {
  content: "Content",
  sections: "Sections",
  atsEssentials: "ATS Essentials",
  hrRedFlags: "HR Red Flags",
  discrimination: "Discrimination",
  seniority: "Seniority",
  tailoring: "Tailoring",
  jobMatch: "Job Match",
};

export const CHECK_LABELS: Record<ATSCheckId, string> = {
  atsParseRate: "ATS Parse Rate",
  quantifyingImpact: "Quantifying Impact",
  repetition: "Repetition",
  spellingGrammar: "Spelling & Grammar",
  bulletsConsistency: "Bullets Consistency",
  essentialSections: "Essential Sections",
  contactInformation: "Contact Information",
  sectionOrder: "Section Order",
  fileFormatSize: "File Format & Size",
  design: "Design",
  emailAddress: "Email Address",
  headerLinks: "Header Links",
  fileNameCheck: "File Name Check",
  datesLinksConsistency: "Dates & Links Consistency",
  credibility: "Credibility",
  interviewRisks: "Interview Risks",
  peerBenchmarking: "Peer Benchmarking",
  linkedinMatch: "LinkedIn Match",
  ageismDateBias: "Ageism & Date Bias",
  employmentGaps: "Employment Gaps",
  careerProgression: "Career Progression",
  skillEvidence: "Skill Evidence",
  leadershipSignals: "Leadership Signals",
  hardSkillsMatch: "Hard Skills Match",
  softSkillsMatch: "Soft Skills Match",
  actionVerbs: "Action Verbs",
  titleMatch: "Title Match",
  experienceMatch: "Experience Match",
  mustHaveSkillsMatch: "Must-Have Skills",
  preferredSkillsMatch: "Preferred Skills",
  educationMatch: "Education Match",
  certificationMatch: "Certifications",
  responsibilitiesMatch: "Responsibilities & Requirements",
};

export const CHECKS_BY_CATEGORY: Record<ATSCategoryId, ATSCheckId[]> = {
  content: [
    "atsParseRate",
    "quantifyingImpact",
    "repetition",
    "spellingGrammar",
    "bulletsConsistency",
  ],
  sections: ["essentialSections", "contactInformation", "sectionOrder"],
  atsEssentials: [
    "fileFormatSize",
    "design",
    "emailAddress",
    "headerLinks",
    "fileNameCheck",
    "datesLinksConsistency",
  ],
  hrRedFlags: [
    "credibility",
    "interviewRisks",
    "peerBenchmarking",
  ],
  discrimination: ["ageismDateBias", "employmentGaps"],
  seniority: ["careerProgression", "skillEvidence", "leadershipSignals"],
  tailoring: ["hardSkillsMatch", "softSkillsMatch", "actionVerbs", "titleMatch"],
  jobMatch: [
    "experienceMatch",
    "mustHaveSkillsMatch",
    "preferredSkillsMatch",
    "educationMatch",
    "certificationMatch",
    "responsibilitiesMatch",
  ],
};

export const CATEGORY_ORDER: ATSCategoryId[] = [
  "jobMatch",
  "content",
  "sections",
  "atsEssentials",
  "hrRedFlags",
  "discrimination",
  "seniority",
  "tailoring",
];

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600 dark:text-[#fd7070]";
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}
