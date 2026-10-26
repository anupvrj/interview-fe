"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowDown, ArrowUp, CalendarClock, Eye, Flag, Loader2, Plus, Sparkles, Trash2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { InstituteFormStepper, type InstituteFormStep } from "@/components/institute/InstituteFormStepper";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { HACKATHON_ADMIN_PATH, HACKATHON_TARGETS, hackathonPublicPath } from "../config";
import { hackathonAdminTabHref } from "./hackathonAdminNav";
import { hackathonKeys } from "../hooks";
import { HackathonStatusActions } from "./HackathonStatusActions";
import { HackathonAdminField, HackathonAdminFieldRow, hackathonAdminControlClass } from "./HackathonAdminField";
import { HackathonIstDateTimeField } from "./HackathonIstDateTimeField";
import { HackathonAdminShell } from "./HackathonAdminShell";
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
    title: "Operate",
    headline: "Status, schedule, and limits",
    description: "Public visibility, submission window, reminders, and capacity.",
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
  submissionsDueAt: string;
  endsAt: string;
  grace: string;
  limit: string;
  reminderEnabled: boolean;
  reminderHour: string;
  reminderStart: string;
  registrationOpen: boolean;
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
    description: "Post about your mock interview on LinkedIn, then share post links with us.",
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
    maxAttemptsPerSlot: "1",
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
    submissionsDueAt: "",
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
      maxAttemptsPerSlot: String(c.config?.maxAttemptsPerSlot ?? h.interviewConfig.maxAttemptsPerSlot ?? 1),
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
    challenges: challenges.length ? challenges : [emptyChallenge("resume"), emptyChallenge("screening"), emptyChallenge("social")],
    maxConcurrent: String(h.interviewConfig.maxConcurrent ?? 50),
    startsAt: isoToIstInput(h.startsAt),
    endsAt: isoToIstInput(h.endsAt),
    submissionsDueAt: isoToIstInput(h.submissionsDueAt),
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
        config.maxAttemptsPerSlot = Number(c.maxAttemptsPerSlot) || 1;
      }
      if (c.kind === "screening") {
        config.durationMinutes = c.durationMinutes === "30" ? 30 : 15;
        config.voiceProvider = c.voiceProvider;
      }
      if (c.kind === "coding") config.codingProblemIds = c.codingProblemIds;
      if (c.kind === "system_design") config.systemDesignProblemId = c.systemDesignProblemId || undefined;
      if (c.kind === "social") config.requiredPlatforms = ["linkedin"];
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
    submissionsDueAt: form.submissionsDueAt ? istInputToIso(form.submissionsDueAt) : null,
    maxCompletions: trimmedLimit === "" ? null : Number(trimmedLimit),
    reminders: {
      enabled: form.reminderEnabled,
      hour: Number(form.reminderHour),
      startAt: form.reminderStart ? istInputToIso(form.reminderStart) : null,
    },
  };
}
    registrationOpen: form.registrationOpen,

const START_CLOCK_SKEW_MS = 2 * 60_000;

function assertDesignerWrite(form: FormState, body: ReturnType<typeof toBody>, editing: boolean) {
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
  if (form.submissionsDueAt && !body.submissionsDueAt) throw new Error("Enter a valid submission due date and time.");
  if (form.endsAt && !body.endsAt) throw new Error("Enter a valid end date and time.");
  if (body.submissionsDueAt && body.endsAt && Date.parse(body.submissionsDueAt) > Date.parse(body.endsAt)) {
    throw new Error("Submission due must be on or before the hackathon end.");
  }
  if (reminderHour === undefined || !Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) {
    throw new Error("Reminder hour must be from 0 to 23.");
  }
  if (!editing && body.startsAt && Date.parse(body.startsAt) <= Date.now() - START_CLOCK_SKEW_MS) {
    throw new Error("Start must be in the future. Leave it empty, or use Start now to open immediately.");
  }
  return body;
}

export function AdminHackathonDesignerPage({ hackathonId }: Readonly<{ hackathonId?: string }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(hackathonId);
  const [step, setStep] = useState(() => (hackathonId ? 3 : 1));
  /** Single empty snapshot — `emptyForm()` uses random challenge clientIds; calling it twice made the form "dirty" before hydrate. */
  const initialEmptyForm = useMemo(() => emptyForm(), []);
  const [form, setForm] = useState<FormState>(initialEmptyForm);
  const [slugTouched, setSlugTouched] = useState(editing);
  const baselineRef = useRef(JSON.stringify(initialEmptyForm));
  const hydratedHackathonIdRef = useRef<string | null>(null);

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

  const isDirty = useMemo(() => JSON.stringify(form) !== baselineRef.current, [form]);

  useEffect(() => {
    if (!existing.data) return;
    const id = existing.data.hackathonId;
    if (hydratedHackathonIdRef.current === id) return;
    if (hydratedHackathonIdRef.current !== null && isDirty) return;
    const next = fromOverview(existing.data);
    setForm(next);
    baselineRef.current = JSON.stringify(next);
    hydratedHackathonIdRef.current = id;
  }, [existing.data, isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (slugTouched) return;
    setForm((prev) => ({ ...prev, slug: slugFromTitle(prev.title) }));
  }, [form.title, slugTouched]);

  // Nothing is locked: every field stays editable in every phase. The backend only refuses
  // removing a challenge (or changing its type) once people have submitted work for it.
  const hasRegistrations = (existing.data?.participantCount ?? 0) > 0;
  const patch = (partial: Partial<FormState>) => setForm((prev) => ({ ...prev, ...partial }));
  const patchChallenge = (clientId: string, partial: Partial<ChallengeForm>) =>
    setForm((prev) => ({
      ...prev,
      challenges: prev.challenges.map((c) => (c.clientId === clientId ? { ...c, ...partial } : c)),
    }));

  const save = useMutation({
    mutationFn: async () => {
      const body: ReturnType<typeof toBody> = { ...assertDesignerWrite(form, toBody(form), editing) };
      if (editing && isoToIstInput(existing.data?.startsAt) === form.startsAt) {
        delete body.startsAt;
      }
      if (editing) {
        const res = await hackathonAdminApi.update(hackathonId!, body);
        return res.data;
      }
      return hackathonAdminApi.create(body);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: hackathonKeys.adminList });
      queryClient.setQueryData(hackathonKeys.adminOne(data.hackathonId), data);
      const synced = fromOverview(data);
      setForm(synced);
      baselineRef.current = JSON.stringify(synced);
      toast.success(editing ? "Hackathon saved" : "Draft created");
      if (editing && data.visibility === "published" && !data.startsAt) {
        toast.warning("No start time is set — participants won't see a countdown until you add one.");
      }
      if (!editing) router.push(HACKATHON_ADMIN_PATH);
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

  const inner = (
    <>
      {!editing ? (
        <SuperAdminPageHeader
          backHref={HACKATHON_ADMIN_PATH}
          backLabel="Hackathons"
          title="Create hackathon"
          description="Saved as a draft until you publish on step Operate after creation."
        />
      ) : null}
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
              <details className="rounded-lg border border-border/60 p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground">Display targets (optional)</summary>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <HackathonAdminField id="hk-ats" label="ATS target %" hint="Shown on the landing page.">
                    <Input id="hk-ats" type="number" min={0} max={100} className={hackathonAdminControlClass} value={form.atsScore} onChange={(e) => patch({ atsScore: e.target.value })} />
                  </HackathonAdminField>
                  <HackathonAdminField id="hk-iv" label="Interview target %" hint="Shown on the landing page.">
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
              </details>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {hasRegistrations ? (
                <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-semibold">People have already registered</p>
                  <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
                    Everything stays editable and changes apply to everyone as soon as you save, including pass marks, rounds
                    and attempts. A challenge that already has submissions can&apos;t be removed or change type.
                  </p>
                </div>
              ) : null}
              {form.challenges.map((challenge, index) => (
                <div key={challenge.clientId} className="space-y-4 rounded-xl border border-border/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Challenge {index + 1}</p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={index === 0}
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
                        disabled={index === form.challenges.length - 1}
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
                        disabled={form.challenges.length === 1}
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
                  <HackathonAdminFieldRow id={`${challenge.clientId}-kind`} label="Type" hint={hasRegistrations ? "Can't change once the challenge has submissions." : undefined}>
                    <AppSelect
                      id={`${challenge.clientId}-kind`}
                      value={challenge.kind}
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
                      hint="Empty means submit-only. A scored round below this uses the attempt; they cannot retry unless attempts are above 1."
                    >
                      <Input
                        id={`${challenge.clientId}-min`}
                        type="number"
                        min={0}
                        max={100}
                        className={hackathonAdminControlClass}
                        value={challenge.minScore}
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
                          onChange={(value) => patchChallenge(challenge.clientId, { requiredCount: value })}
                          options={[
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                          ]}
                        />
                      </HackathonAdminField>
                      <HackathonAdminField
                        id={`${challenge.clientId}-attempts`}
                        label="Successful attempts per round"
                        hint="Only a scored submission counts. Report or connection failures do not use the attempt."
                      >
                        <Input
                          id={`${challenge.clientId}-attempts`}
                          type="number"
                          min={1}
                          max={10}
                          className={hackathonAdminControlClass}
                          value={challenge.maxAttemptsPerSlot}
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
                disabled={form.challenges.length >= 8}
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
              {editing && existing.data ? (
                <div className="space-y-3 rounded-xl border border-border/80 p-4">
                  <p className="text-sm font-semibold text-foreground">Publication and status</p>
                  <HackathonStatusActions
                    hackathon={existing.data}
                    onUpdated={(data) => {
                      queryClient.setQueryData(hackathonKeys.adminOne(data.hackathonId), data);
                      if (!isDirty) {
                        const next = fromOverview(data);
                        setForm(next);
                        baselineRef.current = JSON.stringify(next);
                      }
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  After you create the hackathon, open Edit and use this step to publish and set On-going / Completed.
                </p>
              )}

              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">How scheduling works</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Registration opens as soon as the hackathon is published (before the start time).</li>
                  <li>Challenges unlock automatically at the start time you set below — no need to click Start now unless you want to open early.</li>
                </ul>
              </div>

              <p className="text-sm font-semibold text-foreground">Schedule and capacity</p>
              <div className="grid gap-4 md:grid-cols-2">
                <HackathonIstDateTimeField
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.registrationOpen}
                  onChange={(e) => patch({ registrationOpen: e.target.checked })}
                />
                <span className="text-sm">
                  <span className="font-medium text-foreground">Accept registration</span>
                  <span className="mt-1 block text-muted-foreground">
                    When off, new hackathon sign-ups are blocked. Existing participants can still submit until the submission due date.
                  </span>
                </span>
              </label>
                  id="hk-start"
                  label="Start"
                  hint="When participants can begin challenges. Leave empty to open only via Status → Start now."
                  previewVerb="Challenges unlock"
                  value={form.startsAt}
                  onChange={(startsAt) => patch({ startsAt })}
                />
                <HackathonIstDateTimeField
                  id="hk-end"
                  label="End"
                  id="hk-submissions-due"
                  label="Submission due"
                  hint="Last moment participants can submit challenges. After this, steps lock until the hackathon end."
                  previewVerb="Submissions close"
                  value={form.submissionsDueAt}
                  onChange={(submissionsDueAt) => patch({ submissionsDueAt })}
                />
                <HackathonIstDateTimeField
                  id="hk-end"
                  label="Hackathon end"
                  hint="When the overall event ends (phase becomes ended). Can be after the submission deadline (e.g. launch day)."
                  previewVerb="Event ends"
                />
                <HackathonAdminField id="hk-limit" label="Max participants" hint="Empty = unlimited.">
                  <Input id="hk-limit" type="number" min={1} className={hackathonAdminControlClass} value={form.limit} onChange={(e) => patch({ limit: e.target.value })} />
                </HackathonAdminField>
                <HackathonAdminField id="hk-grace" label="Interview grace (minutes)" hint="Extra time after end for in-flight interviews.">
                  <Input id="hk-grace" type="number" min={0} max={240} className={hackathonAdminControlClass} value={form.grace} onChange={(e) => patch({ grace: e.target.value })} />
                </HackathonAdminField>
              </div>

              <details className="rounded-lg border border-border/60 p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground">Email reminders</summary>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <HackathonAdminField id="hk-remind-hour" label="Daily hour (IST)" hint="Template copy lives in Notification Hub.">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.reminderEnabled} onChange={(e) => patch({ reminderEnabled: e.target.checked })} />
                        On
                      </label>
                      <Input id="hk-remind-hour" type="number" min={0} max={23} className={hackathonAdminControlClass} value={form.reminderHour} disabled={!form.reminderEnabled} onChange={(e) => patch({ reminderHour: e.target.value })} />
                    </div>
                  </HackathonAdminField>
                  <HackathonIstDateTimeField
                    id="hk-remind-start"
                    label="First reminder"
                    hint="Empty = when the hackathon goes live."
                    previewVerb="First reminder"
                    value={form.reminderStart}
                    onChange={(reminderStart) => patch({ reminderStart })}
                    disabled={!form.reminderEnabled}
                  />
                </div>
              </details>
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
            ) : editing ? null : (
              <Button type="button" className={appPrimaryButton} disabled={save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Flag className="mr-1.5 h-4 w-4" />}
                Save as draft
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {editing && step === 3 ? (
        <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-3 border-t border-border/60 bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <p className="text-xs text-muted-foreground">{isDirty ? "Unsaved changes" : "All changes saved"}</p>
          <Button type="button" className={appPrimaryButton} disabled={save.isPending || !isDirty} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      ) : null}
    </>
  );

  if (editing && hackathonId) {
    const previewSlug = existing.data?.slug ?? form.slug;
    return (
      <HackathonAdminShell
        hackathonId={hackathonId}
        activeTab="edit"
        unsavedChanges={isDirty}
        headerExtra={
          <>
            <Button asChild variant="outline" size="sm">
              <Link
                href={hackathonAdminTabHref(hackathonId, "submissions")}
                onClick={(event) => {
                  if (!isDirty) return;
                  if (!window.confirm("You have unsaved changes. Leave this page anyway?")) {
                    event.preventDefault();
                  }
                }}
              >
                <Users className="mr-1.5 h-4 w-4" /> Submissions
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!previewSlug}
              onClick={() =>
                window.open(
                  `${hackathonPublicPath(previewSlug)}${existing.data?.visibility === "draft" ? "?preview=1" : ""}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <Eye className="mr-1.5 h-4 w-4" /> Preview
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {hasRegistrations
              ? "Every field is editable. Changes apply to registered participants as soon as you save."
              : "Use step Operate for status and schedule. Save applies copy and settings."}
          </p>
          {inner}
        </div>
      </HackathonAdminShell>
    );
  }

  return <div className="space-y-5">{inner}</div>;
}
