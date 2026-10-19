"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { FormField } from "@/components/app/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/ui/app-select";
import { HackathonIstDateTimeField } from "@/features/hackathon/admin/HackathonIstDateTimeField";
import { usePublishedHackathons } from "@/features/hackathon/hooks";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { sitePopupsAdminApi, SITE_POPUPS_QUERY_KEY } from "../api";
import { clearPopupSnoozes } from "../rules";
import type { PopupCta, PopupCtaAction, PopupDesign } from "../types";
import { PopupDesignPicker } from "./PopupDesignPicker";
import { FormSection, PopupSwitch, ToggleRow } from "./PopupFormBits";
import { PopupPreview } from "./PopupPreview";
import {
  AUDIENCE_OPTIONS,
  COUNTDOWN_OPTIONS,
  CTA_ACTION_OPTIONS,
  DEVICE_OPTIONS,
  newPopupForm,
  PAGE_PRESETS,
  parsePageLines,
  toForm,
  toInput,
  type PopupForm,
} from "./presets";

export const SITE_POPUPS_ADMIN_PATH = "/super-admin/popups";

function numberInput(value: string, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function CtaFields({
  idPrefix,
  cta,
  onChange,
  hackathonSlug,
}: Readonly<{ idPrefix: string; cta: PopupCta; onChange: (next: PopupCta) => void; hackathonSlug: string }>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Button text" htmlFor={`${idPrefix}-label`}>
        <Input id={`${idPrefix}-label`} value={cta.label} maxLength={60} onChange={(e) => onChange({ ...cta, label: e.target.value })} placeholder="Register for free" />
      </FormField>
      <FormField label="When clicked" htmlFor={`${idPrefix}-action`}>
        <AppSelect
          id={`${idPrefix}-action`}
          value={cta.action}
          onChange={(value) => onChange({ ...cta, action: value as PopupCtaAction })}
          options={CTA_ACTION_OPTIONS}
        />
      </FormField>
      {cta.action === "link" ? (
        <>
          <FormField
            label="Link"
            htmlFor={`${idPrefix}-url`}
            hint="A page on the site like /pricing, or a full https:// link. The popup closes and opens it."
            className="sm:col-span-2"
          >
            <Input id={`${idPrefix}-url`} value={cta.url} maxLength={500} onChange={(e) => onChange({ ...cta, url: e.target.value })} placeholder="/hiring-games-hackathon-2026" />
          </FormField>
          <div className="sm:col-span-2">
            <ToggleRow label="Open in a new tab" on={cta.newTab} onChange={(newTab) => onChange({ ...cta, newTab })} />
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Starts the same flow as the Register button on the hackathon page: sign-up for new visitors, then the
          hackathon profile and registration{hackathonSlug ? ` for ${hackathonSlug}` : ""}. Registered users go to their challenges.
        </p>
      )}
    </div>
  );
}

export function AdminSitePopupEditor({ popupId }: Readonly<{ popupId: string }>) {
  const isNew = popupId === "new";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authorized, loading } = useRequirePlatformAdmin();
  const hackathons = usePublishedHackathons();
  const [form, setForm] = useState<PopupForm | null>(isNew ? newPopupForm() : null);
  const [saved, setSaved] = useState<string>(isNew ? "" : "");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized || isNew) return;
    let cancelled = false;
    sitePopupsAdminApi
      .get(popupId)
      .then((popup) => {
        if (cancelled) return;
        const next = toForm(popup);
        setForm(next);
        setSaved(JSON.stringify(next));
      })
      .catch((error: unknown) => !cancelled && setLoadError(getApiErrorMessage(error, "Couldn't load this popup")));
    return () => {
      cancelled = true;
    };
  }, [authorized, isNew, popupId]);

  const dirty = form ? JSON.stringify(form) !== saved : false;
  const patch = <K extends keyof PopupForm>(key: K, value: PopupForm[K]) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  const patchIn = <K extends "content" | "show" | "countdown" | "targeting" | "trigger" | "frequency" | "schedule">(
    key: K,
    value: Partial<PopupForm[K]>,
  ) => setForm((prev) => (prev ? { ...prev, [key]: { ...prev[key], ...value } } : prev));

  const selectedPages = useMemo(() => new Set(parsePageLines(form?.targeting.pagesText ?? "")), [form?.targeting.pagesText]);
  const togglePreset = (pattern: string) => {
    if (!form) return;
    const lines = parsePageLines(form.targeting.pagesText);
    const next = selectedPages.has(pattern) ? lines.filter((line) => line !== pattern) : [...lines, pattern];
    patchIn("targeting", { pagesText: next.join("\n") });
  };

  const usesHackathon =
    !!form &&
    (form.primaryCta.action === "hackathon_register" ||
      (form.secondaryCta.enabled && form.secondaryCta.action === "hackathon_register") ||
      (form.show.countdown && form.countdown.mode.startsWith("hackathon")));

  const hackathonOptions = useMemo(() => {
    const rows = (hackathons.data ?? []).map((h) => ({ value: h.slug, label: `${h.title} (${h.slug})` }));
    if (form?.targeting.hackathonSlug && !rows.some((r) => r.value === form.targeting.hackathonSlug)) {
      rows.unshift({ value: form.targeting.hackathonSlug, label: form.targeting.hackathonSlug });
    }
    return rows;
  }, [form?.targeting.hackathonSlug, hackathons.data]);

  const save = async () => {
    if (!form) return;
    const built = toInput(form);
    if ("error" in built) {
      toast.error(built.error);
      return;
    }
    setSaving(true);
    try {
      const result = isNew ? await sitePopupsAdminApi.create(built.input) : await sitePopupsAdminApi.update(popupId, built.input);
      const next = toForm(result);
      setForm(next);
      setSaved(JSON.stringify(next));
      await queryClient.invalidateQueries({ queryKey: SITE_POPUPS_QUERY_KEY });
      toast.success(isNew ? "Popup created" : "Popup saved");
      if (isNew) router.replace(`${SITE_POPUPS_ADMIN_PATH}/${result._id}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Couldn't save the popup"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !authorized || (!form && !loadError)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!form) {
    return (
      <div className="space-y-6">
        <SuperAdminPageHeader backHref={SITE_POPUPS_ADMIN_PATH} backLabel="All popups" />
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  const c = form.content;
  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title={isNew ? "New popup" : form.name || "Edit popup"}
        description="Pick a design, write the message, choose where and when it opens. Changes go live for visitors within a minute of saving."
        backHref={SITE_POPUPS_ADMIN_PATH}
        backLabel="All popups"
        unsavedChanges={dirty}
        actions={
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 sm:justify-start">
              <span className="text-sm font-medium text-foreground">{form.enabled ? "Live" : "Off"}</span>
              <PopupSwitch on={form.enabled} onChange={(enabled) => patch("enabled", enabled)} label="Popup live" />
            </div>
            <Button asChild variant="outline">
              <Link href={SITE_POPUPS_ADMIN_PATH}>Cancel</Link>
            </Button>
            <Button onClick={() => void save()} disabled={saving || (!dirty && !isNew)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isNew ? "Create popup" : "Save changes"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0 space-y-6">
          <FormSection title="Basics" description="Only you see the name. Higher priority wins when two popups target the same page.">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
              <FormField label="Popup name" htmlFor="ixp-name" required>
                <Input id="ixp-name" value={form.name} maxLength={120} onChange={(e) => patch("name", e.target.value)} placeholder="Hackathon — register" />
              </FormField>
              <FormField label="Priority" htmlFor="ixp-priority" hint="-100 to 100">
                <Input
                  id="ixp-priority"
                  type="number"
                  value={form.priority}
                  onChange={(e) => patch("priority", numberInput(e.target.value, 0, -100, 100))}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Design" description="Six layouts in the InterviewTrix reel style. You can switch any time; your text carries over.">
            <PopupDesignPicker value={form.design} onChange={(design: PopupDesign) => patch("design", design)} />
          </FormSection>

          <FormSection title="Message">
            <FormField label="Small label above the title" htmlFor="ixp-eyebrow" hint="Shown in the green pill with the live dot. Leave empty to hide.">
              <Input id="ixp-eyebrow" value={c.eyebrow} maxLength={80} onChange={(e) => patchIn("content", { eyebrow: e.target.value })} placeholder="Live hackathon · The Hiring Games" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Title" htmlFor="ixp-title">
                <Input id="ixp-title" value={c.title} maxLength={120} onChange={(e) => patchIn("content", { title: e.target.value })} placeholder="InterviewTrix:" />
              </FormField>
              <FormField label="Highlighted part of the title" htmlFor="ixp-accent" hint="Shown in the blue gradient after the title.">
                <Input id="ixp-accent" value={c.titleAccent} maxLength={120} onChange={(e) => patchIn("content", { titleAccent: e.target.value })} placeholder="The Hiring Games" />
              </FormField>
            </div>
            <FormField label="Message" htmlFor="ixp-body">
              <Textarea id="ixp-body" rows={3} value={c.body} maxLength={600} onChange={(e) => patchIn("content", { body: e.target.value })} />
            </FormField>
            <FormField label="Small print under the buttons" htmlFor="ixp-foot">
              <Input id="ixp-foot" value={c.footnote} maxLength={200} onChange={(e) => patchIn("content", { footnote: e.target.value })} placeholder="Limited seats." />
            </FormField>
            {form.design === "split" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Picture link" htmlFor="ixp-img" hint="Optional. Without a picture, the left side shows the prize and countdown.">
                  <Input id="ixp-img" value={c.imageUrl} maxLength={500} onChange={(e) => patchIn("content", { imageUrl: e.target.value })} placeholder="https://…/poster.jpg" />
                </FormField>
                <FormField label="Picture description" htmlFor="ixp-img-alt" hint="Read out by screen readers.">
                  <Input id="ixp-img-alt" value={c.imageAlt} maxLength={160} onChange={(e) => patchIn("content", { imageAlt: e.target.value })} />
                </FormField>
              </div>
            ) : null}
          </FormSection>

          <FormSection title="Offer and prize">
            <ToggleRow label="Show the price" hint="Big blue price with the old price struck through, e.g. FREE ₹799." on={form.show.price} onChange={(price) => patchIn("show", { price })} />
            {form.show.price ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Price now" htmlFor="ixp-price-now">
                  <Input id="ixp-price-now" value={c.priceNow} maxLength={30} onChange={(e) => patchIn("content", { priceNow: e.target.value })} placeholder="FREE" />
                </FormField>
                <FormField label="Old price (struck through)" htmlFor="ixp-price-was">
                  <Input id="ixp-price-was" value={c.priceOriginal} maxLength={30} onChange={(e) => patchIn("content", { priceOriginal: e.target.value })} placeholder="₹799" />
                </FormField>
              </div>
            ) : null}
            <ToggleRow label="Show the prize" hint="Gold prize card with a trophy." on={form.show.prize} onChange={(prize) => patchIn("show", { prize })} />
            {form.show.prize ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Prize label" htmlFor="ixp-prize-label">
                  <Input id="ixp-prize-label" value={c.prizeLabel} maxLength={60} onChange={(e) => patchIn("content", { prizeLabel: e.target.value })} placeholder="Total prize pool" />
                </FormField>
                <FormField label="Prize amount" htmlFor="ixp-prize-value">
                  <Input id="ixp-prize-value" value={c.prizeValue} maxLength={40} onChange={(e) => patchIn("content", { prizeValue: e.target.value })} placeholder="₹20,000" />
                </FormField>
              </div>
            ) : null}
          </FormSection>

          <FormSection title="Countdown">
            <ToggleRow label="Show a countdown" hint="Hides itself when the time runs out." on={form.show.countdown} onChange={(countdown) => patchIn("show", { countdown })} />
            {form.show.countdown ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Count down to" htmlFor="ixp-cd-mode">
                    <AppSelect
                      id="ixp-cd-mode"
                      value={form.countdown.mode}
                      onChange={(value) => patchIn("countdown", { mode: value as PopupForm["countdown"]["mode"] })}
                      options={COUNTDOWN_OPTIONS}
                    />
                  </FormField>
                  <FormField label="Label above the timer" htmlFor="ixp-cd-label" hint="Leave empty for “Hackathon starts in” / “Submissions close in”.">
                    <Input id="ixp-cd-label" value={c.countdownLabel} maxLength={60} onChange={(e) => patchIn("content", { countdownLabel: e.target.value })} placeholder="Automatic" />
                  </FormField>
                </div>
                {form.countdown.mode === "custom" ? (
                  <HackathonIstDateTimeField
                    id="ixp-cd-target"
                    label="Countdown ends"
                    value={form.countdown.target}
                    onChange={(target) => patchIn("countdown", { target })}
                    previewVerb="Ends"
                  />
                ) : null}
              </>
            ) : null}
          </FormSection>

          <FormSection title="Buttons" description="Clicking any button closes the popup first.">
            <p className="text-sm font-medium text-foreground">Main button</p>
            <CtaFields
              idPrefix="ixp-cta1"
              cta={form.primaryCta}
              hackathonSlug={form.targeting.hackathonSlug}
              onChange={(primaryCta) => patch("primaryCta", primaryCta)}
            />
            <div className="border-t border-border pt-4">
              <ToggleRow
                label="Second button"
                hint="A quieter text link next to the main button. Not shown on the countdown bar or corner card."
                on={form.secondaryCta.enabled}
                onChange={(enabled) => patch("secondaryCta", { ...form.secondaryCta, enabled })}
              />
            </div>
            {form.secondaryCta.enabled ? (
              <CtaFields
                idPrefix="ixp-cta2"
                cta={form.secondaryCta}
                hackathonSlug={form.targeting.hackathonSlug}
                onChange={(next) => patch("secondaryCta", { ...form.secondaryCta, ...next })}
              />
            ) : null}
          </FormSection>

          <FormSection title="Where it shows">
            <FormField label="Pages" hint="Tap to add or remove. Admin, sign-in and sign-up pages are always skipped.">
              <div className="flex flex-wrap gap-2">
                {PAGE_PRESETS.map((preset) => {
                  const on = selectedPages.has(preset.pattern);
                  return (
                    <button
                      key={preset.pattern}
                      type="button"
                      title={preset.hint}
                      onClick={() => togglePreset(preset.pattern)}
                      aria-pressed={on}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        on ? "border-[#7367F0] bg-[#7367F0] text-white" : "border-border text-foreground hover:border-[#7367F0]/60",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </FormField>
            <FormField
              label="Page list"
              htmlFor="ixp-pages"
              hint="One per line. / is the home page only; add * to include everything under a path (/blog*); * in the middle matches one part (/hackathon/*/dashboard)."
            >
              <Textarea id="ixp-pages" rows={4} value={form.targeting.pagesText} onChange={(e) => patchIn("targeting", { pagesText: e.target.value })} placeholder={"/\n/dashboard*"} className="font-mono text-sm" />
            </FormField>
            <FormField label="Never show on" htmlFor="ixp-exclude" hint="Optional. Same format.">
              <Textarea id="ixp-exclude" rows={2} value={form.targeting.excludeText} onChange={(e) => patchIn("targeting", { excludeText: e.target.value })} placeholder="/dashboard/settings*" className="font-mono text-sm" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Who sees it" htmlFor="ixp-audience">
                <AppSelect id="ixp-audience" value={form.targeting.audience} onChange={(value) => patchIn("targeting", { audience: value as PopupForm["targeting"]["audience"] })} options={AUDIENCE_OPTIONS} />
              </FormField>
              <FormField label="Devices" htmlFor="ixp-devices">
                <AppSelect id="ixp-devices" value={form.targeting.devices} onChange={(value) => patchIn("targeting", { devices: value as PopupForm["targeting"]["devices"] })} options={DEVICE_OPTIONS} />
              </FormField>
            </div>
            {usesHackathon ? (
              <>
                <FormField label="Hackathon" htmlFor="ixp-hackathon" hint="Used by the register button and the hackathon countdown.">
                  {hackathonOptions.length > 0 ? (
                    <AppSelect id="ixp-hackathon" value={form.targeting.hackathonSlug} onChange={(hackathonSlug) => patchIn("targeting", { hackathonSlug })} options={hackathonOptions} />
                  ) : (
                    <Input id="ixp-hackathon" value={form.targeting.hackathonSlug} onChange={(e) => patchIn("targeting", { hackathonSlug: e.target.value.trim() })} placeholder="hiring-games-hackathon-2026" />
                  )}
                </FormField>
                <ToggleRow
                  label="Hide from people already registered"
                  hint="Also hides automatically once the hackathon ends or is full."
                  on={form.targeting.hideIfRegistered}
                  onChange={(hideIfRegistered) => patchIn("targeting", { hideIfRegistered })}
                />
              </>
            ) : null}
          </FormSection>

          <FormSection title="When it opens" description="Opens on whichever happens first. Turn everything off to open it straight away.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="After this many seconds on the page" htmlFor="ixp-delay" hint="0 turns the timer off.">
                <Input id="ixp-delay" type="number" min={0} max={600} value={form.trigger.delaySeconds} onChange={(e) => patchIn("trigger", { delaySeconds: numberInput(e.target.value, 10, 0, 600) })} />
              </FormField>
              <FormField label="After scrolling this % of the page" htmlFor="ixp-scroll" hint="0 turns scroll off.">
                <Input id="ixp-scroll" type="number" min={0} max={100} value={form.trigger.scrollPercent} onChange={(e) => patchIn("trigger", { scrollPercent: numberInput(e.target.value, 40, 0, 100) })} />
              </FormField>
            </div>
            <ToggleRow
              label="When they're about to leave"
              hint="Desktop: the cursor heads for the tabs or back button. Phones: a quick flick back up the page."
              on={form.trigger.exitIntent}
              onChange={(exitIntent) => patchIn("trigger", { exitIntent })}
            />
          </FormSection>

          <FormSection title="How often" description="Remembered in each visitor's browser.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="After they close it, hide for (hours)" htmlFor="ixp-dismiss" hint="24 = once a day. 0 = show again on the next page.">
                <Input id="ixp-dismiss" type="number" min={0} value={form.frequency.dismissCooldownHours} onChange={(e) => patchIn("frequency", { dismissCooldownHours: numberInput(e.target.value, 24, 0, 8760) })} />
              </FormField>
              <FormField label="After they click the main button, hide for (hours)" htmlFor="ixp-click" hint="168 = a week.">
                <Input id="ixp-click" type="number" min={0} value={form.frequency.clickCooldownHours} onChange={(e) => patchIn("frequency", { clickCooldownHours: numberInput(e.target.value, 168, 0, 8760) })} />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Schedule" description="Optional. Outside these dates the popup stays off even when it's live.">
            <div className="grid gap-4 lg:grid-cols-2">
              <HackathonIstDateTimeField id="ixp-start" label="Start showing" value={form.schedule.startsAt} onChange={(startsAt) => patchIn("schedule", { startsAt })} previewVerb="Starts" />
              <HackathonIstDateTimeField id="ixp-end" label="Stop showing" value={form.schedule.endsAt} onChange={(endsAt) => patchIn("schedule", { endsAt })} previewVerb="Stops" />
            </div>
          </FormSection>
        </div>

        <div className="min-w-0">
          <div className="space-y-4 xl:sticky xl:top-20">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Live preview</CardTitle>
                <CardDescription>Updates as you type. Buttons and close replay the animation here.</CardDescription>
              </CardHeader>
              <CardContent>
                <PopupPreview form={form} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Testing on the site?</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Clears the “closed” timers in this browser so popups show again.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const n = clearPopupSnoozes();
                    toast.success(n ? `Cleared ${n} timer${n === 1 ? "" : "s"}` : "Nothing to clear");
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
