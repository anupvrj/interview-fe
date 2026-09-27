"use client";

import { FormField } from "@/components/app/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InterviewQuestionsField } from "@/components/institute/InterviewQuestionsField";
import { JobRoleSelect } from "@/components/career/JobRoleSelect";
import type { InstituteScheduleRoundType } from "@/lib/institute-schedule-round";

const controlClass = "h-11 w-full border-border bg-card shadow-sm";

/** Shown under Expire deadline on institute schedule forms. */
export const INSTITUTE_SCHEDULE_EXPIRES_HINT =
  "Optional latest start. Must be ≥24h before scheduled time; clear for no limit.";

type Props = Readonly<{
  idPrefix: string;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  expiresAt: string;
  onExpiresAtChange: (value: string) => void;
  expiresHint?: string;
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
  disabled?: boolean;
  passingPlaceholder?: string;
  /** When set, role suggestions match peer / interview flows (industry-scoped catalog). */
  industry?: string;
  /** Controls which optional fields apply (defaults to AI mock). */
  roundType?: InstituteScheduleRoundType;
  /** Hide date/time and role when collected in an earlier wizard step. */
  hideScheduleWhenAndRole?: boolean;
  /** Hide expire when shown next to schedule in an earlier wizard step. */
  hideExpiresAt?: boolean;
  hideInterviewQuestions?: boolean;
  /** Role, experience, company, JD, duration, passing only (batch wizard step). */
  candidateContextOnly?: boolean;
  /** Hide role + candidate context (content step shows questions/problems elsewhere). */
  hideCandidateContext?: boolean;
  /** Hide duration and passing (collected on an earlier wizard step). */
  hideDurationAndPassing?: boolean;
}>;

export function InstituteScheduleFields({
  idPrefix,
  scheduledAt,
  onScheduledAtChange,
  expiresAt,
  onExpiresAtChange,
  expiresHint = INSTITUTE_SCHEDULE_EXPIRES_HINT,
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
  disabled,
  passingPlaceholder = "0–100; clear to remove threshold",
  industry,
  roundType = "ai_mock",
  hideScheduleWhenAndRole = false,
  hideExpiresAt = false,
  hideInterviewQuestions = false,
  candidateContextOnly = false,
  hideCandidateContext = false,
  hideDurationAndPassing = false,
}: Props) {
  const isAiMock = roundType === "ai_mock";
  const showSchedule = !candidateContextOnly && !hideScheduleWhenAndRole;
  const showExpires = !candidateContextOnly && !hideExpiresAt;
  const showRole =
    !hideCandidateContext &&
    (candidateContextOnly || !hideScheduleWhenAndRole);
  const showContextDetails = !hideCandidateContext;
  const showQuestions =
    isAiMock && !hideInterviewQuestions && !candidateContextOnly;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showSchedule ? (
        <FormField
          label="Date & time"
          htmlFor={`${idPrefix}-at`}
          required
        >
          <Input
            id={`${idPrefix}-at`}
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
            className={controlClass}
            disabled={disabled}
          />
        </FormField>
      ) : null}

      {showExpires ? (
        <FormField
          label="Expire deadline (optional)"
          htmlFor={`${idPrefix}-expires`}
          hint={expiresHint}
          className={hideScheduleWhenAndRole ? "sm:col-span-2" : undefined}
        >
          <Input
            id={`${idPrefix}-expires`}
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => onExpiresAtChange(e.target.value)}
            className={controlClass}
            disabled={disabled}
          />
        </FormField>
      ) : null}

      {showRole ? (
        <FormField
          label="Role / position"
          htmlFor={`${idPrefix}-role`}
          required
          hint="Choose from the role catalog or type a custom title (same list as mock interviews)."
          className="sm:col-span-2"
        >
          <JobRoleSelect
            id={`${idPrefix}-role`}
            value={role}
            onChange={onRoleChange}
            industry={industry}
            disabled={disabled}
            placeholder="e.g. Software Engineer, Product Manager"
            inputClassName={controlClass}
          />
        </FormField>
      ) : null}

      {showContextDetails ? (
        <>
          <FormField label="Years of experience" htmlFor={`${idPrefix}-exp`}>
            <Input
              id={`${idPrefix}-exp`}
              type="number"
              min={0}
              value={experience}
              onChange={(e) => onExperienceChange(e.target.value)}
              className={controlClass}
              disabled={disabled}
            />
          </FormField>

          <FormField label="Target company (optional)" htmlFor={`${idPrefix}-co`}>
            <Input
              id={`${idPrefix}-co`}
              value={company}
              onChange={(e) => onCompanyChange(e.target.value)}
              className={controlClass}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label="Job description (optional)"
            htmlFor={`${idPrefix}-jd`}
            hint={`Stored on this schedule and passed into the interview context (max ${maxJobDescriptionChars.toLocaleString()} characters).`}
            className="sm:col-span-2"
          >
            <Textarea
              id={`${idPrefix}-jd`}
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              placeholder="Paste the role’s JD — the AI uses it when the candidate starts the interview."
              className="min-h-[100px] resize-y text-sm"
              disabled={disabled}
              maxLength={maxJobDescriptionChars}
            />
          </FormField>

          {!hideDurationAndPassing && isAiMock ? (
            <FormField label="Duration" htmlFor={`${idPrefix}-dur`}>
              <Select
                value={duration}
                onValueChange={(v) => onDurationChange(v === "30" ? "30" : "15")}
                disabled={disabled}
              >
                <SelectTrigger id={`${idPrefix}-dur`} className={controlClass}>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          {!hideDurationAndPassing ? (
            <FormField
              label="Passing score (optional)"
              htmlFor={`${idPrefix}-pass`}
              hint="Overall score from 0–100 needed to pass. Leave empty for no threshold."
            >
              <Input
                id={`${idPrefix}-pass`}
                type="number"
                min={0}
                max={100}
                step={1}
                value={passingScore}
                onChange={(e) => onPassingScoreChange(e.target.value)}
                placeholder={passingPlaceholder}
                className={controlClass}
                disabled={disabled}
              />
            </FormField>
          ) : null}
        </>
      ) : null}

      {showQuestions ? (
        <FormField
          label="Interview questions"
          htmlFor={`${idPrefix}-q`}
          className="sm:col-span-2"
          hint="One question per line — the AI asks these in order (leave empty for generated questions)."
        >
          <InterviewQuestionsField
            id={`${idPrefix}-q`}
            value={questionsText}
            onChange={onQuestionsTextChange}
            disabled={disabled}
          />
        </FormField>
      ) : null}
    </div>
  );
}
