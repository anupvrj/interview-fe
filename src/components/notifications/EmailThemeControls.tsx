"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_EMAIL_THEME,
  type EmailThemeSettings,
} from "@/lib/notifications/email-theme";

interface EmailThemeControlsProps {
  theme: EmailThemeSettings;
  onChange: (next: EmailThemeSettings) => void;
  disabled?: boolean;
  className?: string;
}

function FieldSection({
  title,
  columns = 3,
  children,
}: {
  title: string;
  columns?: 2 | 3;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-foreground">{title}</p>
      <div
        className={cn(
          "grid gap-3",
          columns === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Label above input; fixed label band keeps inputs aligned in inline grids. */
function FieldCell({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <Label className="mb-1.5 block min-h-[2.25rem] text-xs font-medium leading-4 text-muted-foreground">
        {label}
      </Label>
      <div className="w-full">{children}</div>
    </div>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <FieldCell label={label}>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-full"
      />
    </FieldCell>
  );
}

function ColorField({
  label,
  value,
  disabled,
  onChange,
  className,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <FieldCell label={label} className={className}>
      <div className="flex w-full gap-2">
        <input
          type="color"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border/60 bg-transparent p-0.5"
          aria-label={`${label} color picker`}
        />
        <Input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 min-w-0 flex-1 font-mono text-xs"
        />
      </div>
    </FieldCell>
  );
}

export function EmailThemeControls({
  theme,
  onChange,
  disabled,
  className,
}: EmailThemeControlsProps) {
  const set = <K extends keyof EmailThemeSettings>(
    key: K,
    value: EmailThemeSettings[K],
  ) => onChange({ ...theme, [key]: value });

  return (
    <div className={cn("space-y-6", className)}>
      <FieldSection title="Typography" columns={3}>
        <NumField
          label="H1 size (px)"
          value={theme.h1FontSize}
          min={16}
          max={40}
          disabled={disabled}
          onChange={(v) => set("h1FontSize", v)}
        />
        <NumField
          label="H2 size (px)"
          value={theme.h2FontSize}
          min={14}
          max={32}
          disabled={disabled}
          onChange={(v) => set("h2FontSize", v)}
        />
        <NumField
          label="H3 size (px)"
          value={theme.h3FontSize}
          min={13}
          max={28}
          disabled={disabled}
          onChange={(v) => set("h3FontSize", v)}
        />
        <NumField
          label="Body text (px)"
          value={theme.bodyFontSize}
          min={12}
          max={22}
          disabled={disabled}
          onChange={(v) => set("bodyFontSize", v)}
        />
        <NumField
          label="Eyebrow (px)"
          value={theme.eyebrowFontSize}
          min={9}
          max={16}
          disabled={disabled}
          onChange={(v) => set("eyebrowFontSize", v)}
        />
        <NumField
          label="Footer (px)"
          value={theme.footerFontSize}
          min={10}
          max={16}
          disabled={disabled}
          onChange={(v) => set("footerFontSize", v)}
        />
        <NumField
          label="Tagline (px)"
          value={theme.taglineFontSize}
          min={14}
          max={28}
          disabled={disabled}
          onChange={(v) => set("taglineFontSize", v)}
        />
        <NumField
          label="Copyright (px)"
          value={theme.copyrightFontSize}
          min={9}
          max={14}
          disabled={disabled}
          onChange={(v) => set("copyrightFontSize", v)}
        />
        <NumField
          label="Line height"
          value={theme.lineHeight}
          min={1.2}
          max={2}
          step={0.05}
          disabled={disabled}
          onChange={(v) => set("lineHeight", v)}
        />
      </FieldSection>

      <FieldSection title="Layout" columns={2}>
        <NumField
          label="Desktop max width (px)"
          value={theme.desktopMaxWidth}
          min={480}
          max={720}
          disabled={disabled}
          onChange={(v) => set("desktopMaxWidth", v)}
        />
        <NumField
          label="Content padding (px)"
          value={theme.contentPadding}
          min={12}
          max={48}
          disabled={disabled}
          onChange={(v) => set("contentPadding", v)}
        />
        <NumField
          label="Mobile padding (px)"
          value={theme.mobileContentPadding}
          min={8}
          max={32}
          disabled={disabled}
          onChange={(v) => set("mobileContentPadding", v)}
        />
        <NumField
          label="Mobile breakpoint (px)"
          value={theme.mobileBreakpoint}
          min={360}
          max={600}
          disabled={disabled}
          onChange={(v) => set("mobileBreakpoint", v)}
        />
      </FieldSection>

      <FieldSection title="Colors" columns={2}>
        <ColorField
          label="Brand color"
          value={theme.brandColor}
          disabled={disabled}
          onChange={(v) => set("brandColor", v)}
        />
        <ColorField
          label="Brand light"
          value={theme.brandLightColor}
          disabled={disabled}
          onChange={(v) => set("brandLightColor", v)}
        />
        <ColorField
          label="Body text"
          value={theme.bodyTextColor}
          disabled={disabled}
          onChange={(v) => set("bodyTextColor", v)}
        />
        <ColorField
          label="Muted text"
          value={theme.mutedTextColor}
          disabled={disabled}
          onChange={(v) => set("mutedTextColor", v)}
        />
        <ColorField
          label="Background"
          value={theme.backgroundColor}
          disabled={disabled}
          onChange={(v) => set("backgroundColor", v)}
          className="sm:col-span-2"
        />
      </FieldSection>

      <div className="space-y-2 rounded-lg border border-border/60 p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={disabled}
            checked={theme.scaleTypographyOnMobile}
            onChange={(e) => set("scaleTypographyOnMobile", e.target.checked)}
            className="h-4 w-4 accent-[#7367F0]"
          />
          Scale typography on mobile
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={disabled}
            checked={theme.stackButtonsOnMobile}
            onChange={(e) => set("stackButtonsOnMobile", e.target.checked)}
            className="h-4 w-4 accent-[#7367F0]"
          />
          Stack buttons full-width on mobile
        </label>
      </div>

      <button
        type="button"
        disabled={disabled}
        className="text-xs text-[#7367F0] hover:underline"
        onClick={() => onChange({ ...DEFAULT_EMAIL_THEME })}
      >
        Reset style settings to defaults
      </button>
    </div>
  );
}
