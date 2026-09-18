"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import {
  adminCodingProblemApi,
  type AdminCodingValidateTestsResult,
  type CodingLanguage,
} from "@/lib/api";
import { CODING_LANGUAGES } from "./form-utils";

interface ValidateTestsPanelProps {
  readonly problemId: string;
  readonly referenceSolution: Partial<Record<CodingLanguage, string>>;
  readonly canValidate: boolean;
}

export function ValidateTestsPanel({
  problemId,
  referenceSolution,
  canValidate,
}: ValidateTestsPanelProps) {
  const [language, setLanguage] = useState<CodingLanguage>("python");
  const [visibility, setVisibility] = useState<"all" | "public" | "hidden">(
    "all",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdminCodingValidateTestsResult | null>(
    null,
  );

  const run = async () => {
    if (!canValidate) {
      toast.error("Save the problem first before validating tests");
      return;
    }
    if (!referenceSolution[language]?.trim()) {
      toast.error(`Add reference solution for ${language} first`);
      return;
    }
    setLoading(true);
    try {
      const data = await adminCodingProblemApi.validateTests(problemId, {
        language,
        visibility,
      });
      setResult(data);
      if (data.passed === data.total) {
        toast.success(`All ${data.total} tests passed`);
      } else {
        toast.error(`${data.passed}/${data.total} tests passed`);
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Validation failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/50 p-4">
      <p className="text-sm font-medium">Validate test cases (Judge0)</p>
      <p className="text-[11px] text-muted-foreground">
        Runs the saved reference solution against public and/or hidden tests.
        Requires Judge0 configured on the server.
      </p>
      <div className="flex flex-wrap gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Language</Label>
          <AppSelect
            value={language}
            onChange={(v) => setLanguage(v as CodingLanguage)}
            options={CODING_LANGUAGES.map((l) => ({
              value: l.id,
              label: l.label,
            }))}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tests to run</Label>
          <AppSelect
            value={visibility}
            onChange={(v) =>
              setVisibility(v as "all" | "public" | "hidden")
            }
            options={[
              { value: "all", label: "Public + hidden" },
              { value: "public", label: "Public only" },
              { value: "hidden", label: "Hidden only" },
            ]}
          />
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={() => void run()} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run validation
          </Button>
        </div>
      </div>

      {result ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-2">#</th>
                <th className="p-2">Type</th>
                <th className="p-2">Pass</th>
                <th className="p-2">Expected</th>
                <th className="p-2">Actual</th>
                <th className="p-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r) => (
                <tr key={r.index} className="border-b font-mono">
                  <td className="p-2">{r.index + 1}</td>
                  <td className="p-2">{r.visibility}</td>
                  <td className="p-2">{r.passed ? "yes" : "no"}</td>
                  <td className="max-w-[120px] truncate p-2">{r.expected}</td>
                  <td className="max-w-[120px] truncate p-2">{r.actual}</td>
                  <td className="max-w-[160px] truncate p-2 text-destructive">
                    {r.error || r.stderr || r.compileOutput || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
