"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegritySwitch } from "@/components/integrity/IntegritySwitch";
import { adminApi } from "@/lib/api";
import { lifecycleCardClass } from "./BillingPanels";

type Props = Readonly<{ institutionId: string }>;

export function CandidateSelfStartCard({ institutionId }: Props) {
  const [allow, setAllow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getInstitutionFeatures(institutionId)
      .then((s) => setAllow(s.allowCandidateSelfStart !== false))
      .catch(() => toast.error("Could not load interview start settings"))
      .finally(() => setLoading(false));
  }, [institutionId]);

  const save = async (next: boolean) => {
    setSaving(true);
    try {
      const state = await adminApi.updateInstitutionSelfStart(institutionId, next);
      setAllow(state.allowCandidateSelfStart !== false);
      toast.success(next ? "Candidates can start interviews themselves" : "Scheduled interviews only");
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Could not update setting",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={lifecycleCardClass}>
      <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
        <CardTitle className="text-base">Interview start control</CardTitle>
        <CardDescription>
          Choose whether candidates can start AI mock, coding, and system design rounds themselves,
          or only take interviews you schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Candidates can start interviews</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                When off, they can only start scheduled interviews for AI mock, coding, and system
                design.
              </p>
            </div>
            <IntegritySwitch
              on={allow}
              disabled={saving}
              label={
                allow
                  ? "Disable candidate self-start interviews"
                  : "Enable candidate self-start interviews"
              }
              onToggle={() => void save(!allow)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
