"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Loader2,
  Play,
  RotateCcw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { CodingProblemStatement } from "@/components/coding/CodingProblemStatement";
import { PlaygroundCasePanel } from "@/components/coding/PlaygroundCasePanel";
import {
  CodingRunResultsPanel,
  type CodingRunPayload,
} from "@/components/coding/CodingRunResultsPanel";
import {
  getPublicCaseCount,
  getPublicCaseView,
  isDesignProblem,
  isSnippetFunctionProblem,
  playgroundModeLabel,
} from "@/lib/coding-problem-mode";
import {
  adminCodingProblemApi,
  userApi,
  type AdminCodingProblemDetail,
  type AdminCodingValidateTestsResult,
  type CodingLanguage,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { CODING_LANGUAGES } from "@/components/coding-admin/form-utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[#9ca3af]">
      Loading editor…
    </div>
  ),
});

const MONACO_LANG: Record<CodingLanguage, string> = {
  python: "python",
  javascript: "javascript",
  java: "java",
  c: "c",
  cpp: "cpp",
};

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: "text-emerald-400",
  medium: "text-amber-400",
  hard: "text-rose-400",
};

export default function CodingProblemPlaygroundPage() {
  const params = useParams<{ problemId: string }>();
  const problemId = decodeURIComponent(params.problemId);
  const router = useRouter();
  const { isLoaded } = useUser();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<AdminCodingProblemDetail | null>(null);
  const [language, setLanguage] = useState<CodingLanguage>("javascript");
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [activeCase, setActiveCase] = useState(0);
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");
  const [runResult, setRunResult] = useState<AdminCodingValidateTestsResult | null>(
    null,
  );

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const p = await userApi.getMyProfile();
        if (!isPlatformAdmin(p.accessRole ?? null)) {
          router.replace("/dashboard");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/dashboard");
      }
    })();
  }, [isLoaded, router]);

  const loadProblem = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await adminCodingProblemApi.get(problemId);
      setProblem(detail);
      const initialLang: CodingLanguage = detail.starterCode.javascript?.trim()
        ? "javascript"
        : detail.starterCode.python?.trim()
          ? "python"
          : "javascript";
      setLanguage(initialLang);
      setCode(detail.starterCode[initialLang]?.trim() ?? "");
    } catch {
      toast.error("Failed to load problem");
      router.replace("/dashboard/super-admin/coding-problems");
    } finally {
      setLoading(false);
    }
  }, [problemId, router]);

  useEffect(() => {
    if (!authorized) return;
    void loadProblem();
  }, [authorized, loadProblem]);

  const publicCaseCount = problem ? getPublicCaseCount(problem) : 0;

  useEffect(() => {
    if (activeCase >= publicCaseCount && publicCaseCount > 0) {
      setActiveCase(0);
    }
  }, [publicCaseCount, activeCase]);

  const isDesignMode = problem ? isDesignProblem(problem) : false;
  const usesHarness = problem
    ? isSnippetFunctionProblem(problem) || isDesignMode
    : false;

  const activeCaseView = useMemo(
    () => (problem ? getPublicCaseView(problem, activeCase) : null),
    [problem, activeCase],
  );

  const runPayload: CodingRunPayload | null = runResult
    ? {
        passed: runResult.passed,
        total: runResult.total,
        results: runResult.results.map((r) => ({
          index: r.index,
          passed: r.passed,
          expected: r.expected,
          actual: r.actual,
          stderr: r.stderr,
          compileOutput: r.compileOutput,
          status: r.status,
          error: r.error,
          visibility: r.visibility,
        })),
      }
    : null;

  const runTests = async (visibility: "public" | "all") => {
    if (!problem || !code.trim()) {
      toast.error("Write some code first");
      return;
    }
    setRunning(true);
    setRunResult(null);
    setBottomTab("result");
    try {
      const res = await adminCodingProblemApi.validateTests(problem.problemId, {
        language,
        code,
        visibility,
      });
      setRunResult(res);
      if (res.passed === res.total) {
        toast.success(
          visibility === "public" ? "All sample tests passed" : "All tests passed",
        );
      } else {
        toast.error(`${res.passed}/${res.total} tests passed`);
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Run failed";
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  const onLanguageChange = (next: CodingLanguage) => {
    if (problem) {
      setCode(problem.starterCode[next]?.trim() ?? "");
    }
    setLanguage(next);
    setRunResult(null);
  };

  if (!isLoaded || !authorized || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#1a1a1a] text-[#9ca3af]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading playground…
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#1a1a1a] text-[#eff1f6]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#3a3a3a] px-4 py-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-[#cbd5e1] hover:bg-[#2d2d2d] hover:text-white"
        >
          <Link href="/dashboard/super-admin/coding-problems">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <span className="text-sm font-medium">{problem.title}</span>
        <span className={cn("text-xs capitalize", DIFFICULTY_CLASS[problem.difficulty])}>
          {problem.difficulty}
        </span>
        {usesHarness ? (
          <Badge variant="outline" className="border-[#4ade80]/40 text-[#86efac]">
            {playgroundModeLabel(problem)}
          </Badge>
        ) : (
          <Badge variant="outline" className="border-[#94a3b8]/40 text-[#94a3b8]">
            Stdin mode
          </Badge>
        )}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Left — problem description */}
        <section className="min-h-0 overflow-y-auto border-b border-[#3a3a3a] p-5 lg:border-b-0 lg:border-r">
          <h1 className="mb-3 text-xl font-semibold">{problem.title}</h1>
          <CodingProblemStatement
            statement={problem.statement}
            variant="admin"
          />
        </section>

        {/* Right — editor + tests */}
        <section className="flex min-h-0 flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-b border-[#3a3a3a]">
            <div className="flex items-center justify-between border-b border-[#3a3a3a] px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                Code
              </span>
              <Select
                value={language}
                onValueChange={(v) => onLanguageChange(v as CodingLanguage)}
              >
                <SelectTrigger className="h-8 w-[140px] border-[#3a3a3a] bg-[#282828] text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#3a3a3a] bg-[#282828] text-white">
                  {CODING_LANGUAGES.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-h-[280px] flex-1">
              <MonacoEditor
                height="100%"
                language={MONACO_LANG[language]}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 12 } }}
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[#3a3a3a] px-3 py-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-[#2d2d2d] text-white hover:bg-[#3a3a3a]"
                disabled={running}
                onClick={() => void runTests("public")}
              >
                {running ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-1 h-4 w-4" />
                )}
                Run
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={running}
                onClick={() => void runTests("all")}
              >
                <Send className="mr-1 h-4 w-4" />
                Submit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-[#cbd5e1] hover:bg-[#2d2d2d] hover:text-white"
                onClick={() => {
                  setCode(problem.starterCode[language]?.trim() ?? "");
                  setRunResult(null);
                }}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-[#cbd5e1] hover:bg-[#2d2d2d] hover:text-white"
                onClick={() => {
                  const ref = problem.referenceSolution[language]?.trim();
                  if (!ref) {
                    toast.error(`No reference for ${language}`);
                    return;
                  }
                  setCode(ref);
                  setRunResult(null);
                }}
              >
                Load reference
              </Button>
            </div>
          </div>

          {/* Bottom — testcase / result */}
          <div className="flex h-[min(40vh,320px)] min-h-[220px] flex-col">
            <div className="flex border-b border-[#3a3a3a]">
              <button
                type="button"
                className={cn(
                  "px-4 py-2 text-sm",
                  bottomTab === "testcase"
                    ? "border-b-2 border-white text-white"
                    : "text-[#9ca3af] hover:text-white",
                )}
                onClick={() => setBottomTab("testcase")}
              >
                Testcase
              </button>
              <button
                type="button"
                className={cn(
                  "px-4 py-2 text-sm",
                  bottomTab === "result"
                    ? "border-b-2 border-white text-white"
                    : "text-[#9ca3af] hover:text-white",
                )}
                onClick={() => setBottomTab("result")}
              >
                Test Result
              </button>
            </div>

            {bottomTab === "testcase" ? (
              <div className="flex min-h-0 flex-1 flex-col p-3">
                {publicCaseCount > 0 ? (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {Array.from({ length: publicCaseCount }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveCase(i)}
                          className={cn(
                            "rounded px-3 py-1 text-xs",
                            activeCase === i
                              ? "bg-[#3a3a3a] text-white"
                              : "text-[#9ca3af] hover:bg-[#2d2d2d]",
                          )}
                        >
                          Case {i + 1}
                        </button>
                      ))}
                    </div>
                    <PlaygroundCasePanel testCase={activeCaseView} className="min-h-0 flex-1" />
                  </>
                ) : (
                  <p className="text-sm text-[#9ca3af]">
                    No public test cases found for this problem.
                  </p>
                )}
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {!runPayload ? (
                  <p className="text-sm text-[#9ca3af]">
                    Run your code to see results here.
                  </p>
                ) : (
                  <CodingRunResultsPanel
                    payload={runPayload}
                    theme="dark"
                    showVisibility
                  />
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
