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
}: {
  icon: LucideIcon;
  /** Kept for existing callers; every section now shares the brand gradient. */
  tone?: "violet" | "cyan" | "emerald" | "amber";
}) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7367F0] to-[#1F8FFF] text-white shadow-[0_8px_20px_-10px_rgba(115,103,240,.8)]">
      <Icon className="h-[18px] w-[18px]" />
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
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <Button
        onClick={onSave}
        disabled={saving}
        className="h-10 gap-1.5 rounded-xl px-4"
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
      <Button variant="outline" disabled={saving} onClick={onCancel} className="h-10 rounded-xl px-4">
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
      <CardHeader className="border-b border-border px-5 py-5 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SectionIcon icon={icon} tone={tone} />
            <div>
              <CardTitle className="text-[17px] font-extrabold tracking-[-0.025em] text-foreground">
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
              className="h-9 shrink-0 gap-1.5 rounded-xl"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6">{children}</CardContent>
    </Card>
  );
}
