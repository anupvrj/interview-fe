"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminApi, type InstitutionFeatureState } from "@/lib/api";
import { INSTITUTION_PRODUCT_KEYS, INSTITUTION_PRODUCT_LABELS } from "@/lib/institution-flags";
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

  const source = (s: InstitutionFeatureState) => (scope === "super_admin" ? s.allowed : s.admin);

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
            ? "What this institute's plan includes. Institute admins can switch these off, but cannot turn on anything you disable."
            : "Turn products on or off for your candidates. Locked products are not included in your plan."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {loading || !state ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {INSTITUTION_PRODUCT_KEYS.map((key) => {
                const locked = scope === "institution_admin" && !state.allowed[key];
                const checked = !locked && draft[key] !== false;
                const offByInstitute = scope === "super_admin" && state.allowed[key] && !state.admin[key];
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5 text-sm",
                      locked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#7367F0]"
                      checked={checked}
                      disabled={locked || saving}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.checked }))}
                    />
                    <span className="min-w-0 flex-1">{INSTITUTION_PRODUCT_LABELS[key]}</span>
                    {locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Not in plan" /> : null}
                    {offByInstitute ? (
                      <span className="text-[11px] text-muted-foreground">Off by institute</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button className="h-11 w-full sm:w-auto" onClick={save} disabled={!dirty || saving}>
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
