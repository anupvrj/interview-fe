import type {
  AdminCodingProblemDetail,
  AdminCodingProblemUpsertBody,
  AdminCodingTestCase,
  CodingDifficulty,
  CompanyTierTag,
} from "@/lib/api";

export type CodingProblemFormValues = AdminCodingProblemUpsertBody & {
  problemId?: string;
};

const PROBLEM_ID_RE = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export const CODING_LANGUAGES = [
  { id: "python" as const, label: "Python" },
  { id: "javascript" as const, label: "JavaScript" },
  { id: "java" as const, label: "Java" },
  { id: "c" as const, label: "C" },
  { id: "cpp" as const, label: "C++" },
];

export const COMPANY_TIER_OPTIONS: CompanyTierTag[] = [
  "FAANG",
  "TIER1",
  "TIER2",
  "STARTUP",
  "SERVICE",
];

export function emptyCodingProblemForm(): CodingProblemFormValues {
  return {
    problemId: "",
    title: "",
    statement: "",
    categories: [],
    difficulty: "medium",
    companyTierTags: ["FAANG", "TIER1", "TIER2", "STARTUP", "SERVICE"],
    skillTags: [],
    starterCode: { python: "", javascript: "" },
    referenceSolution: {},
    publicTests: [{ input: "", expectedOutput: "", compareMode: "trim" }],
    hiddenTests: [],
    timeLimitMs: undefined,
    isActive: true,
  };
}

export function detailToFormValues(
  detail: AdminCodingProblemDetail,
): CodingProblemFormValues {
  return {
    problemId: detail.problemId,
    title: detail.title,
    statement: detail.statement,
    categories: detail.categories ?? [],
    difficulty: detail.difficulty,
    companyTierTags: detail.companyTierTags ?? [],
    skillTags: detail.skillTags ?? [],
    starterCode: detail.starterCode ?? {},
    referenceSolution: detail.referenceSolution ?? {},
    publicTests: detail.publicTests ?? [],
    hiddenTests: detail.hiddenTests ?? [],
    timeLimitMs: detail.timeLimitMs,
    isActive: detail.isActive,
  };
}

export function formToUpsertBody(
  form: CodingProblemFormValues,
): AdminCodingProblemUpsertBody {
  return {
    problemId: form.problemId?.trim() || undefined,
    title: form.title.trim(),
    statement: form.statement.trim(),
    categories: form.categories?.filter(Boolean) ?? [],
    difficulty: form.difficulty,
    companyTierTags: form.companyTierTags ?? [],
    skillTags: form.skillTags ?? [],
    starterCode: form.starterCode ?? {},
    referenceSolution: form.referenceSolution ?? {},
    publicTests: form.publicTests ?? [],
    hiddenTests: form.hiddenTests ?? [],
    timeLimitMs: form.timeLimitMs,
    isActive: form.isActive !== false,
  };
}

export function validateCodingProblemForm(
  form: CodingProblemFormValues,
  mode: "create" | "edit",
): string | null {
  if (mode === "create") {
    if (!form.problemId?.trim()) return "Problem ID is required";
    if (!PROBLEM_ID_RE.test(form.problemId.trim())) {
      return "Problem ID must be lowercase alphanumeric with hyphens/underscores";
    }
  }
  if (!form.title?.trim()) return "Title is required";
  if (!form.statement?.trim()) return "Statement is required";
  if (!form.difficulty) return "Difficulty is required";
  const pub = form.publicTests ?? [];
  if (pub.length < 1) return "At least one public test case is required";
  for (let i = 0; i < pub.length; i++) {
    const tc = pub[i]!;
    if (!tc.input.trim()) return `Public test ${i + 1}: input is required`;
    if (!tc.expectedOutput.trim()) {
      return `Public test ${i + 1}: expected output is required`;
    }
  }
  const starter = form.starterCode ?? {};
  if (!starter.python?.trim() && !starter.javascript?.trim()) {
    return "Starter code must include Python or JavaScript";
  }
  return null;
}

export function hiddenTestsWarning(form: CodingProblemFormValues): string | null {
  if ((form.hiddenTests ?? []).length === 0) {
    return "No hidden test cases — submit will only judge public tests. Continue?";
  }
  return null;
}

export function emptyTestCase(): AdminCodingTestCase {
  return { input: "", expectedOutput: "", compareMode: "trim" };
}

export function difficultyLabel(d: CodingDifficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}
