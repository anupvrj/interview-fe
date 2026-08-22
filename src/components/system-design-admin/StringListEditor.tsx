"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StringListEditorProps {
  readonly label: string;
  readonly value: string[];
  readonly onChange: (value: string[]) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly stacked?: boolean;
}

const FIELD_LABEL =
  "text-xs font-medium leading-snug text-muted-foreground";

function splitBulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter(Boolean);
}

export function StringListEditor({
  label,
  value,
  onChange,
  placeholder = "Enter item…",
  disabled,
  stacked = false,
}: StringListEditorProps) {
  const updateItem = (index: number, text: string) => {
    const next = [...value];
    next[index] = text;
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addItem = () => onChange([...value, ""]);

  const pasteBullets = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = splitBulletLines(text);
      if (lines.length === 0) {
        toast.message("Clipboard is empty or has no bullet lines");
        return;
      }
      onChange([...value.filter(Boolean), ...lines]);
      toast.success(`Added ${lines.length} item${lines.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Could not read clipboard");
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2",
        !stacked &&
          "md:grid-cols-[11rem_minmax(0,1fr)] md:gap-x-5 lg:grid-cols-[12rem_minmax(0,1fr)]",
      )}
    >
      <Label className={cn(FIELD_LABEL, !stacked && "md:pt-1")}>{label}</Label>
      <div className="min-w-0 space-y-2">
        {!disabled ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={pasteBullets}>
              Paste bullets
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add item
            </Button>
          </div>
        ) : null}
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">
                  {index + 1}.
                </span>
                <Input
                  value={item}
                  disabled={disabled}
                  placeholder={placeholder}
                  className="h-10 bg-card shadow-none"
                  onChange={(e) => updateItem(index, e.target.value)}
                />
                {!disabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove item"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
