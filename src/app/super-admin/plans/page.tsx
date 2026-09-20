"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { FormField } from "@/components/app/FormField";
import { useRequirePlatformAdmin } from "@/components/blog-admin/useRequirePlatformAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { formatCurrency, formatCredits } from "@/lib/payment";
import { COMING_SOON_PLAN_FEATURES, isCreditHighlight } from "@/lib/pricingPageContent";
import type { AdminPlanRecord } from "@/lib/planRecord";
import type { PlatformFeature } from "@/lib/platform-features";
import {
  CAPABILITY_LABELS,
  PLAN_CAPABILITY_ENTITLEMENTS,
  entitlementsForPlatformFeature,
  highlightForEntitlement,
  highlightForPlatformFeature,
  isPlanGatedPlatformFeature,
  mergePlanEntitlements,
  platformFeatureIsGranted,
  sanitizeGrantedPlatformFeatures,
  setGrantedPlatformFeature,
  type EntitlementFeature,
  type PlanEntitlements,
} from "@/lib/planFeatureAccess";
import { appStatCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

type PlanFormState = {
  displayName: string;
  name: string;
  description: string;
  bestFor: string;
  monthlyPrice: string;
  quarterlyPrice: string;
  yearlyPrice: string;
  monthlyCredits: string;
  quarterlyCredits: string;
  yearlyCredits: string;
  highlights: string[];
  entitlements: PlanEntitlements;
  grantedPlatformFeatures: string[];
  comingSoonText: string;
  isActive: boolean;
  isPublic: boolean;
  isPopular: boolean;
  order: string;
};

function linesToText(lines: string[] | undefined): string {
  return (lines ?? []).join("\n");
}

function selectedHighlights(lines: string[] | undefined): string[] {
  return (lines ?? []).filter((line) => !isCreditHighlight(line));
}

function featureKeyOf(line: string): string {
  return line.replace(/\s+/g, " ").trim().toLowerCase();
}

function hasHighlight(selected: string[], option: string): boolean {
  const key = featureKeyOf(option);
  return selected.some((line) => featureKeyOf(line) === key);
}

function setHighlight(selected: string[], option: string, on: boolean): string[] {
  if (on) {
    return hasHighlight(selected, option) ? selected : [...selected, option];
  }
  return selected.filter((line) => featureKeyOf(line) !== featureKeyOf(option));
}

function applyEntitlementHighlight(
  highlights: string[],
  key: EntitlementFeature,
  on: boolean,
): string[] {
  const line = highlightForEntitlement(key);
  if (!line) return highlights;
  return setHighlight(highlights, line, on);
}

function confirmUnlock(name: string, wasOn: boolean, nextOn: boolean): boolean {
  if (wasOn || !nextOn) return true;
  return window.confirm(
    `Turn on ${name} for this plan? This applies immediately to all current subscribers on this plan.`,
  );
}

function textToLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function toForm(plan: AdminPlanRecord): PlanFormState {
  const comingSoon =
    plan.metadata?.comingSoonHighlights?.length
      ? plan.metadata.comingSoonHighlights
      : [...COMING_SOON_PLAN_FEATURES];
  return {
    displayName: plan.displayName,
    name: plan.name,
    description: plan.description,
    bestFor: plan.metadata?.bestFor ?? "",
    monthlyPrice: String(plan.pricing.monthly ?? 0),
    quarterlyPrice: String(plan.pricing.quarterly ?? 0),
    yearlyPrice: String(plan.pricing.yearly ?? 0),
    monthlyCredits: String(plan.creditsIncluded.monthly ?? 0),
    quarterlyCredits: String(plan.creditsIncluded.quarterly ?? 0),
    yearlyCredits: String(plan.creditsIncluded.yearly ?? 0),
    highlights: selectedHighlights(plan.highlights),
    entitlements: mergePlanEntitlements(plan.entitlements),
    grantedPlatformFeatures: sanitizeGrantedPlatformFeatures(
      plan.grantedPlatformFeatures,
    ),
    comingSoonText: linesToText(comingSoon),
    isActive: plan.isActive,
    isPublic: plan.isPublic,
    isPopular: plan.isPopular,
    order: String(plan.order ?? 0),
  };
}

function parseAmount(value: string, label: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be 0 or more`);
  }
  return Math.round(amount);
}

function PlanSwitch({
  on,
  disabled,
  label,
  onToggle,
}: Readonly<{
  on: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        on ? "bg-[#7367F0]" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none mt-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[1.35rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function statusBadge(status: PlatformFeature["status"]) {
  if (status === "live") return <Badge variant="success">Live</Badge>;
  if (status === "enabled") return <Badge variant="info">Admins only</Badge>;
  if (status === "beta") return <Badge variant="warning">Beta</Badge>;
  return <Badge variant="neutral">Disabled</Badge>;
}

function PlanFields({
  form,
  onChange,
  planId,
  platformFeatures,
}: Readonly<{
  form: PlanFormState;
  onChange: (next: PlanFormState) => void;
  planId: string;
  platformFeatures: PlatformFeature[];
}>) {
  const gatedFeatures = platformFeatures
    .filter((feature) => feature.category === "product")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const isFeatureGranted = (feature: PlatformFeature) =>
    platformFeatureIsGranted(
      form.entitlements,
      feature.key,
      form.grantedPlatformFeatures,
    );

  const togglePlatformFeature = (feature: PlatformFeature, next: boolean) => {
    if (!confirmUnlock(feature.name, isFeatureGranted(feature), next)) {
      return;
    }
    if (isPlanGatedPlatformFeature(feature.key)) {
      const entitlements = { ...form.entitlements };
      let highlights = form.highlights;
      for (const key of entitlementsForPlatformFeature(feature.key)) {
        if (key === "freePeerInterviewsPerPeriod") continue;
        entitlements[key] = next;
        highlights = applyEntitlementHighlight(highlights, key, next);
      }
      onChange({ ...form, entitlements, highlights });
      return;
    }
    const line = highlightForPlatformFeature(feature.key, feature.name);
    onChange({
      ...form,
      grantedPlatformFeatures: setGrantedPlatformFeature(
        form.grantedPlatformFeatures,
        feature.key,
        next,
      ),
      highlights: line ? setHighlight(form.highlights, line, next) : form.highlights,
    });
  };

  const toggleCapability = (key: EntitlementFeature, next: boolean) => {
    const label = CAPABILITY_LABELS[key] ?? key;
    if (!confirmUnlock(label, Boolean(form.entitlements[key]), next)) return;
    onChange({
      ...form,
      entitlements: { ...form.entitlements, [key]: next },
      highlights: applyEntitlementHighlight(form.highlights, key, next),
    });
  };
  return (
    <div className="grid gap-6 py-2">
      <section className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Identity</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Checkout still uses plan id{" "}
            <span className="font-mono">{planId}</span>. That id cannot change.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Display name" htmlFor="plan-display-name" required>
            <Input
              id="plan-display-name"
              value={form.displayName}
              onChange={(event) =>
                onChange({ ...form, displayName: event.target.value })
              }
            />
          </FormField>
          <FormField label="Internal name" htmlFor="plan-name" required>
            <Input
              id="plan-name"
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
            />
          </FormField>
        </div>
        <FormField label="Description" htmlFor="plan-description" required>
          <Textarea
            id="plan-description"
            rows={2}
            value={form.description}
            onChange={(event) =>
              onChange({ ...form, description: event.target.value })
            }
          />
        </FormField>
        <FormField
          label="Best for"
          htmlFor="plan-best-for"
          hint="Short audience line on the compare table and cards."
        >
          <Input
            id="plan-best-for"
            value={form.bestFor}
            onChange={(event) =>
              onChange({ ...form, bestFor: event.target.value })
            }
            placeholder="Junior & mid-level software engineers"
          />
        </FormField>
      </section>

      <section className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Price (INR)
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            1 credit = ₹1. Enterprise still shows Custom on the public page.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Monthly" htmlFor="plan-price-monthly" required>
            <Input
              id="plan-price-monthly"
              inputMode="numeric"
              value={form.monthlyPrice}
              onChange={(event) =>
                onChange({ ...form, monthlyPrice: event.target.value })
              }
            />
          </FormField>
          <FormField label="Quarterly" htmlFor="plan-price-quarterly" required>
            <Input
              id="plan-price-quarterly"
              inputMode="numeric"
              value={form.quarterlyPrice}
              onChange={(event) =>
                onChange({ ...form, quarterlyPrice: event.target.value })
              }
            />
          </FormField>
          <FormField label="Yearly" htmlFor="plan-price-yearly" required>
            <Input
              id="plan-price-yearly"
              inputMode="numeric"
              value={form.yearlyPrice}
              onChange={(event) =>
                onChange({ ...form, yearlyPrice: event.target.value })
              }
            />
          </FormField>
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Credits included
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Granted on purchase or renewal for that billing cycle.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Monthly" htmlFor="plan-credits-monthly" required>
            <Input
              id="plan-credits-monthly"
              inputMode="numeric"
              value={form.monthlyCredits}
              onChange={(event) =>
                onChange({ ...form, monthlyCredits: event.target.value })
              }
            />
          </FormField>
          <FormField
            label="Quarterly"
            htmlFor="plan-credits-quarterly"
            required
          >
            <Input
              id="plan-credits-quarterly"
              inputMode="numeric"
              value={form.quarterlyCredits}
              onChange={(event) =>
                onChange({ ...form, quarterlyCredits: event.target.value })
              }
            />
          </FormField>
          <FormField label="Yearly" htmlFor="plan-credits-yearly" required>
            <Input
              id="plan-credits-yearly"
              inputMode="numeric"
              value={form.yearlyCredits}
              onChange={(event) =>
                onChange({ ...form, yearlyCredits: event.target.value })
              }
            />
          </FormField>
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Feature Controls
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Same list as Super Admin → Features, including features you add
            later. Checking a box grants it to everyone currently on this plan.
            A Disabled feature stays off for shoppers even if it is checked
            here.
          </p>
        </div>
        <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {gatedFeatures.map((feature) => {
            const checked = isFeatureGranted(feature);
            const id = `plan-platform-${feature.key}`;
            return (
              <label
                key={feature.key}
                htmlFor={id}
                className={cn(
                  "flex min-h-11 min-w-0 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5",
                  checked
                    ? "border-[#7367F0]/40 bg-[#7367F0]/[0.06]"
                    : "border-border/70",
                )}
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePlatformFeature(feature, !checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#7367F0]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm leading-snug text-foreground">
                      {feature.name}
                    </span>
                    {statusBadge(feature.status)}
                  </span>
                  {feature.description ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {feature.description}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
        {platformFeatureIsGranted(
          form.entitlements,
          "peer_interviews",
          form.grantedPlatformFeatures,
        ) ? (
          <FormField
            label="Free peer interviews per billing period"
            htmlFor="plan-peer-count"
            hint="0 means they can book but pay with credits."
          >
            <Input
              id="plan-peer-count"
              inputMode="numeric"
              value={String(form.entitlements.freePeerInterviewsPerPeriod)}
              onChange={(event) =>
                onChange({
                  ...form,
                  entitlements: {
                    ...form.entitlements,
                    freePeerInterviewsPerPeriod: Math.max(
                      0,
                      Math.round(Number(event.target.value) || 0),
                    ),
                  },
                })
              }
            />
          </FormField>
        ) : null}
        <FormField
          label="Plan capabilities"
          hint="Gates that are not a Feature Controls row. Still apply immediately."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {PLAN_CAPABILITY_ENTITLEMENTS.map((key) => {
              const checked = Boolean(form.entitlements[key]);
              const id = `plan-capability-${key}`;
              return (
                <label
                  key={key}
                  htmlFor={id}
                  className={cn(
                    "flex min-h-11 min-w-0 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5",
                    checked
                      ? "border-[#7367F0]/40 bg-[#7367F0]/[0.06]"
                      : "border-border/70",
                  )}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCapability(key, !checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#7367F0]"
                  />
                  <span className="text-sm leading-snug text-foreground">
                    {CAPABILITY_LABELS[key] ?? key}
                  </span>
                </label>
              );
            })}
          </div>
        </FormField>
        <FormField
          label="Coming soon lines"
          htmlFor="plan-coming-soon"
          hint="Shown under Upcoming on the pricing card. Leave empty to hide that section."
        >
          <Textarea
            id="plan-coming-soon"
            rows={4}
            value={form.comingSoonText}
            onChange={(event) =>
              onChange({ ...form, comingSoonText: event.target.value })
            }
          />
        </FormField>
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-semibold text-foreground">Visibility</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
            <span className="text-sm">Sell this plan</span>
            <PlanSwitch
              on={form.isActive}
              label="Sell this plan"
              onToggle={() => onChange({ ...form, isActive: !form.isActive })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
            <span className="min-w-0 text-sm">
              Show on pricing page
              <span className="mt-0.5 block text-xs text-muted-foreground">
                With On sale, this is the only filter for public cards.
              </span>
            </span>
            <PlanSwitch
              on={form.isPublic}
              label="Show on pricing page"
              onToggle={() => onChange({ ...form, isPublic: !form.isPublic })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
            <span className="text-sm">Mark as popular</span>
            <PlanSwitch
              on={form.isPopular}
              label="Mark as popular"
              onToggle={() => onChange({ ...form, isPopular: !form.isPopular })}
            />
          </label>
          <FormField label="Display order" htmlFor="plan-order">
            <Input
              id="plan-order"
              inputMode="numeric"
              value={form.order}
              onChange={(event) =>
                onChange({ ...form, order: event.target.value })
              }
            />
          </FormField>
        </div>
        {planId === "trial" && !form.isActive ? (
          <p className="text-xs text-amber-700">
            Disabling Trial hides it from new checkout. People who already
            bought it keep access until it expires.
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default function SuperAdminPlansPage() {
  const { authorized, loading } = useRequirePlatformAdmin();
  const [plans, setPlans] = useState<AdminPlanRecord[]>([]);
  const [platformFeatures, setPlatformFeatures] = useState<PlatformFeature[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<AdminPlanRecord | null>(null);
  const [editForm, setEditForm] = useState<PlanFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    Promise.all([
      adminApi.listCatalogPlans(),
      adminApi.listPlatformFeatures(),
    ])
      .then(([list, features]) => {
        if (cancelled) return;
        setPlans(list);
        setPlatformFeatures(
          features.filter((item) => item.category === "product"),
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(error, "Failed to load plans"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const stats = useMemo(() => {
    const sellable = plans.filter((plan) => plan.isActive).length;
    const onPricing = plans.filter(
      (plan) => plan.isActive && plan.isPublic,
    ).length;
    return { total: plans.length, sellable, onPricing };
  }, [plans]);

  const applyUpdated = (updated: AdminPlanRecord) => {
    setPlans((prev) =>
      prev
        .map((plan) =>
          plan.planId === updated.planId ? { ...plan, ...updated } : plan,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    );
  };

  const toggleActive = async (plan: AdminPlanRecord) => {
    const next = !plan.isActive;
    if (
      !next &&
      !window.confirm(
        `Turn off ${plan.displayName}? It will leave the public pricing page and new checkout will be blocked. Existing subscribers keep their access.`,
      )
    ) {
      return;
    }
    setSavingKey(plan.planId);
    try {
      const updated = await adminApi.updateCatalogPlan(plan.planId, {
        isActive: next,
      });
      applyUpdated(updated);
      toast.success(
        next
          ? `${plan.displayName} is on sale again`
          : `${plan.displayName} is disabled`,
      );
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update plan"));
    } finally {
      setSavingKey(null);
    }
  };

  const saveEdit = async () => {
    if (!editPlan || !editForm) return;
    try {
      parseAmount(editForm.monthlyPrice, "Monthly price");
      parseAmount(editForm.quarterlyPrice, "Quarterly price");
      parseAmount(editForm.yearlyPrice, "Yearly price");
      parseAmount(editForm.monthlyCredits, "Monthly credits");
      parseAmount(editForm.quarterlyCredits, "Quarterly credits");
      parseAmount(editForm.yearlyCredits, "Yearly credits");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Check price and credit values",
      );
      return;
    }

    if (!editForm.displayName.trim() || !editForm.description.trim()) {
      toast.error("Display name and description are required");
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await adminApi.updateCatalogPlan(editPlan.planId, {
        name: editForm.name.trim(),
        displayName: editForm.displayName.trim(),
        description: editForm.description.trim(),
        pricing: {
          monthly: parseAmount(editForm.monthlyPrice, "Monthly price"),
          quarterly: parseAmount(editForm.quarterlyPrice, "Quarterly price"),
          yearly: parseAmount(editForm.yearlyPrice, "Yearly price"),
        },
        creditsIncluded: {
          monthly: parseAmount(editForm.monthlyCredits, "Monthly credits"),
          quarterly: parseAmount(editForm.quarterlyCredits, "Quarterly credits"),
          yearly: parseAmount(editForm.yearlyCredits, "Yearly credits"),
        },
        highlights: editForm.highlights,
        entitlements: editForm.entitlements,
        grantedPlatformFeatures: editForm.grantedPlatformFeatures,
        isActive: editForm.isActive,
        isPublic: editForm.isPublic,
        isPopular: editForm.isPopular,
        order: parseAmount(editForm.order, "Display order"),
        metadata: {
          bestFor: editForm.bestFor.trim(),
          comingSoonHighlights: textToLines(editForm.comingSoonText),
        },
      });
      applyUpdated(updated);
      setEditPlan(null);
      setEditForm(null);
      toast.success(`${updated.displayName} updated`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update plan"));
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        actions={
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/pricing" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              View pricing page
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={cn(appStatCard, "p-4")}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Catalog
          </p>
          <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className={cn(appStatCard, "p-4")}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            On sale
          </p>
          <p className="mt-1 text-2xl font-semibold">{stats.sellable}</p>
        </div>
        <div className={cn(appStatCard, "p-4")}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            On /pricing
          </p>
          <p className="mt-1 text-2xl font-semibold">{stats.onPricing}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        A plan appears on /pricing when both On sale and Show on pricing are
        on. Feature checkboxes grant access immediately to everyone already on
        that plan. Feature Controls can still hide a surface for the whole
        platform.
      </p>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      <div className="grid gap-4 lg:hidden">
        {plans.map((plan) => (
          <Card key={plan.planId}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {plan.displayName}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {plan.planId}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {plan.isPopular ? <Badge variant="info">Popular</Badge> : null}
                  {plan.isActive ? (
                    <Badge variant="success">On sale</Badge>
                  ) : (
                    <Badge variant="neutral">Disabled</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <p className="text-sm font-medium">
                {formatCurrency(plan.pricing.monthly)} / mo ·{" "}
                {formatCredits(plan.creditsIncluded.monthly)}
              </p>
              <p className="text-xs text-muted-foreground">
                {plan.highlights?.length ?? 0} checklist items
                {plan.isPublic ? " · shown on pricing" : " · hidden from pricing"}
              </p>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">On sale</span>
                  <PlanSwitch
                    on={plan.isActive}
                    disabled={savingKey === plan.planId}
                    label={`Toggle ${plan.displayName}`}
                    onToggle={() => void toggleActive(plan)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditPlan(plan);
                    setEditForm(toForm(plan));
                  }}
                >
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden lg:block">
        <CardContent className="px-0 py-0">
          {plans.length === 0 && !loadError ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No plans found. Restart interview-core so missing plans can be
              inserted from seed data.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Plan</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Checklist</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>On sale</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.planId}>
                      <TableCell className="min-w-0 max-w-sm">
                        <p className="font-medium text-foreground">
                          {plan.displayName}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {plan.planId}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatCurrency(plan.pricing.monthly)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {plan.creditsIncluded.monthly.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        {plan.highlights?.length ?? 0} items
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {plan.isActive ? (
                            <Badge variant="success">On sale</Badge>
                          ) : (
                            <Badge variant="neutral">Disabled</Badge>
                          )}
                          {plan.isPublic ? (
                            <Badge variant="info">Public</Badge>
                          ) : (
                            <Badge variant="neutral">Hidden</Badge>
                          )}
                          {plan.isPopular ? (
                            <Badge variant="warning">Popular</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlanSwitch
                          on={plan.isActive}
                          disabled={savingKey === plan.planId}
                          label={`Toggle ${plan.displayName}`}
                          onToggle={() => void toggleActive(plan)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditPlan(plan);
                            setEditForm(toForm(plan));
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editPlan && editForm)}
        onOpenChange={(open) => {
          if (!open && !savingEdit) {
            setEditPlan(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit {editPlan?.displayName ?? "plan"}
            </DialogTitle>
            <DialogDescription>
              Update the copy, price, and credits shoppers see. Existing
              subscribers keep access if you disable the plan.
            </DialogDescription>
          </DialogHeader>
          {editForm && editPlan ? (
            <PlanFields
              form={editForm}
              planId={editPlan.planId}
              platformFeatures={platformFeatures}
              onChange={setEditForm}
            />
          ) : null}
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditPlan(null);
                setEditForm(null);
              }}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveEdit()}
              disabled={savingEdit}
            >
              {savingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
