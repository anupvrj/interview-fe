"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INPUT_CLASS =
  "h-7 w-[4.25rem] shrink-0 !h-7 !px-1.5 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface LayoutNumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function LayoutNumberField({
  label,
  value,
  min,
  max,
  step = 0.5,
  onChange,
}: LayoutNumberFieldProps) {
  const clamp = (next: number) =>
    Math.max(min, Math.min(max, Number(next.toFixed(1))));

  return (
    <div className="space-y-1">
      <Label className="block text-xs font-normal text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onChange(clamp(value - step))}
          aria-label={`Decrease ${label}`}
        >
          -
        </Button>
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
          className={INPUT_CLASS}
          aria-label={label}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onChange(clamp(value + step))}
          aria-label={`Increase ${label}`}
        >
          +
        </Button>
      </div>
    </div>
  );
}

export interface LayoutTypographyValues {
  fontSize: {
    heading: number;
    subheading: number;
    body: number;
    small: number;
    sectionHeader: number;
  };
  fontFamily: string;
}

interface FontOption {
  value: string;
  label: string;
}

interface LayoutTypographyControlsProps {
  typography: LayoutTypographyValues;
  fontFamilyOptions: FontOption[];
  selectedFontFamily: string;
  onFontSizeChange: (
    key: keyof LayoutTypographyValues["fontSize"],
    value: number,
  ) => void;
  onFontFamilyChange: (value: string) => void;
}

export function LayoutTypographyControls({
  typography,
  fontFamilyOptions,
  selectedFontFamily,
  onFontSizeChange,
  onFontFamilyChange,
}: LayoutTypographyControlsProps) {
  return (
    <div className="space-y-2 border-t border-border/60 pt-2">
      <Label className="text-xs font-semibold text-muted-foreground">Typography</Label>

      <div className="grid grid-cols-2 gap-3">
        <LayoutNumberField
          label="Heading"
          value={typography.fontSize.heading}
          min={10}
          max={48}
          onChange={(value) => onFontSizeChange("heading", value)}
        />
        <LayoutNumberField
          label="Subheading"
          value={typography.fontSize.subheading}
          min={8}
          max={36}
          onChange={(value) => onFontSizeChange("subheading", value)}
        />
        <LayoutNumberField
          label="Body"
          value={typography.fontSize.body}
          min={8}
          max={24}
          onChange={(value) => onFontSizeChange("body", value)}
        />
        <LayoutNumberField
          label="Small"
          value={typography.fontSize.small}
          min={6}
          max={20}
          onChange={(value) => onFontSizeChange("small", value)}
        />
        <LayoutNumberField
          label="Section header"
          value={typography.fontSize.sectionHeader}
          min={8}
          max={24}
          onChange={(value) => onFontSizeChange("sectionHeader", value)}
        />
      </div>

      <div className="space-y-1 pt-1">
        <Label className="block text-xs font-normal text-gray-500">
          Font family
        </Label>
        <Select value={selectedFontFamily} onValueChange={onFontFamilyChange}>
          <SelectTrigger className="h-7 w-[9.5rem] max-w-full shrink-0 !h-7 !px-2 text-xs">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {fontFamilyOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
