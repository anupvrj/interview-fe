"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { FormField } from "@/components/app/FormField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INSTITUTE_SCHEDULE_EXPIRES_HINT,
  InstituteScheduleFields,
} from "@/components/institute/InstituteScheduleFields";
import { InterviewQuestionsField } from "@/components/institute/InterviewQuestionsField";
import { InstituteScheduleInterviewTypeField } from "@/components/institute/InstituteScheduleInterviewTypeField";
import { InstituteScheduleRoundFields } from "@/components/institute/InstituteScheduleRoundFields";
import {
  InstituteFormStepper,
  type InstituteFormStep,
} from "@/components/institute/InstituteFormStepper";
import {
  instituteScheduleRoundLabel,
  validateInstituteScheduleRound,
  type InstituteScheduleRoundType,
} from "@/lib/institute-schedule-round";
import {
  mergeDatetimeLocalParts,
  splitDatetimeLocalValue,
} from "@/lib/utils";
import { CalendarClock, Layers3, UsersRound } from "lucide-react";
import { toast } from "sonner";

export const INSTITUTE_BATCH_SCHEDULE_WIZARD_STEPS: InstituteFormStep[] = [
  {
    number: 1,
    title: "Who & when",
    headline: "Batch & timing",
    description:
      "Batch, interview type, timing, optional expiry, duration (AI mock), and passing score.",
    icon: UsersRound,
  },
  {
    number: 2,
    title: "Role context",
    headline: "Candidate & role details",
    description: "Role title, experience, and optional company or job description.",
    icon: CalendarClock,
  },
  {
    number: 3,
    title: "Content",
    headline: "Questions & problems",
    description: "Custom AI questions or problems from the bank — then schedule everyone.",
    icon: Layers3,
  },
];

export const instituteBatchScheduleControlClass =
  "h-11 w-full border-border bg-card shadow-sm";

export type InstituteBatchScheduleSummary = Readonly<{
  name: string;
  memberCount: number;
}>;

export type ValidateBatchScheduleWizardContext = Readonly<{
  memberCount: number;
  hasSelectedBatch: boolean;
  scheduleAt: string;
  role: string;
  roundType: InstituteScheduleRoundType;
  codingProblemIds: string[];
  systemDesignProblemId: string;
}>;

export function validateInstituteBatchScheduleWizardStep(
  step: number,
  ctx: ValidateBatchScheduleWizardContext,
): boolean {
  const scheduleWhenParts = splitDatetimeLocalValue(ctx.scheduleAt);

  if (step === 1) {
    if (!ctx.hasSelectedBatch) {
      toast.error("Select a batch to continue.");
      return false;
    }
    if (ctx.memberCount === 0) {
      toast.error("This batch has no members.", {
        description: "Add candidates to the batch before scheduling.",
      });
      return false;
    }
    if (!scheduleWhenParts.date.trim()) {
      toast.error("Choose a date for the interview.");
      return false;
    }
    if (!scheduleWhenParts.time.trim()) {
      toast.error("Choose an interview time.");
      return false;
    }
    return true;
  }
  if (step === 2) {
    if (!ctx.role.trim()) {
      toast.error("Enter a role or position.");
      return false;
    }
    return true;
  }
  if (step === 3) {
    if (ctx.roundType === "ai_mock") {
      return true;
    }
    const roundErr = validateInstituteScheduleRound(
      ctx.roundType,
      ctx.codingProblemIds,
      ctx.systemDesignProblemId,
    );
    if (roundErr) {
      toast.error(roundErr);
      return false;
    }
    return true;
  }
  return true;
}

type WizardFormProps = Readonly<{
  idPrefix: string;
  wizardStep: number;
  disabled?: boolean;
  /** When set, step 1 shows this batch instead of a batch picker. */
  fixedBatch?: InstituteBatchScheduleSummary | null;
  /** Batch search UI for schedules page (step 1). Ignored when fixedBatch is set. */
  batchPicker?: ReactNode;
  batchSummary: InstituteBatchScheduleSummary | null;
  roundType: InstituteScheduleRoundType;
  onRoundTypeChange: (value: InstituteScheduleRoundType) => void;
  scheduleAt: string;
  onScheduleAtChange: (value: string) => void;
  expiresAt: string;
  onExpiresAtChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  experience: string;
  onExperienceChange: (value: string) => void;
  company: string;
  onCompanyChange: (value: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  maxJobDescriptionChars: number;
  duration: "15" | "30";
  onDurationChange: (value: "15" | "30") => void;
  questionsText: string;
  onQuestionsTextChange: (value: string) => void;
  passingScore: string;
  onPassingScoreChange: (value: string) => void;
  codingProblemIds: string[];
  onCodingProblemIdsChange: (ids: string[]) => void;
  systemDesignProblemId: string;
  onSystemDesignProblemIdChange: (id: string) => void;
}>;

export function InstituteBatchScheduleWizardForm({
  idPrefix,
  wizardStep,
  disabled,
  fixedBatch,
  batchPicker,
  batchSummary,
  roundType,
  onRoundTypeChange,
  scheduleAt,
  onScheduleAtChange,
  expiresAt,
  onExpiresAtChange,
  role,
  onRoleChange,
  experience,
  onExperienceChange,
  company,
  onCompanyChange,
  jobDescription,
  onJobDescriptionChange,
  maxJobDescriptionChars,
  duration,
  onDurationChange,
  questionsText,
  onQuestionsTextChange,
  passingScore,
  onPassingScoreChange,
  codingProblemIds,
  onCodingProblemIdsChange,
  systemDesignProblemId,
  onSystemDesignProblemIdChange,
}: WizardFormProps) {
  const scheduleWhenParts = useMemo(
    () => splitDatetimeLocalValue(scheduleAt),
    [scheduleAt],
  );

  const setScheduleDatePart = (date: string) => {
    onScheduleAtChange(
      mergeDatetimeLocalParts(date, scheduleWhenParts.time || "10:00"),
    );
  };

  const setScheduleTimePart = (time: string) => {
    onScheduleAtChange(
      mergeDatetimeLocalParts(scheduleWhenParts.date, time || "10:00"),
    );
  };

  const step1BatchBlock = fixedBatch ? (
    <div className="rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5 text-sm">
      <p className="font-medium text-foreground">
        {fixedBatch.name.trim() || "Untitled batch"}
        <span className="font-normal text-muted-foreground">
          {" "}
          · {fixedBatch.memberCount} member
          {fixedBatch.memberCount === 1 ? "" : "s"}
        </span>
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Scheduling one interview per member in this batch.
      </p>
    </div>
  ) : (
    batchPicker
  );

  return (
    <>
      <InstituteFormStepper
        steps={INSTITUTE_BATCH_SCHEDULE_WIZARD_STEPS}
        currentStep={wizardStep}
        className="mt-1"
      />

      <div className="space-y-6 py-2 pr-1">
        {wizardStep === 1 ? (
          <div className="space-y-4">
            {step1BatchBlock}

            <InstituteScheduleInterviewTypeField
              idPrefix={idPrefix}
              roundType={roundType}
              onRoundTypeChange={onRoundTypeChange}
              disabled={disabled}
              inputClassName={instituteBatchScheduleControlClass}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date" htmlFor={`${idPrefix}-date`} required>
                <Input
                  id={`${idPrefix}-date`}
                  type="date"
                  value={scheduleWhenParts.date}
                  onChange={(e) => setScheduleDatePart(e.target.value)}
                  className={instituteBatchScheduleControlClass}
                  disabled={disabled}
                />
              </FormField>
              <FormField
                label="Interview time"
                htmlFor={`${idPrefix}-time`}
                required
              >
                <Input
                  id={`${idPrefix}-time`}
                  type="time"
                  value={scheduleWhenParts.time}
                  onChange={(e) => setScheduleTimePart(e.target.value)}
                  className={instituteBatchScheduleControlClass}
                  disabled={disabled}
                />
              </FormField>
              <FormField
                label="Expire deadline (optional)"
                htmlFor={`${idPrefix}-expires`}
                hint={INSTITUTE_SCHEDULE_EXPIRES_HINT}
                className="sm:col-span-2"
              >
                <Input
                  id={`${idPrefix}-expires`}
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => onExpiresAtChange(e.target.value)}
                  className={instituteBatchScheduleControlClass}
                  disabled={disabled}
                />
              </FormField>
              {roundType === "ai_mock" ? (
                <FormField label="Duration" htmlFor={`${idPrefix}-dur`}>
                  <Select
                    value={duration}
                    onValueChange={(v) =>
                      onDurationChange(v === "30" ? "30" : "15")
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger
                      id={`${idPrefix}-dur`}
                      className={instituteBatchScheduleControlClass}
                    >
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              ) : null}
              <FormField
                label="Passing score (optional)"
                htmlFor={`${idPrefix}-pass`}
                hint="Overall score from 0–100 needed to pass. Leave empty for no threshold."
                className={roundType === "ai_mock" ? undefined : "sm:col-span-2"}
              >
                <Input
                  id={`${idPrefix}-pass`}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={passingScore}
                  onChange={(e) => onPassingScoreChange(e.target.value)}
                  placeholder="0–100; overall score needed to pass"
                  className={instituteBatchScheduleControlClass}
                  disabled={disabled}
                />
              </FormField>
            </div>
          </div>
        ) : null}

        {wizardStep === 2 ? (
          <InstituteScheduleFields
            idPrefix={idPrefix}
            roundType={roundType}
            scheduledAt={scheduleAt}
            onScheduledAtChange={onScheduleAtChange}
            expiresAt={expiresAt}
            onExpiresAtChange={onExpiresAtChange}
            candidateContextOnly
            hideDurationAndPassing
            role={role}
            onRoleChange={onRoleChange}
            experience={experience}
            onExperienceChange={onExperienceChange}
            company={company}
            onCompanyChange={onCompanyChange}
            jobDescription={jobDescription}
            onJobDescriptionChange={onJobDescriptionChange}
            maxJobDescriptionChars={maxJobDescriptionChars}
            duration={duration}
            onDurationChange={onDurationChange}
            questionsText={questionsText}
            onQuestionsTextChange={onQuestionsTextChange}
            passingScore={passingScore}
            onPassingScoreChange={onPassingScoreChange}
            disabled={disabled}
            passingPlaceholder="0–100; overall score needed to pass"
          />
        ) : null}

        {wizardStep === 3 ? (
          <div className="space-y-4">
            {batchSummary ? (
              <div className="rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5 text-sm">
                <p className="font-medium text-foreground">
                  {batchSummary.name.trim() || "Untitled batch"}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {batchSummary.memberCount} member
                    {batchSummary.memberCount === 1 ? "" : "s"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {scheduleWhenParts.date && scheduleWhenParts.time
                    ? `${new Date(scheduleAt).toLocaleString()} · `
                    : null}
                  {role.trim() ? `${role.trim()} · ` : null}
                  {instituteScheduleRoundLabel(roundType)}
                </p>
              </div>
            ) : null}
            {roundType === "ai_mock" ? (
              <FormField
                label="Interview questions"
                htmlFor={`${idPrefix}-q-step`}
                hint="One question per line — the AI asks these in order (leave empty for generated questions)."
              >
                <InterviewQuestionsField
                  id={`${idPrefix}-q-step`}
                  value={questionsText}
                  onChange={onQuestionsTextChange}
                  disabled={disabled}
                />
              </FormField>
            ) : (
              <InstituteScheduleRoundFields
                idPrefix={idPrefix}
                roundType={roundType}
                onRoundTypeChange={onRoundTypeChange}
                codingProblemIds={codingProblemIds}
                onCodingProblemIdsChange={onCodingProblemIdsChange}
                systemDesignProblemId={systemDesignProblemId}
                onSystemDesignProblemIdChange={onSystemDesignProblemIdChange}
                disabled={disabled}
                showTypeSelector={false}
              />
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
