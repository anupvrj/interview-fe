"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { FormField } from "@/components/app/FormField";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { IntegritySwitch } from "@/components/integrity/IntegritySwitch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { adminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { AI_INTERVIEWERS_QUERY_KEY } from "@/hooks/useAiInterviewers";
import {
  newInterviewerId,
  type InterviewerCatalog,
  type InterviewerPersonaRecord,
  type InterviewerVoiceLists,
} from "@/lib/aiInterviewers";

const PORTRAITS = [
  "/personas/persona-1.jpg",
  "/personas/persona-2.jpg",
  "/personas/persona-3.jpg",
  "/personas/persona-4.jpg",
  "/personas/persona-5.jpg",
  "/personas/persona-6.jpg",
];

const EMPTY_VOICES: InterviewerVoiceLists = {
  gemini: [],
  openai: [],
  sarvam: [],
};

function voiceOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}

export default function SuperAdminInterviewersPage() {
  const { authorized, loading: authLoading } = useRequirePlatformAdmin();
  const queryClient = useQueryClient();
  const [catalog, setCatalog] = useState<InterviewerCatalog | null>(null);
  const [builtin, setBuiltin] = useState<InterviewerVoiceLists>(EMPTY_VOICES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<InterviewerPersonaRecord | null>(null);
  const [voiceDraft, setVoiceDraft] = useState({
    gemini: "",
    openai: "",
    sarvam: "",
  });

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    setLoading(true);
    adminApi
      .getAiInterviewers()
      .then((result) => {
        if (cancelled) return;
        setCatalog(result.catalog);
        setBuiltin(result.builtinVoices);
      })
      .catch((error: unknown) => {
        toast.error(getApiErrorMessage(error, "Failed to load interviewers"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const builtinSet = useMemo(
    () => ({
      gemini: new Set(builtin.gemini),
      openai: new Set(builtin.openai),
      sarvam: new Set(builtin.sarvam),
    }),
    [builtin],
  );

  const save = async (next: InterviewerCatalog) => {
    setSaving(true);
    try {
      const saved = await adminApi.updateAiInterviewers(next);
      setCatalog(saved);
      await queryClient.invalidateQueries({ queryKey: AI_INTERVIEWERS_QUERY_KEY });
      toast.success("Interviewers saved");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save interviewers"));
    } finally {
      setSaving(false);
    }
  };

  const updatePersona = (persona: InterviewerPersonaRecord) => {
    if (!catalog) return;
    const exists = catalog.personas.some((item) => item.id === persona.id);
    const personas = exists
      ? catalog.personas.map((item) => (item.id === persona.id ? persona : item))
      : [...catalog.personas, persona];
    const enabled = personas.filter((item) => item.enabled);
    const fixedPersonaId = enabled.some((item) => item.id === catalog.fixedPersonaId)
      ? catalog.fixedPersonaId
      : (enabled[0]?.id ?? catalog.fixedPersonaId);
    setCatalog({ ...catalog, personas, fixedPersonaId });
  };

  const removePersona = (id: string) => {
    if (!catalog) return;
    if (catalog.personas.length <= 1) {
      toast.error("Keep at least one interviewer");
      return;
    }
    const personas = catalog.personas.filter((item) => item.id !== id);
    const enabled = personas.filter((item) => item.enabled);
    if (enabled.length === 0) {
      toast.error("Keep at least one interviewer enabled");
      return;
    }
    setCatalog({
      ...catalog,
      personas,
      fixedPersonaId: enabled.some((item) => item.id === catalog.fixedPersonaId)
        ? catalog.fixedPersonaId
        : enabled[0]!.id,
    });
  };

  const addVoice = (provider: keyof InterviewerVoiceLists) => {
    if (!catalog) return;
    const raw = voiceDraft[provider].trim();
    if (!raw) return;
    const id = provider === "gemini" ? raw : raw.toLowerCase();
    const valid =
      provider === "gemini"
        ? /^[A-Za-z][A-Za-z0-9]{1,31}$/.test(id)
        : /^[a-z][a-z0-9-]{1,31}$/.test(id);
    if (!valid) {
      toast.error("Use a voice id such as Charon, ash, or priya");
      return;
    }
    if (catalog.voices[provider].includes(id)) {
      toast.error("That voice is already in the list");
      return;
    }
    setCatalog({
      ...catalog,
      voices: {
        ...catalog.voices,
        [provider]: [...catalog.voices[provider], id].sort((a, b) => a.localeCompare(b)),
      },
    });
    setVoiceDraft((current) => ({ ...current, [provider]: "" }));
  };

  const removeVoice = (provider: keyof InterviewerVoiceLists, id: string) => {
    if (!catalog || builtinSet[provider].has(id)) return;
    const field =
      provider === "gemini"
        ? "geminiVoice"
        : provider === "openai"
          ? "openaiVoice"
          : "sarvamVoice";
    if (catalog.personas.some((persona) => persona[field] === id)) {
      toast.error("Reassign characters using this voice before removing it");
      return;
    }
    setCatalog({
      ...catalog,
      voices: {
        ...catalog.voices,
        [provider]: catalog.voices[provider].filter((voice) => voice !== id),
      },
    });
  };

  if (authLoading || !authorized) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="AI interviewers"
        description="Choose who runs live mock, coding, and system design interviews. Add a character or a provider voice, then save."
        actions={
          <Button
            type="button"
            disabled={!catalog || saving}
            onClick={() => catalog && void save(catalog)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        }
      />

      {loading || !catalog ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Who the candidate hears</legend>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={catalog.selectionMode === "random"}
                    onChange={() =>
                      setCatalog({ ...catalog, selectionMode: "random" })
                    }
                  />
                  <span>
                    <span className="font-medium">Random enabled character</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      Each new interview picks one enabled character.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="radio"
                    className="mt-1"
                    checked={catalog.selectionMode === "fixed"}
                    onChange={() =>
                      setCatalog({ ...catalog, selectionMode: "fixed" })
                    }
                  />
                  <span>
                    <span className="font-medium">Always this character</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      Every session uses the interviewer you pick.
                    </span>
                  </span>
                </label>
              </fieldset>
              <FormField label="Pinned interviewer" htmlFor="fixed-persona">
                <AppSelect
                  id="fixed-persona"
                  value={catalog.fixedPersonaId}
                  disabled={catalog.selectionMode !== "fixed"}
                  onChange={(fixedPersonaId) =>
                    setCatalog({ ...catalog, fixedPersonaId })
                  }
                  options={catalog.personas
                    .filter((persona) => persona.enabled)
                    .map((persona) => ({
                      value: persona.id,
                      label: persona.displayName,
                    }))}
                />
              </FormField>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">Characters</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft({
                  id: newInterviewerId(),
                  displayName: "",
                  title: "Technical interviewer",
                  geminiVoice: catalog.voices.gemini[0] ?? "Charon",
                  openaiVoice: catalog.voices.openai[0] ?? "alloy",
                  sarvamVoice: catalog.voices.sarvam[0] ?? "shubh",
                  imageSrc: PORTRAITS[0]!,
                  enabled: true,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add character
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.personas.map((persona) => (
              <Card key={persona.id} className="min-w-0">
                <CardContent className="flex gap-3 p-4">
                  <img
                    src={persona.imageSrc}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{persona.displayName}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {persona.title}
                        </p>
                      </div>
                      <IntegritySwitch
                        on={persona.enabled}
                        label={`${persona.enabled ? "Disable" : "Enable"} ${persona.displayName}`}
                        onToggle={() =>
                          updatePersona({ ...persona, enabled: !persona.enabled })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gemini {persona.geminiVoice} · OpenAI {persona.openaiVoice} · Sarvam{" "}
                      {persona.sarvamVoice}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setDraft(persona)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removePersona(persona.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-base font-semibold">Voices</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {(
              [
                ["gemini", "Gemini Live"],
                ["openai", "OpenAI Realtime"],
                ["sarvam", "Sarvam"],
              ] as const
            ).map(([provider, label]) => (
              <Card key={provider}>
                <CardContent className="space-y-3 p-4">
                  <p className="text-sm font-medium">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {catalog.voices[provider].map((voice) => (
                      <Badge key={voice} variant="neutral" className="gap-1">
                        {voice}
                        {builtinSet[provider].has(voice) ? null : (
                          <button
                            type="button"
                            className="ml-1 text-xs"
                            aria-label={`Remove ${voice}`}
                            onClick={() => removeVoice(provider, voice)}
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={voiceDraft[provider]}
                      placeholder="Add voice id"
                      onChange={(event) =>
                        setVoiceDraft((current) => ({
                          ...current,
                          [provider]: event.target.value,
                        }))
                      }
                    />
                    <Button type="button" variant="outline" onClick={() => addVoice(provider)}>
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {catalog?.personas.some((persona) => persona.id === draft?.id)
                ? "Edit character"
                : "Add character"}
            </DialogTitle>
          </DialogHeader>
          {draft && catalog ? (
            <div className="grid gap-4">
              <FormField label="Name" htmlFor="persona-name" required>
                <Input
                  id="persona-name"
                  value={draft.displayName}
                  onChange={(event) =>
                    setDraft({ ...draft, displayName: event.target.value })
                  }
                />
              </FormField>
              <FormField label="Title" htmlFor="persona-title" required>
                <Input
                  id="persona-title"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </FormField>
              <FormField label="Portrait" htmlFor="persona-image">
                <AppSelect
                  id="persona-image"
                  value={PORTRAITS.includes(draft.imageSrc) ? draft.imageSrc : "custom"}
                  onChange={(imageSrc) =>
                    setDraft({
                      ...draft,
                      imageSrc: imageSrc === "custom" ? "https://" : imageSrc,
                    })
                  }
                  options={[
                    ...PORTRAITS.map((src, index) => ({
                      value: src,
                      label: `Portrait ${index + 1}`,
                    })),
                    { value: "custom", label: "Image URL" },
                  ]}
                />
              </FormField>
              {PORTRAITS.includes(draft.imageSrc) ? null : (
                <FormField label="Image URL" htmlFor="persona-url">
                  <Input
                    id="persona-url"
                    value={draft.imageSrc}
                    onChange={(event) =>
                      setDraft({ ...draft, imageSrc: event.target.value })
                    }
                  />
                </FormField>
              )}
              <FormField label="Gemini voice" htmlFor="persona-gemini">
                <AppSelect
                  id="persona-gemini"
                  value={draft.geminiVoice}
                  onChange={(geminiVoice) => setDraft({ ...draft, geminiVoice })}
                  options={voiceOptions(catalog.voices.gemini)}
                />
              </FormField>
              <FormField label="OpenAI voice" htmlFor="persona-openai">
                <AppSelect
                  id="persona-openai"
                  value={draft.openaiVoice}
                  onChange={(openaiVoice) => setDraft({ ...draft, openaiVoice })}
                  options={voiceOptions(catalog.voices.openai)}
                />
              </FormField>
              <FormField label="Sarvam voice" htmlFor="persona-sarvam">
                <AppSelect
                  id="persona-sarvam"
                  value={draft.sarvamVoice}
                  onChange={(sarvamVoice) => setDraft({ ...draft, sarvamVoice })}
                  options={voiceOptions(catalog.voices.sarvam)}
                />
              </FormField>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!draft?.displayName.trim() || !draft.title.trim()) {
                  toast.error("Name and title are required");
                  return;
                }
                updatePersona({
                  ...draft,
                  displayName: draft.displayName.trim(),
                  title: draft.title.trim(),
                });
                setDraft(null);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
