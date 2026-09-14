"use client";

import type { ReactNode } from "react";
import { Edit2, Loader2, Save, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { cn } from "@/lib/utils";
import {
  profileCardClass,
  profileFieldTileClass,
  profileSectionLabelClass,
} from "@/components/profile/profile-styles";

export function ProfileField({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(profileFieldTileClass, className)}>
      <p className={profileSectionLabelClass}>{label}</p>
      {children ?? (
        <p className="mt-1.5 text-sm font-medium text-foreground">
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}

export function SectionIcon({
  icon: Icon,
  tone = "violet",
}: {
  icon: LucideIcon;
  tone?: "violet" | "cyan" | "emerald" | "amber";
}) {
  const toneClass = {
    violet: "border-[#7367F0]/15 bg-[#7367F0]/10 text-[#7367F0]",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  }[tone];

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
        toneClass,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function ProfileEditActions({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
      <Button
        size="sm"
        onClick={onSave}
        disabled={saving}
        className={`gap-1.5 ${institutePrimaryClass}`}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save
          </>
        )}
      </Button>
      <Button size="sm" variant="outline" disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

export function ProfileApplicationSectionCard({
  title,
  description,
  icon,
  tone = "violet",
  editing,
  onEdit,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "violet" | "cyan" | "emerald" | "amber";
  editing: boolean;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <Card className={profileCardClass}>
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SectionIcon icon={icon} tone={tone} />
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {title}
              </CardTitle>
              <CardDescription className="mt-0.5 text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}
