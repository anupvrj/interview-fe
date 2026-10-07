"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CalendarClock, Flag, Loader2, Play, Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { InstituteFormStepper, type InstituteFormStep } from "@/components/institute/InstituteFormStepper";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/ui/app-select";
import { appPrimaryButton } from "@/lib/app-theme";
import { adminCodingProblemApi, adminSystemDesignApi } from "@/lib/api";
import {
  hackathonAdminApi,
  toHackathonError,
  type AdminHackathonOverview,
  type AdminHackathonWriteBody,
  type HackathonChallengeKind,
} from "../api";
import { HACKATHON_ADMIN_PATH, HACKATHON_TARGETS } from "../config";
import { formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { HackathonAdminField, HackathonAdminFieldRow, hackathonAdminControlClass } from "./HackathonAdminField";
import { isoToIstInput, istInputToIso } from "./time";

const STEPS: InstituteFormStep[] = [
  {
    number: 1,
    title: "Event",
    headline: "Name the hackathon",
    description: "Title, public URL, and the copy that appears on the generic event page.",
    icon: Trophy,
  },
  {
    number: 2,
    title: "Challenges",
    headline: "Build the challenge list",
    description: "Add resume, screening, coding, system design, or social — in the order participants will take them.",
    icon: Sparkles,
  },
  {
    number: 3,
    title: "Window",
    headline: "Schedule and capacity",
    description: "Start and end times in IST, participant cap, and interview grace.",
    icon: CalendarClock,
  },
];

const KIND_OPTIONS: Array<{ value: HackathonChallengeKind; label: string }> = [
  { value: "resume", label: "Resume design" },
  { value: "screening", label: "Screening (AI mock)" },
  { value: "coding", label: "Coding round" },
  { value: "system_design", label: "System design" },
  { value: "social", label: "Social share" },
];

type VoiceProvider = "gemini" | "gemini38" | "gemini38extended" | "chatgpt" | "sarvam";

type ChallengeForm = {
  clientId: string;
  challengeId?: string;
  kind: HackathonChallengeKind;
  title: string;
  description: string;
  minScore: string;
  requiredCount: string;
  durationMinutes: "15" | "30";
  maxAttemptsPerSlot: string;
  voiceProvider: VoiceProvider;
  codingProblemIds: string[];
  systemDesignProblemId: string;
};

type FormState = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  registerCta: string;
  atsScore: string;
  interviewScore: string;
  challenges: ChallengeForm[];
  maxConcurrent: string;
  startsAt: string;
  endsAt: string;
  grace: string;
  limit: string;
  reminderEnabled: boolean;
  reminderHour: string;
  reminderStart: string;
};

function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function newClientId() {
  return `tmp_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultsForKind(kind: HackathonChallengeKind): Pick<ChallengeForm, "title" | "description"> {
  if (kind === "resume") {
    return {
      title: "Design your resume",
      description: "Build an ATS-friendly resume in the InterviewTrix builder, then submit it here.",
    };
  }
  if (kind === "screening") {
    return {
      title: "Ace a mock interview",
      description: "Take an AI mock interview based on your resume and profile.",
    };
  }
  if (kind === "coding") {
    return { title: "Coding round", description: "Solve the assigned coding problem(s) in the InterviewTrix editor." };
  }
  if (kind === "system_design") {
    return { title: "System design", description: "Design the assigned system on the InterviewTrix canvas." };
  }
  return {
    title: "Share your experience",
    description: "Post about the hackathon on LinkedIn and Instagram, then paste both post links.",
  };
}

function emptyChallenge(kind: HackathonChallengeKind = "screening"): ChallengeForm {
  return {
    clientId: newClientId(),
    kind,
    ...defaultsForKind(kind),
    minScore: "",
    requiredCount: "1",
    durationMinutes: "15",
    maxAttemptsPerSlot: "3",
    voiceProvider: "gemini",
    codingProblemIds: [],
    systemDesignProblemId: "",
  };
}

function emptyForm(): FormState {
  return {
    title: "",
    slug: "",
    tagline: "",
    description: "",
    registerCta: "",
    atsScore: String(HACKATHON_TARGETS.atsScore),
    interviewScore: String(HACKATHON_TARGETS.interviewScore),
    challenges: [emptyChallenge("resume"), emptyChallenge("screening"), emptyChallenge("social")],
    maxConcurrent: "50",
    startsAt: "",
    endsAt: "",
    grace: "20",
    limit: "",
    reminderEnabled: true,
    reminderHour: "9",
    reminderStart: "",
  };
}

function fromOverview(h: AdminHackathonOverview): FormState {
  const challenges = (h.challenges ?? []).map((c) => {
    const kind: HackathonChallengeKind =
      c.kind ??
      (c.key === "resume_submission" ? "resume" : c.key === "social_share" ? "social" : "screening");
    return {
      clientId: c.challengeId ?? newClientId(),
      challengeId: c.challengeId,
      kind,
      title: c.title,
      description: c.description ?? "",
      minScore: c.config?.minScore != null ? String(c.config.minScore) : "",
      requiredCount: String(c.config?.requiredCount ?? (kind === "screening" ? h.interviewConfig.requiredCount : 1)),
      durationMinutes: (c.config?.durationMinutes === 30 ? "30" : "15") as "15" | "30",
      maxAttemptsPerSlot: String(c.config?.maxAttemptsPerSlot ?? h.interviewConfig.maxAttemptsPerSlot ?? 3),
      voiceProvider: (c.config?.voiceProvider as VoiceProvider) || (h.interviewConfig.voiceProvider as VoiceProvider) || "gemini",
      codingProblemIds: c.config?.codingProblemIds ?? [],
      systemDesignProblemId: c.config?.systemDesignProblemId ?? "",
    };
  });
  return {
    title: h.title,
    slug: h.slug,
    tagline: h.landing?.tagline ?? "",
    description: h.landing?.description ?? "",
    registerCta: h.landing?.registerCta ?? "",
    atsScore: String(h.targets?.atsScore ?? HACKATHON_TARGETS.atsScore),
    interviewScore: String(h.targets?.interviewScore ?? HACKATHON_TARGETS.interviewScore),
    challenges: challenges.length ? challenges : emptyForm().challenges,
    maxConcurrent: String(h.interviewConfig.maxConcurrent ?? 50),
    startsAt: isoToIstInput(h.startsAt),
    endsAt: isoToIstInput(h.endsAt),
    grace: String(h.interviewGraceMinutes),
    limit: h.maxCompletions === null ? "" : String(h.maxCompletions),
    reminderEnabled: h.reminders?.enabled !== false,
    reminderHour: String(h.reminders?.hour ?? 9),
    reminderStart: isoToIstInput(h.reminders?.startAt),
  };
}

function toBody(form: FormState): AdminHackathonWriteBody & { title: string; slug: string } {
  const ats = Number(form.atsScore);
  const interview = Number(form.interviewScore);
  const grace = Number(form.grace);
  const concurrent = Number(form.maxConcurrent);
  const trimmedLimit = form.limit.trim();
  return {
    title: form.title.trim(),
    slug: form.slug.trim().toLowerCase(),
    landing: {
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      registerCta: form.registerCta.trim(),
    },
    targets: {
      atsScore: Number.isInteger(ats) ? ats : HACKATHON_TARGETS.atsScore,
      interviewScore: Number.isInteger(interview) ? interview : HACKATHON_TARGETS.interviewScore,
    },
    challenges: form.challenges.map((c) => {
      const min = c.minScore.trim() === "" ? null : Number(c.minScore);
      const config: NonNullable<AdminHackathonWriteBody["challenges"]>[number]["config"] = {
        minScore: Number.isInteger(min) ? min : null,
      };
      if (c.kind === "screening" || c.kind === "coding" || c.kind === "system_design") {
        config.requiredCount = Number(c.requiredCount) || 1;
        config.maxAttemptsPerSlot = Number(c.maxAttemptsPerSlot) || 3;
      }
      if (c.kind === "screening") {
        config.durationMinutes = c.durationMinutes === "30" ? 30 : 15;
        config.voiceProvider = c.voiceProvider;
      }
      if (c.kind === "coding") config.codingProblemIds = c.codingProblemIds;
      if (c.kind === "system_design") config.systemDesignProblemId = c.systemDesignProblemId || undefined;
      if (c.kind === "social") config.requiredPlatforms = ["linkedin", "instagram"];
      return {
        challengeId: c.challengeId,
        kind: c.kind,
        title: c.title.trim(),
        description: c.description.trim(),
        config,
      };
    }),
    interviewConfig: {
      maxConcurrent: Number.isInteger(concurrent) ? concurrent : 50,
    },
    startsAt: form.startsAt ? istInputToIso(form.startsAt) : null,
    endsAt: form.endsAt ? istInputToIso(form.endsAt) ?? undefined : undefined,
    interviewGraceMinutes: Number.isInteger(grace) ? grace : 20,
    maxCompletions: trimmedLimit === "" ? null : Number(trimmedLimit),
    reminders: {
      enabled: form.reminderEnabled,
      hour: Number(form.reminderHour),
      startAt: form.reminderStart ? istInputToIso(form.reminderStart) : null,
    },
  };
}

const START_CLOCK_SKEW_MS = 2 * 60_000;

function assertDesignerWrite(form: FormState, body: ReturnType<typeof toBody>, mode: "save" | "startNow") {
  if (body.title.length < 3) throw new Error("Title must be at least 3 characters.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || body.slug.length < 3) {
    throw new Error("Slug must be lowercase kebab-case, 3–80 characters.");
  }
  if (!form.challenges.length) throw new Error("Add at least one challenge.");
  if (form.challenges.some((c) => !c.title.trim())) throw new Error("Every challenge needs a title.");
  if (form.challenges.filter((c) => c.kind === "resume").length > 1) {
    throw new Error("Only one resume challenge is allowed.");
  }
  if (form.challenges.filter((c) => c.kind === "social").length > 1) {
    throw new Error("Only one social challenge is allowed.");
  }
  if (form.challenges.some((c) => c.kind === "coding" && c.codingProblemIds.length === 0)) {
    throw new Error("Pick at least one coding problem.");
  }
  if (form.challenges.some((c) => c.kind === "system_design" && !c.systemDesignProblemId)) {
    throw new Error("Pick a system design problem.");
  }
  if (form.startsAt && !body.startsAt) throw new Error("Enter a valid start date and time.");
  if (form.endsAt && !body.endsAt) throw new Error("Enter a valid end date and time.");
  if (form.reminderStart && !body.reminders?.startAt) throw new Error("Enter a valid reminder start date.");
  const reminderHour = body.reminders?.hour;
  if (reminderHour === undefined || !Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) {
    throw new Error("Reminder hour must be from 0 to 23.");
  }
  if (mode === "startNow") {
    if (body.endsAt && Date.parse(body.endsAt) <= Date.now()) {
      throw new Error("The end date is already in the past. Clear it or pick a time in the future.");
    }
    return { ...body, startsAt: null };
  }
  if (body.startsAt && Date.parse(body.startsAt) <= Date.now() - START_CLOCK_SKEW_MS) {
    throw new Error("Start must be in the future. Leave it empty, or use Start now to open immediately.");
  }
  return body;
}

export function AdminHackathonDesignerPage({ hackathonId }: Readonly<{ hackathonId?: string }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(hackathonId);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(editing);
  const [confirmStart, setConfirmStart] = useState(false);

  const existing = useQuery({
    queryKey: hackathonKeys.adminOne(hackathonId ?? ""),
    queryFn: () => hackathonAdminApi.get(hackathonId!),
    enabled: editing,
  });

  const codingProblems = useQuery({
    queryKey: ["admin", "coding-problems", "hackathon-picker"],
    queryFn: () => adminCodingProblemApi.list({ isActive: true, limit: 100, sortBy: "title", sortDir: "asc" }),
  });
  const sdProblems = useQuery({
    queryKey: ["admin", "system-design-problems", "hackathon-picker"],
    queryFn: () => adminSystemDesignApi.list({ isActive: true, limit: 100, sortBy: "title", sortDir: "asc" }),
  });

  useEffect(() => {
    if (existing.data) setForm(fromOverview(existing.data));
  }, [existing.data]);

  useEffect(() => {
    if (slugTouched) return;
    setForm((prev) => ({ ...prev, slug: slugFromTitle(prev.title) }));
  }, [form.title, slugTouched]);

  const locked = Boolean(existing.data?.designLocked);
  const patch = (partial: Partial<FormState>) => setForm((prev) => ({ ...prev, ...partial }));
  const patchChallenge = (clientId: string, partial: Partial<ChallengeForm>) =>
    setForm((prev) => ({
      ...prev,
      challenges: prev.challenges.map((c) => (c.clientId === clientId ? { ...c, ...partial } : c)),
    }));

  const save = useMutation({
    mutationFn: async (mode: "save" | "startNow" = "save") => {
      const body = assertDesignerWrite(form, toBody(form), mode);
      let data: AdminHackathonOverview;
      if (editing) {
        const res = await hackathonAdminApi.update(hackathonId!, body);
        data = res.data;
      } else {
        data = await hackathonAdminApi.create(body);
      }
      if (mode === "startNow") {
        data = await hackathonAdminApi.start(data.hackathonId);
      }
      return { data, mode };
    },
    onSuccess: ({ data, mode }) => {
      void queryClient.invalidateQueries({ queryKey: hackathonKeys.adminList });
      queryClient.setQueryData(hackathonKeys.adminOne(data.hackathonId), data);
      toast.success(mode === "startNow" ? "Hackathon is live" : editing ? "Hackathon saved" : "Draft created");
      router.push(HACKATHON_ADMIN_PATH);
    },
    onError: (err) => {
      const message = err instanceof Error && !("response" in err) ? err.message : toHackathonError(err).message;
      toast.error(message);
    },
  });

  const stepValid = useMemo(() => {
    if (step === 1) return form.title.trim().length >= 3 && form.slug.trim().length >= 3;
    if (step === 2) return form.challenges.length > 0 && form.challenges.every((c) => c.title.trim().length > 0);
    return true;
  }, [form, step]);

  if (editing && existing.isLoading) {
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading hackathon…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SuperAdminPageHeader
        backHref={HACKATHON_ADMIN_PATH}
        backLabel="Hackathons"
        title={editing ? "Edit hackathon" : "Create hackathon"}
        description={
          locked
            ? "Structure is locked after the first registration. You can still edit copy, dates, and limits."
            : "Saved as a draft. Publish from the operate card when the public page should go live."
        }
      />
      <InstituteFormStepper steps={STEPS} currentStep={step} />
      <Card>
        <CardContent className="space-y-5 pt-6">
          {step === 1 ? (
            <>
              <HackathonAdminFieldRow id="hk-title" label="Title">
                <Input id="hk-title" className={hackathonAdminControlClass} value={form.title} onChange={(e) => patch({ title: e.target.value })} />
              </HackathonAdminFieldRow>
              <HackathonAdminFieldRow id="hk-slug" label="Public URL slug" hint="Shown as /hackathon/your-slug">
                <Input
                  id="hk-slug"
                  className={hackathonAdminControlClass}
                  value={form.slug}
                  disabled={locked}
                  onChange={(e) => {
                    setSlugTouched(true);
                    patch({ slug: e.target.value.toLowerCase() });
                  }}
                />
              </HackathonAdminFieldRow>
              <HackathonAdminFieldRow id="hk-tagline" label="Tagline">
                <Input id="hk-tagline" className={hackathonAdminControlClass} value={form.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
              </HackathonAdminFieldRow>
              <HackathonAdminFieldRow id="hk-desc" label="Description">
                <Textarea id="hk-desc" rows={4} className="w-full min-w-0" value={form.description} onChange={(e) => patch({ description: e.target.value })} />
              </HackathonAdminFieldRow>
              <HackathonAdminFieldRow id="hk-cta" label="Register button" hint="Leave empty to use the default.">
                <Input id="hk-cta" className={hackathonAdminControlClass} value={form.registerCta} onChange={(e) => patch({ registerCta: e.target.value })} />
              </HackathonAdminFieldRow>
              <div className="grid gap-4 md:grid-cols-2">
                <HackathonAdminField id="hk-ats" label="ATS display target">
                  <Input id="hk-ats" type="number" min={0} max={100} className={hackathonAdminControlClass} value={form.atsScore} onChange={(e) => patch({ atsScore: e.target.value })} />
                </HackathonAdminField>
                <HackathonAdminField id="hk-iv" label="Interview display target">
                  <Input
                    id="hk-iv"
                    type="number"
                    min={0}
                    max={100}
                    className={hackathonAdminControlClass}
                    value={form.interviewScore}
                    onChange={(e) => patch({ interviewScore: e.target.value })}
                  />
                </HackathonAdminField>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {form.challenges.map((challenge, index) => (
                <div key={challenge.clientId} className="space-y-4 rounded-xl border border-border/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Challenge {index + 1}</p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={locked || index === 0}
                        onClick={() =>
                          setForm((prev) => {
                            const next = [...prev.challenges];
                            [next[index - 1], next[index]] = [next[index], next[index - 1]];
                            return { ...prev, challenges: next };
                          })
                        }
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={locked || index === form.challenges.length - 1}
                        onClick={() =>
                          setForm((prev) => {
                            const next = [...prev.challenges];
                            [next[index + 1], next[index]] = [next[index], next[index + 1]];
                            return { ...prev, challenges: next };
                          })
                        }
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={locked || form.challenges.length === 1}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            challenges: prev.challenges.filter((c) => c.clientId !== challenge.clientId),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <HackathonAdminFieldRow id={`${challenge.clientId}-kind`} label="Type" hint={locked ? "Locked after the first registration." : undefined}>
                    <AppSelect
                      id={`${challenge.clientId}-kind`}
                      value={challenge.kind}
                      disabled={locked}
                      onChange={(value) => {
                        const kind = value as HackathonChallengeKind;
                        patchChallenge(challenge.clientId, { kind, ...defaultsForKind(kind) });
                      }}
                      options={KIND_OPTIONS}
                    />
                  </HackathonAdminFieldRow>
                  <HackathonAdminFieldRow id={`${challenge.clientId}-title`} label="Title">
                    <Input
                      id={`${challenge.clientId}-title`}
                      className={hackathonAdminControlClass}
                      value={challenge.title}
                      onChange={(e) => patchChallenge(challenge.clientId, { title: e.target.value })}
                    />
                  </HackathonAdminFieldRow>
                  <HackathonAdminFieldRow id={`${challenge.clientId}-desc`} label="Description">
                    <Textarea
                      id={`${challenge.clientId}-desc`}
                      rows={3}
                      className="w-full min-w-0"
                      value={challenge.description}
                      onChange={(e) => patchChallenge(challenge.clientId, { description: e.target.value })}
                    />
                  </HackathonAdminFieldRow>
                  {challenge.kind !== "social" ? (
                    <HackathonAdminField
                      id={`${challenge.clientId}-min`}
                      label="Minimum passing score"
                      hint="Empty means submit-only. Below this score, the participant must retry."
                    >
                      <Input
                        id={`${challenge.clientId}-min`}
                        type="number"
                        min={0}
                        max={100}
                        className={hackathonAdminControlClass}
                        value={challenge.minScore}
                        disabled={locked}
                        onChange={(e) => patchChallenge(challenge.clientId, { minScore: e.target.value })}
                      />
                    </HackathonAdminField>
                  ) : null}
                  {challenge.kind === "screening" || challenge.kind === "coding" || challenge.kind === "system_design" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <HackathonAdminField id={`${challenge.clientId}-count`} label="Number of rounds">
                        <AppSelect
                          id={`${challenge.clientId}-count`}
                          value={challenge.requiredCount}
                          disabled={locked}
                          onChange={(value) => patchChallenge(challenge.clientId, { requiredCount: value })}
                          options={[
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                          ]}
                        />
                      </HackathonAdminField>
                      <HackathonAdminField id={`${challenge.clientId}-attempts`} label="Attempts per round">
                        <Input
                          id={`${challenge.clientId}-attempts`}
                          type="number"
                          min={1}
                          max={10}
                          className={hackathonAdminControlClass}
                          value={challenge.maxAttemptsPerSlot}
                          disabled={locked}
                          onChange={(e) => patchChallenge(challenge.clientId, { maxAttemptsPerSlot: e.target.value })}
                        />
                      </HackathonAdminField>
                    </div>
                  ) : null}
                  {challenge.kind === "screening" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <HackathonAdminField id={`${challenge.clientId}-dur`} label="Duration">
                        <AppSelect
                          id={`${challenge.clientId}-dur`}
                          value={challenge.durationMinutes}
                          disabled={locked}
                          onChange={(value) => patchChallenge(challenge.clientId, { durationMinutes: value === "30" ? "30" : "15" })}
                          options={[
                            { value: "15", label: "15 minutes" },
                            { value: "30", label: "30 minutes" },
                          ]}
                        />
                      </HackathonAdminField>
                      <HackathonAdminField id={`${challenge.clientId}-voice`} label="Voice provider">
                        <AppSelect
                          id={`${challenge.clientId}-voice`}
                          value={challenge.voiceProvider}
                          disabled={locked}
                          onChange={(value) => patchChallenge(challenge.clientId, { voiceProvider: value as VoiceProvider })}
                          options={[
                            { value: "gemini", label: "Gemini" },
                            { value: "gemini38", label: "Gemini 3.8" },
                            { value: "gemini38extended", label: "Gemini 3.8 extended" },
                            { value: "chatgpt", label: "ChatGPT" },
                            { value: "sarvam", label: "Sarvam" },
                          ]}
                        />
                      </HackathonAdminField>
                    </div>
                  ) : null}
                  {challenge.kind === "coding" ? (
                    <HackathonAdminField id={`${challenge.clientId}-problems`} label="Coding problems" hint="Participants get these problems, in this order.">
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                        {(codingProblems.data?.items ?? []).map((problem) => {
                          const checked = challenge.codingProblemIds.includes(problem.problemId);
                          return (
                            <label key={problem.problemId} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                disabled={locked}
                                checked={checked}
                                onChange={() =>
                                  patchChallenge(challenge.clientId, {
                                    codingProblemIds: checked
                                      ? challenge.codingProblemIds.filter((id) => id !== problem.problemId)
                                      : [...challenge.codingProblemIds, problem.problemId],
                                  })
                                }
                              />
                              <span>{problem.title}</span>
                            </label>
                          );
                        })}
                        {codingProblems.isLoading ? <p className="text-xs text-muted-foreground">Loading problems…</p> : null}
                      </div>
                    </HackathonAdminField>
                  ) : null}
                  {challenge.kind === "system_design" ? (
                    <HackathonAdminField id={`${challenge.clientId}-sd`} label="System design problem">
                      <AppSelect
                        id={`${challenge.clientId}-sd`}
                        value={challenge.systemDesignProblemId}
                        disabled={locked}
                        allowEmpty
                        emptyLabel="Select a problem"
                        onChange={(value) => patchChallenge(challenge.clientId, { systemDesignProblemId: value })}
                        options={(sdProblems.data?.items ?? []).map((p) => ({ value: p.problemId, label: p.title }))}
                      />
                    </HackathonAdminField>
                  ) : null}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                disabled={locked || form.challenges.length >= 8}
                onClick={() => setForm((prev) => ({ ...prev, challenges: [...prev.challenges, emptyChallenge()] }))}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add challenge
              </Button>
              <HackathonAdminField id="hk-conc" label="Max concurrent interviews" hint="Shared across screening and coding rooms.">
                <Input
                  id="hk-conc"
                  type="number"
                  min={1}
                  max={500}
                  className={hackathonAdminControlClass}
                  value={form.maxConcurrent}
                  onChange={(e) => patch({ maxConcurrent: e.target.value })}
                />
              </HackathonAdminField>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <HackathonAdminField
                  id="hk-start"
                  label="Start (IST)"
                  hint="Leave empty to open later, or use Start now to go live immediately."
                >
                  <Input id="hk-start" type="datetime-local" className={hackathonAdminControlClass} value={form.startsAt} onChange={(e) => patch({ startsAt: e.target.value })} />
                </HackathonAdminField>
                <HackathonAdminField id="hk-end" label="End (IST)" hint="Optional. Empty means it stays open until you click End now.">
                  <Input id="hk-end" type="datetime-local" className={hackathonAdminControlClass} value={form.endsAt} onChange={(e) => patch({ endsAt: e.target.value })} />
                </HackathonAdminField>
                <HackathonAdminField id="hk-remind-hour" label="Daily reminder hour (IST)" hint="One reminder per person in a 6-hour window from this hour. Copy and on/off for the email itself live in Notification Hub.">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.reminderEnabled} onChange={(e) => patch({ reminderEnabled: e.target.checked })} />
                      Enabled
                    </label>
                    <Input id="hk-remind-hour" type="number" min={0} max={23} className={hackathonAdminControlClass} value={form.reminderHour} disabled={!form.reminderEnabled} onChange={(e) => patch({ reminderHour: e.target.value })} />
                  </div>
                </HackathonAdminField>
                <HackathonAdminField id="hk-remind-start" label="Start reminders (IST)" hint="Optional. Empty means as soon as the hackathon is live.">
                  <Input id="hk-remind-start" type="datetime-local" className={hackathonAdminControlClass} value={form.reminderStart} disabled={!form.reminderEnabled} onChange={(e) => patch({ reminderStart: e.target.value })} />
                </HackathonAdminField>
                <HackathonAdminField id="hk-limit" label="Max participants" hint="Empty means unlimited.">
                  <Input id="hk-limit" type="number" min={1} className={hackathonAdminControlClass} value={form.limit} onChange={(e) => patch({ limit: e.target.value })} />
                </HackathonAdminField>
                <HackathonAdminField id="hk-grace" label="Interview grace (minutes)">
                  <Input id="hk-grace" type="number" min={0} max={240} className={hackathonAdminControlClass} value={form.grace} onChange={(e) => patch({ grace: e.target.value })} />
                </HackathonAdminField>
              </div>
              {(!editing || existing.data?.phase === "upcoming") ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={save.isPending}
                    onClick={() => {
                      try {
                        assertDesignerWrite(form, toBody(form), "startNow");
                        setConfirmStart(true);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Couldn't start the hackathon.");
                      }
                    }}
                  >
                    <Play className="mr-1.5 h-4 w-4" /> Start now
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
              Back
            </Button>
            {step < 3 ? (
              <Button type="button" className={appPrimaryButton} disabled={!stepValid} onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="button" className={appPrimaryButton} disabled={save.isPending} onClick={() => save.mutate("save")}>
                {save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Flag className="mr-1.5 h-4 w-4" />}
                {editing ? "Save changes" : "Save as draft"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={confirmStart}
        onOpenChange={(open) => !open && setConfirmStart(false)}
        title="Start the hackathon now?"
        description={
          form.endsAt
            ? `Participants can start submitting immediately. Submissions close on ${formatIst(istInputToIso(form.endsAt))}.`
            : "Participants can start submitting immediately. It stays open until you click End now."
        }
        confirmText="Start now"
        onConfirm={() => {
          setConfirmStart(false);
          save.mutate("startNow");
        }}
        isLoading={save.isPending}
      />
    </div>
  );
}
