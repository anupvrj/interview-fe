"use client";

import { Label } from "@/components/ui/label";
import { JobRoleSelect, shouldClearRoleOnIndustryChange } from "@/components/career/JobRoleSelect";
import { AppSelect } from "@/components/ui/app-select";
import {
  industrySelectOptions,
  normalizeIndustry,
} from "@/lib/career-catalog";
import { cn } from "@/lib/utils";

type IndustryRoleFieldsProps = {
  industryId: string;
  roleId: string;
  industry: string;
  role: string;
  onIndustryChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  disabled?: boolean;
  industryLabel?: string;
  roleLabel?: string;
  industryPlaceholder?: string;
  rolePlaceholder?: string;
  allowEmptyIndustry?: boolean;
  allowEmptyRole?: boolean;
  emptyIndustryLabel?: string;
  emptyRoleLabel?: string;
  className?: string;
  industryClassName?: string;
  roleClassName?: string;
  layout?: "stack" | "grid";
};

export function IndustryRoleFields({
  industryId,
  roleId,
  industry,
  role,
  onIndustryChange,
  onRoleChange,
  disabled = false,
  industryLabel = "Industry",
  roleLabel = "Role",
  industryPlaceholder = "Select industry",
  rolePlaceholder = "Type or select a role",
  allowEmptyIndustry = false,
  allowEmptyRole = false,
  emptyIndustryLabel = "All industries",
  emptyRoleLabel = "All roles",
  className,
  industryClassName,
  roleClassName,
  layout = "stack",
}: IndustryRoleFieldsProps) {
  const normalizedIndustry = normalizeIndustry(industry);

  const handleIndustryChange = (value: string) => {
    onIndustryChange(value);
    if (shouldClearRoleOnIndustryChange(role, value)) {
      onRoleChange("");
    }
  };

  const containerClass =
    layout === "grid"
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
      : "flex flex-col gap-3";

  return (
    <div className={cn(containerClass, className)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={industryId} className="text-xs font-medium text-muted-foreground">
          {industryLabel}
        </Label>
        <AppSelect
          id={industryId}
          value={normalizedIndustry}
          onChange={handleIndustryChange}
          disabled={disabled}
          allowEmpty={allowEmptyIndustry}
          emptyLabel={emptyIndustryLabel}
          placeholder={industryPlaceholder}
          options={industrySelectOptions()}
          className={cn("h-11 bg-card", industryClassName)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={roleId} className="text-xs font-medium text-muted-foreground">
          {roleLabel}
        </Label>
        <JobRoleSelect
          id={roleId}
          value={role}
          onChange={onRoleChange}
          industry={normalizedIndustry || undefined}
          disabled={disabled || (!allowEmptyRole && !normalizedIndustry)}
          placeholder={
            normalizedIndustry || allowEmptyRole
              ? allowEmptyRole
                ? emptyRoleLabel
                : rolePlaceholder
              : "Select industry first"
          }
          inputClassName={cn("h-11 bg-card", roleClassName)}
        />
      </div>
    </div>
  );
}
