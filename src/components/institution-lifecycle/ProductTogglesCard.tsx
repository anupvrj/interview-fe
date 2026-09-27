"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IntegritySwitch } from "@/components/integrity/IntegritySwitch";
import { adminApi, type InstitutionFeatureState } from "@/lib/api";
import {
  INSTITUTION_PRODUCT_HINTS,
  INSTITUTION_PRODUCT_KEYS,
  INSTITUTION_PRODUCT_LABELS,
} from "@/lib/institution-flags";
import { cn } from "@/lib/utils";
import { lifecycleCardClass } from "./BillingPanels";

type Props = Readonly<{
  institutionId: string;
  /** super_admin edits the ceiling; institution_admin edits toggles within it. */
  scope: "super_admin" | "institution_admin";
}>;

/**
 * Two-level product access. A product reaches candidates only when the super admin
 * allows it AND the institute admin keeps it on.
 */
export function ProductTogglesCard({ institutionId, scope }: Props) {
  const [state, setState] = useState<InstitutionFeatureState | null>(null);
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const source = (s: InstitutionFeatureState) => {
    const raw = scope === "super_admin" ? s.allowed : s.admin;
    if (scope !== "institution_admin") return raw;
    const next = { ...raw };
    for (const key of INSTITUTION_PRODUCT_KEYS) {
      if (!s.allowed[key]) next[key] = false;
    }
    return next;
  };

  useEffect(() => {
    setLoading(true);
    adminApi
      .getInstitutionFeatures(institutionId)
      .then((s) => {
        setState(s);
        setDraft(source(s));
      })
      .catch(() => toast.error("Could not load products"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId, scope]);

  const dirty = useMemo(
    () => Boolean(state) && INSTITUTION_PRODUCT_KEYS.some((k) => draft[k] !== source(state!)[k]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, state],
  );

  const save = async () => {
    setSaving(true);
    try {
      const next =
        scope === "super_admin"
          ? await adminApi.updateInstitutionAllowedFeatures(institutionId, draft)
          : await adminApi.updateInstitutionAdminFeatures(institutionId, draft);
      setState(next);
      setDraft(source(next));
      toast.success("Products updated");
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Could not update products",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={lifecycleCardClass}>
      <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
        <CardTitle className="text-base">Products for candidates</CardTitle>
        <CardDescription>
          {scope === "super_admin"
            ? "Plan ceiling for this institute, including Peer interviews and AI connector. Institute admins can switch these off, but cannot turn on anything you disable."
            : "Turn products on or off for your candidates, including Peer interviews and AI connector. Locked products are not included in your plan."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {loading || !state ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <ul className="grid gap-2 sm:grid-cols-2">
              {INSTITUTION_PRODUCT_KEYS.map((key) => {
                const locked = scope === "institution_admin" && !state.allowed[key];
                const on = !locked && draft[key] !== false;
                const offByInstitute =
                  scope === "super_admin" && state.allowed[key] && !state.admin[key];
                const hint = INSTITUTION_PRODUCT_HINTS[key];
                const name = INSTITUTION_PRODUCT_LABELS[key];
                const switchLabel = locked
                  ? `${name} is not in your plan`
                  : `${on ? "Disable" : "Enable"} ${name}`;
                return (
                  <li
                    key={key}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5",
                      locked && "opacity-60",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      {hint ? (
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>
                      ) : null}
                      {offByInstitute ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">Off by institute</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {locked ? (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Not in plan" />
                      ) : null}
                      <IntegritySwitch
                        on={on}
                        disabled={locked || saving}
                        label={switchLabel}
                        onToggle={() => {
                          if (locked || saving) return;
                          setDraft((prev) => ({ ...prev, [key]: !on }));
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-end">
              <Button className="h-11 w-full sm:w-auto" onClick={() => void save()} disabled={!dirty || saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save products
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
