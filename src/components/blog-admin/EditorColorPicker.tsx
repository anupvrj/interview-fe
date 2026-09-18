"use client";

import { useEffect, useRef, useState } from "react";
import { Baseline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BLOG_TEXT_COLORS } from "@/components/blog-admin/extensions/blogTextColor";
import { cn } from "@/lib/utils";

interface EditorColorPickerProps {
  readonly value: string;
  readonly onChange: (color: string) => void;
  readonly disabled?: boolean;
}

function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const hex = trimmed.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  if (/^[0-9a-f]{6}$/i.test(trimmed)) return `#${trimmed}`;
  return trimmed;
}

function DefaultColorSwatch({ selected }: { readonly selected: boolean }) {
  return (
    <span
      className={cn(
        "relative flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-popover",
      )}
    >
      <span className="absolute h-px w-5 rotate-45 bg-destructive/80" />
    </span>
  );
}

export function EditorColorPicker({
  value,
  onChange,
  disabled = false,
}: EditorColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value || "#7367F0");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setCustomColor(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current || !rootRef.current) return;

    const panel = panelRef.current;
    const anchor = rootRef.current;
    const rect = anchor.getBoundingClientRect();
    const panelWidth = panel.offsetWidth;
    const viewportPadding = 8;

    let left = 0;
    const overflowRight = rect.left + panelWidth - window.innerWidth + viewportPadding;
    if (overflowRight > 0) {
      left = -overflowRight;
    }

    const overflowLeft = rect.left + left - viewportPadding;
    if (overflowLeft < 0) {
      left -= overflowLeft;
    }

    panel.style.left = `${left}px`;
  }, [open]);

  const swatchColor = value || "#111827";
  const previewColor = normalizeHexColor(customColor) || "#7367F0";

  const applyCustomColor = () => {
    const normalized = normalizeHexColor(customColor);
    if (normalized.startsWith("#")) {
      onChange(normalized);
      setCustomColor(normalized);
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        title="Text color"
        className={cn("h-8 w-8 shrink-0", open && "bg-muted")}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex flex-col items-center gap-0.5">
          <Baseline className="h-3.5 w-3.5" />
          <span
            className="h-1 w-4 rounded-full border border-border/60"
            style={{ backgroundColor: swatchColor }}
          />
        </span>
      </Button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute top-[calc(100%+6px)] z-[100] w-[252px] rounded-xl border border-border bg-popover p-3 shadow-xl"
        >
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Text color
          </p>

          <div className="grid grid-cols-7 gap-2">
            {BLOG_TEXT_COLORS.map((option) => {
              const selected = value === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  title={option.label}
                  className="flex items-center justify-center rounded-full p-0.5 transition-transform hover:scale-105"
                  onClick={() => {
                    onChange(option.value);
                    if (option.value) setCustomColor(option.value);
                    setOpen(false);
                  }}
                >
                  {option.value === "" ? (
                    <DefaultColorSwatch selected={selected} />
                  ) : (
                    <span
                      className={cn(
                        "h-7 w-7 rounded-full border border-black/10 shadow-sm",
                        selected && "ring-2 ring-primary ring-offset-2 ring-offset-popover",
                      )}
                      style={{ backgroundColor: option.value }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">
              Custom color
            </p>
            <div className="flex items-center gap-2">
              <label
                htmlFor="editor-custom-color"
                className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-muted/30"
                title="Pick a custom color"
              >
                <span
                  className="absolute inset-1 rounded-md border border-black/5"
                  style={{ backgroundColor: previewColor }}
                />
                <input
                  id="editor-custom-color"
                  type="color"
                  value={previewColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    onChange(e.target.value);
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <Input
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onBlur={applyCustomColor}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCustomColor();
                    setOpen(false);
                  }
                }}
                placeholder="#7367F0"
                spellCheck={false}
                className="h-9 min-w-0 flex-1 px-2.5 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
