"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CompanyTagInput } from "@/components/system-design-admin/CompanyTagInput";
import { StringListEditor } from "@/components/system-design-admin/StringListEditor";
import { StarRatingInput } from "@/components/system-design-admin/StarRatingInput";
import type {
  AdminSystemDesignProblemDetail,
  AdminSystemDesignProblemUpsertBody,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const PROBLEM_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELD_LABEL =
  "text-xs font-medium leading-snug text-muted-foreground";
const INPUT_CLASS = "h-10 bg-card shadow-none";

export type SystemDesignProblemFormValues = AdminSystemDesignProblemUpsertBody & {
  problemId?: string;
};

function FormField({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: Readonly<{
  label: ReactNode;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}>) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className={FIELD_LABEL}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Label left, control right on md+; stacked on mobile. */
function FormRow({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: Readonly<{
  label: ReactNode;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1.5 md:grid-cols-[11rem_minmax(0,1fr)] md:items-start md:gap-x-5 lg:grid-cols-[12rem_minmax(0,1fr)]",
        className,
      )}
    >
      <Label
        htmlFor={htmlFor}
        className={cn(FIELD_LABEL, "md:pt-2.5")}
      >
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div className="min-w-0">
        {children}
        {hint ? (
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function emptySystemDesignProblemForm(): SystemDesignProblemFormValues {
  return {
    title: "",
    shortTitle: "",
    category: "",
    difficulty: "medium",
    scenario: "",
    askedAt: [],
    legacyAliases: [],
    coreRequirements: [],
    outOfScopeFunctional: [],
    scaleRequirements: [],
    outOfScopeNonFunctional: [],
    coreEntities: [],
    apiHints: [],
    considerations: [],
    levelExpectations: { mid: "", senior: "", staff: "" },
    sortOrder: 0,
    isActive: true,
  };
}

export function detailToFormValues(
  detail: AdminSystemDesignProblemDetail,
): SystemDesignProblemFormValues {
  return {
    problemId: detail.problemId,
    knowledgeDocId: detail.knowledgeDocId,
    legacyAliases: detail.legacyAliases ?? [],
    title: detail.title,
    shortTitle: detail.shortTitle,
    analog: detail.analog,
    category: detail.category,
    difficulty: detail.difficulty,
    askedAt: detail.askedAt ?? [],
    scenario: detail.scenario,
    descriptionHtml: detail.descriptionHtml,
    coreRequirements: detail.coreRequirements ?? [],
    outOfScopeFunctional: detail.outOfScopeFunctional ?? [],
    scaleRequirements: detail.scaleRequirements ?? [],
    outOfScopeNonFunctional: detail.outOfScopeNonFunctional ?? [],
    coreEntities: detail.coreEntities ?? [],
    apiHints: detail.apiHints ?? [],
    considerations: detail.considerations ?? [],
    levelExpectations: {
      mid: detail.levelExpectations?.mid ?? "",
      senior: detail.levelExpectations?.senior ?? "",
      staff: detail.levelExpectations?.staff ?? "",
    },
    adminRating: detail.adminRating,
    sortOrder: detail.sortOrder ?? 0,
    isActive: detail.isActive,
  };
}

interface SystemDesignProblemFormProps {
  readonly mode: "create" | "edit";
  readonly value: SystemDesignProblemFormValues;
  readonly onChange: (value: SystemDesignProblemFormValues) => void;
  readonly categories: string[];
  readonly sourcePath?: string;
  readonly corpusVersion?: string;
  readonly disabled?: boolean;
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border border-border/70 bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5"
        onClick={() => setOpen((v) => !v)}
      >
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="space-y-5 border-t border-border/60 px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function SystemDesignProblemForm({
  mode,
  value,
  onChange,
  categories,
  sourcePath,
  corpusVersion,
  disabled,
}: SystemDesignProblemFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categoryOptions = useMemo(() => {
    const set = new Set(categories);
    if (value.category) set.add(value.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, value.category]);

  const patch = (partial: Partial<SystemDesignProblemFormValues>) => {
    onChange({ ...value, ...partial });
  };

  const problemIdValid =
    mode === "edit" ||
    (!!value.problemId && PROBLEM_ID_RE.test(value.problemId));

  return (
    <div className="space-y-4">
      <Section title="Identity">
        {mode === "create" ? (
          <FormRow
            label="Problem ID"
            htmlFor="problemId"
            required
            hint="Kebab-case slug — immutable after create."
          >
            <Input
              id="problemId"
              value={value.problemId ?? ""}
              disabled={disabled}
              placeholder="design-a-chat-app"
              className={INPUT_CLASS}
              onChange={(e) =>
                patch({
                  problemId: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-"),
                })
              }
            />
            {!problemIdValid && value.problemId ? (
              <p className="mt-1.5 text-xs text-destructive">
                Use lowercase letters, numbers, and hyphens only.
              </p>
            ) : null}
          </FormRow>
        ) : (
          <FormRow label="Problem ID">
            <p className="pt-2 font-mono text-sm text-foreground">
              {value.problemId}
            </p>
          </FormRow>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Title" htmlFor="title" required>
            <Input
              id="title"
              value={value.title}
              disabled={disabled}
              className={INPUT_CLASS}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </FormField>
          <FormField label="Short title" htmlFor="shortTitle" required>
            <Input
              id="shortTitle"
              value={value.shortTitle}
              disabled={disabled}
              className={INPUT_CLASS}
              onChange={(e) => patch({ shortTitle: e.target.value })}
            />
          </FormField>
        </div>

        <FormRow label="Analog" htmlFor="analog" hint="Optional real-world comparison.">
          <Input
            id="analog"
            value={value.analog ?? ""}
            disabled={disabled}
            className={INPUT_CLASS}
            placeholder="e.g. WhatsApp, Uber"
            onChange={(e) => patch({ analog: e.target.value || undefined })}
          />
        </FormRow>

        <div className="grid gap-5 md:grid-cols-3">
          <FormField label="Category" htmlFor="category" required>
            <Input
              id="category"
              list="sd-category-options"
              value={value.category}
              disabled={disabled}
              placeholder="e.g. Messaging"
              className={INPUT_CLASS}
              onChange={(e) => patch({ category: e.target.value })}
            />
            <datalist id="sd-category-options">
              {categoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Difficulty" required>
            <AppSelect
              value={value.difficulty}
              disabled={disabled}
              className={INPUT_CLASS}
              onChange={(v) =>
                patch({
                  difficulty: v as SystemDesignProblemFormValues["difficulty"],
                })
              }
              options={[
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
            />
          </FormField>
          <FormField label="Sort order" htmlFor="sortOrder">
            <Input
              id="sortOrder"
              type="number"
              disabled={disabled}
              value={value.sortOrder ?? 0}
              className={INPUT_CLASS}
              onChange={(e) =>
                patch({ sortOrder: Number.parseInt(e.target.value, 10) || 0 })
              }
            />
          </FormField>
        </div>

        <FormRow label="Admin rating">
          <StarRatingInput
            value={value.adminRating}
            disabled={disabled}
            onChange={(adminRating) => patch({ adminRating })}
          />
        </FormRow>

        <FormRow label="Visibility">
          <label className="flex min-h-10 items-center gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={value.isActive !== false}
              disabled={disabled}
              onChange={(e) => patch({ isActive: e.target.checked })}
            />
            Active — visible in candidate hub
          </label>
        </FormRow>
      </Section>

      <Section title="Companies & aliases">
        <FormRow label="Asked at">
          <CompanyTagInput
            value={value.askedAt ?? []}
            disabled={disabled}
            onChange={(askedAt) => patch({ askedAt })}
          />
        </FormRow>
        <FormRow label="Legacy aliases" hint="Alternate problem IDs for old sessions.">
          <CompanyTagInput
            value={value.legacyAliases ?? []}
            disabled={disabled}
            placeholder="Legacy problem ID alias"
            onChange={(legacyAliases) => patch({ legacyAliases })}
          />
        </FormRow>
      </Section>

      <Section title="Problem statement">
        <FormRow label="Scenario" required>
          <RichTextEditor
            value={value.scenario}
            showAiRefine={false}
            placeholder="Describe the system design scenario…"
            onChange={(scenario) => patch({ scenario })}
          />
        </FormRow>
      </Section>

      <Section title="Requirements">
        <div className="space-y-6">
          <StringListEditor
            label="Core requirements (functional)"
            value={value.coreRequirements ?? []}
            disabled={disabled}
            onChange={(coreRequirements) => patch({ coreRequirements })}
          />
          <StringListEditor
            label="Out of scope (functional)"
            value={value.outOfScopeFunctional ?? []}
            disabled={disabled}
            onChange={(outOfScopeFunctional) => patch({ outOfScopeFunctional })}
          />
          <StringListEditor
            label="Scale / reliability requirements"
            value={value.scaleRequirements ?? []}
            disabled={disabled}
            onChange={(scaleRequirements) => patch({ scaleRequirements })}
          />
          <StringListEditor
            label="Out of scope (non-functional)"
            value={value.outOfScopeNonFunctional ?? []}
            disabled={disabled}
            onChange={(outOfScopeNonFunctional) =>
              patch({ outOfScopeNonFunctional })
            }
          />
          <StringListEditor
            label="Core entities"
            value={value.coreEntities ?? []}
            disabled={disabled}
            onChange={(coreEntities) => patch({ coreEntities })}
          />
          <StringListEditor
            label="API hints"
            value={value.apiHints ?? []}
            disabled={disabled}
            onChange={(apiHints) => patch({ apiHints })}
          />
          <StringListEditor
            label="Considerations"
            value={value.considerations ?? []}
            disabled={disabled}
            onChange={(considerations) => patch({ considerations })}
          />
        </div>
      </Section>

      <Section title="Level expectations">
        <div className="space-y-5">
          <FormRow label="Mid level">
            <RichTextEditor
              value={value.levelExpectations?.mid ?? ""}
              showAiRefine={false}
              onChange={(mid) =>
                patch({
                  levelExpectations: { ...value.levelExpectations, mid },
                })
              }
            />
          </FormRow>
          <FormRow label="Senior level">
            <RichTextEditor
              value={value.levelExpectations?.senior ?? ""}
              showAiRefine={false}
              onChange={(senior) =>
                patch({
                  levelExpectations: { ...value.levelExpectations, senior },
                })
              }
            />
          </FormRow>
          <FormRow label="Staff+ level">
            <RichTextEditor
              value={value.levelExpectations?.staff ?? ""}
              showAiRefine={false}
              onChange={(staff) =>
                patch({
                  levelExpectations: { ...value.levelExpectations, staff },
                })
              }
            />
          </FormRow>
        </div>
      </Section>

      <section className="rounded-lg border border-border/70 bg-card">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <h3 className="text-sm font-semibold text-foreground">Advanced</h3>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              showAdvanced && "rotate-180",
            )}
          />
        </button>
        {showAdvanced ? (
          <div className="space-y-5 border-t border-border/60 px-4 py-4 sm:px-5 sm:py-5">
            <FormRow
              label="Knowledge doc ID"
              htmlFor="knowledgeDocId"
              hint="Pinecone linkage — auto-generated from title if blank on create."
            >
              <Input
                id="knowledgeDocId"
                value={value.knowledgeDocId ?? ""}
                disabled={disabled || mode === "edit"}
                placeholder="design-a-chat-app"
                className={INPUT_CLASS}
                onChange={(e) => patch({ knowledgeDocId: e.target.value })}
              />
            </FormRow>
            {mode === "edit" ? (
              <>
                <FormRow label="Source path">
                  <p className="pt-2 text-sm text-muted-foreground">
                    {sourcePath ?? "—"}
                  </p>
                </FormRow>
                <FormRow label="Corpus version">
                  <p className="pt-2 text-sm text-muted-foreground">
                    {corpusVersion ?? "—"}
                  </p>
                </FormRow>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function SystemDesignProblemFormFooter({
  saving,
  onSave,
  onCancel,
  onDelete,
  deleteLabel = "Delete",
}: {
  readonly saving?: boolean;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly onDelete?: () => void;
  readonly deleteLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save"
        )}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      {onDelete ? (
        <Button
          type="button"
          variant="destructive"
          className="ml-auto"
          disabled={saving}
          onClick={onDelete}
        >
          {deleteLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function validateSystemDesignProblemForm(
  value: SystemDesignProblemFormValues,
  mode: "create" | "edit",
): string | null {
  if (mode === "create") {
    if (!value.problemId?.trim()) return "Problem ID is required";
    if (!PROBLEM_ID_RE.test(value.problemId)) return "Invalid problem ID format";
  }
  if (!value.title.trim()) return "Title is required";
  if (!value.shortTitle.trim()) return "Short title is required";
  if (!value.category.trim()) return "Category is required";
  if (!value.scenario.trim()) return "Scenario is required";
  return null;
}
