import type {
  AdminCodingDesignMeta,
  AdminCodingFunctionCase,
  AdminCodingProblemDetail,
  AdminCodingSnippetMeta,
} from "@/lib/api";

export type PlaygroundCaseView =
  | {
      kind: "function";
      inputs: AdminCodingFunctionCase["inputs"];
      expectedOutput: string;
    }
  | {
      kind: "design";
      operations: string[];
      args: unknown[][];
      expectedOutput: string;
    }
  | {
      kind: "stdin";
      input: string;
      expectedOutput: string;
    };

type CodingProblemModeFields = {
  executionMode?: AdminCodingProblemDetail["executionMode"];
  publicTests?: AdminCodingProblemDetail["publicTests"];
  snippetMeta?: AdminCodingSnippetMeta;
  designMeta?: AdminCodingDesignMeta;
};

export function isDesignProblem(problem: Pick<CodingProblemModeFields, "designMeta" | "executionMode">): boolean {
  return (
    !!problem.designMeta?.className?.trim() &&
    (problem.designMeta.publicCases?.length ?? 0) > 0
  );
}

export function isSnippetFunctionProblem(
  problem: Pick<CodingProblemModeFields, "snippetMeta" | "designMeta" | "executionMode">,
): boolean {
  if (isDesignProblem(problem)) return false;
  return (
    problem.executionMode === "snippet" ||
    !!problem.snippetMeta?.entryPoint?.trim() ||
    (problem.snippetMeta?.publicCases?.length ?? 0) > 0
  );
}

export function isStdinProblem(
  problem: Pick<
    CodingProblemModeFields,
    "publicTests" | "snippetMeta" | "designMeta" | "executionMode"
  >,
): boolean {
  return !isDesignProblem(problem) && !isSnippetFunctionProblem(problem);
}

export function getPublicCaseCount(
  problem: Pick<
    CodingProblemModeFields,
    "publicTests" | "snippetMeta" | "designMeta" | "executionMode"
  >,
): number {
  if (isDesignProblem(problem)) {
    return problem.designMeta!.publicCases.length;
  }
  if (isSnippetFunctionProblem(problem)) {
    return problem.snippetMeta!.publicCases.length;
  }
  return problem.publicTests?.length ?? 0;
}

export function getPublicCaseView(
  problem: CodingProblemModeFields & Pick<AdminCodingProblemDetail, "publicTests">,
  index: number,
): PlaygroundCaseView | null {
  if (isDesignProblem(problem)) {
    const testCase = problem.designMeta!.publicCases[index];
    if (!testCase) return null;
    return {
      kind: "design",
      operations: testCase.operations,
      args: testCase.args,
      expectedOutput: testCase.expectedOutput,
    };
  }

  if (isSnippetFunctionProblem(problem)) {
    const testCase = problem.snippetMeta!.publicCases[index];
    if (!testCase) return null;
    return {
      kind: "function",
      inputs: testCase.inputs,
      expectedOutput: testCase.expectedOutput,
    };
  }

  const testCase = problem.publicTests?.[index];
  if (!testCase) return null;
  return {
    kind: "stdin",
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
  };
}

export function formatPlaygroundValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function playgroundModeLabel(
  problem: Pick<
    CodingProblemModeFields,
    "publicTests" | "snippetMeta" | "designMeta" | "executionMode"
  >,
): string {
  if (isDesignProblem(problem)) return "Design class";
  if (isSnippetFunctionProblem(problem)) return "Function template";
  return "Stdin mode";
}

export function snippetEntryLabel(
  problem: Pick<CodingProblemModeFields, "snippetMeta" | "designMeta">,
): string | null {
  if (problem.designMeta?.className) return problem.designMeta.className;
  if (problem.snippetMeta?.entryPoint) return `${problem.snippetMeta.entryPoint}()`;
  return null;
}

export type { AdminCodingSnippetMeta, AdminCodingDesignMeta };
