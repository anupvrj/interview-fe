"use client";

import { Label } from "@/components/ui/label";
import { LayoutNumberField } from "@/components/resume-editor/LayoutTypographyControls";
import type { LayoutPaddingMm } from "@/lib/resume-page-dimensions";

type PaddingSide = keyof LayoutPaddingMm;

interface LayoutPaddingControlsProps {
  padding: LayoutPaddingMm;
  onChange: (padding: LayoutPaddingMm) => void;
}

export function LayoutPaddingControls({
  padding,
  onChange,
}: LayoutPaddingControlsProps) {
  const updateSide = (side: PaddingSide, value: number) => {
    onChange({
      ...padding,
      [side]: value,
    });
  };

  return (
    <div className="space-y-2 border-t pt-2">
      <Label className="text-xs font-semibold text-muted-foreground">Padding (mm)</Label>
      <div className="grid grid-cols-2 gap-2">
        <LayoutNumberField
          label="Top"
          value={padding.top}
          min={0}
          max={50}
          step={1}
          onChange={(value) => updateSide("top", value)}
        />
        <LayoutNumberField
          label="Bottom"
          value={padding.bottom}
          min={0}
          max={50}
          step={1}
          onChange={(value) => updateSide("bottom", value)}
        />
        <LayoutNumberField
          label="Left"
          value={padding.left}
          min={0}
          max={50}
          step={1}
          onChange={(value) => updateSide("left", value)}
        />
        <LayoutNumberField
          label="Right"
          value={padding.right}
          min={0}
          max={50}
          step={1}
          onChange={(value) => updateSide("right", value)}
        />
      </div>
    </div>
  );
}
