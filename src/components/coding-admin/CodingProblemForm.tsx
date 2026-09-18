"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { StringListEditor } from "@/components/system-design-admin/StringListEditor";
import { CodeTabsEditor } from "@/components/coding-admin/CodeTabsEditor";
import { TestCaseEditor } from "@/components/coding-admin/TestCaseEditor";
import { StatementEditor } from "@/components/coding-admin/StatementEditor";
import { SnippetCaseEditor } from "@/components/coding-admin/SnippetCaseEditor";
import { ValidateTestsPanel } from "@/components/coding-admin/ValidateTestsPanel";
import {
  COMPANY_TIER_OPTIONS,
  isSnippetProblemForm,
  type CodingProblemFormValues,
} from "@/components/coding-admin/form-utils";
import {
  adminCodingProblemApi,
  type AdminCodingStarterTemplateItem,
  type CompanyTierTag,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function Section({
  title,
  children,
  defaultOpen = true,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? <div className="space-y-4 border-t px-4 py-4">{children}</div> : null}
    </div>
  );
}

interface CodingProblemFormProps {
  readonly mode: "create" | "edit";
  readonly value: CodingProblemFormValues;
  readonly onChange: (patch: Partial<CodingProblemFormValues>) => void;
  readonly categories: string[];
}

export function CodingProblemForm({
  mode,
  value,
  onChange,
  categories,
}: CodingProblemFormProps) {
  const [templates, setTemplates] = useState<AdminCodingStarterTemplateItem[]>(
    [],
  );

  useEffect(() => {
    void adminCodingProblemApi
      .listStarterTemplates()
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (t) onChange({ starterCode: { ...value.starterCode, ...t.starters } });
  };

  const snippetMode = isSnippetProblemForm(value);

  const toggleTier = (tier: CompanyTierTag) => {
    const set = new Set(value.companyTierTags ?? []);
    if (set.has(tier)) set.delete(tier);
    else set.add(tier);
    onChange({ companyTierTags: [...set] });
  };

  return (
    <div className="space-y-4">
      <Section title="Identity">
        {mode === "create" ? (
          <div>
            <Label className="text-xs text-muted-foreground">Problem ID</Label>
            <Input
              className="mt-1 h-10 font-mono text-sm"
              value={value.problemId ?? ""}
              onChange={(e) => onChange({ problemId: e.target.value })}
              placeholder="cp_two-sum"
            />
          </div>
        ) : (
          <p className="font-mono text-sm text-muted-foreground">
            {value.problemId}
          </p>
        )}
        <div>
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input
            className="mt-1 h-10"
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.isActive !== false}
            onChange={(e) => onChange({ isActive: e.target.checked })}
          />
          Active (included in interview selection)
        </label>
      </Section>

      <Section title="Classification">
        <AppSelect
          value={value.difficulty}
          onChange={(v) =>
            onChange({
              difficulty: v as CodingProblemFormValues["difficulty"],
            })
          }
          options={[
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
        />
        <StringListEditor
          label="Categories"
          value={value.categories ?? []}
          onChange={(categories) => onChange({ categories })}
          placeholder="arrays"
        />
        <StringListEditor
          label="Skill tags"
          value={value.skillTags ?? []}
          onChange={(skillTags) => onChange({ skillTags })}
          placeholder="dynamic-programming"
        />
        <div>
          <Label className="text-xs text-muted-foreground">Company tiers</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPANY_TIER_OPTIONS.map((tier) => {
              const on = (value.companyTierTags ?? []).includes(tier);
              return (
                <Button
                  key={tier}
                  type="button"
                  size="sm"
                  variant={on ? "default" : "outline"}
                  onClick={() => toggleTier(tier)}
                >
                  {tier}
                </Button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Problem statement">
        <StatementEditor
          value={value.statement}
          onChange={(statement) => onChange({ statement })}
        />
      </Section>

      <Section title="Starter code">
        <CodeTabsEditor
          label="Candidate starter templates"
          hint="At least Python or JavaScript is required."
          value={value.starterCode ?? {}}
          onChange={(starterCode) => onChange({ starterCode })}
          templateOptions={templates.map((t) => ({
            id: t.id,
            label: t.label,
          }))}
          onApplyTemplate={applyTemplate}
        />
      </Section>

      <Section title="Reference solution (admin only)">
        <CodeTabsEditor
          label="Correct solutions for validate-tests"
          hint="Never shown to candidates. Used to verify test cases via Judge0."
          value={value.referenceSolution ?? {}}
          onChange={(referenceSolution) => onChange({ referenceSolution })}
        />
      </Section>

      <Section title="Public test cases">
        {snippetMode ? (
          <SnippetCaseEditor
            variant="public"
            snippetMeta={value.snippetMeta}
            designMeta={value.designMeta}
            onSnippetMetaChange={(snippetMeta) => onChange({ snippetMeta })}
            onDesignMetaChange={(designMeta) => onChange({ designMeta })}
          />
        ) : (
          <TestCaseEditor
            label="Public tests (visible on Run)"
            hint="Use \\n for newlines in stdin. Shown to candidates."
            variant="public"
            cases={value.publicTests ?? []}
            onChange={(publicTests) => onChange({ publicTests })}
          />
        )}
      </Section>

      <Section title="Hidden test cases">
        {snippetMode ? (
          <SnippetCaseEditor
            variant="hidden"
            snippetMeta={value.snippetMeta}
            designMeta={value.designMeta}
            onSnippetMetaChange={(snippetMeta) => onChange({ snippetMeta })}
            onDesignMetaChange={(designMeta) => onChange({ designMeta })}
          />
        ) : (
          <TestCaseEditor
            label="Hidden tests (Submit only)"
            hint="Not shown to candidates. Used for final scoring."
            variant="hidden"
            cases={value.hiddenTests ?? []}
            onChange={(hiddenTests) => onChange({ hiddenTests })}
          />
        )}
      </Section>

      <Section title="Execution" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Execution mode</Label>
            <div className="mt-2">
              <Badge variant="outline">
                {value.executionMode === "snippet" ? "Snippet / function" : "Stdin I/O"}
              </Badge>
            </div>
          </div>
          <div>
          <Label className="text-xs text-muted-foreground">
            Time limit (ms, optional)
          </Label>
          <Input
            type="number"
            className="mt-1 h-10 max-w-xs"
            value={value.timeLimitMs ?? ""}
            onChange={(e) =>
              onChange({
                timeLimitMs: e.target.value
                  ? Number.parseInt(e.target.value, 10)
                  : undefined,
              })
            }
          />
          </div>
        </div>
      </Section>

      {mode === "edit" && value.problemId ? (
        <Section title="Validate tests" defaultOpen={false}>
          <ValidateTestsPanel
            problemId={value.problemId}
            referenceSolution={value.referenceSolution ?? {}}
            canValidate
          />
        </Section>
      ) : null}
    </div>
  );
}

interface CodingProblemFormFooterProps {
  readonly saving?: boolean;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly onDelete?: () => void;
  readonly deleteLabel?: string;
}

export function CodingProblemFormFooter({
  saving,
  onSave,
  onCancel,
  onDelete,
  deleteLabel = "Delete",
}: CodingProblemFormFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div>
        {onDelete ? (
          <Button type="button" variant="destructive" onClick={onDelete}>
            {deleteLabel}
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save problem"}
        </Button>
      </div>
    </div>
  );
}

export {
  emptyCodingProblemForm,
  detailToFormValues,
  validateCodingProblemForm,
  hiddenTestsWarning,
  formToUpsertBody,
} from "@/components/coding-admin/form-utils";
export type { CodingProblemFormValues } from "@/components/coding-admin/form-utils";
