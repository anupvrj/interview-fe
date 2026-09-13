"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceHighlightTag } from "@/components/interview/VoiceHighlightTag";
import { cn } from "@/lib/utils";
import {
  formatVoiceProviderChoiceLabel,
  resolveVoiceHighlightStyle,
  voiceAllowsDuration,
  type VoiceProvider,
  type VoiceProviderOption,
} from "@/lib/voiceProviders";

export function VoiceProviderSelect({
  id,
  value,
  onChange,
  options,
  durationMinutes,
  className,
}: Readonly<{
  id?: string;
  value: VoiceProvider;
  onChange: (value: VoiceProvider) => void;
  options: VoiceProviderOption[];
  durationMinutes: number;
  className?: string;
}>) {
  const selected = options.find((option) => option.id === value) ?? options[0];
  const selectedTag = selected?.highlightTag?.trim();
  const selectedStyle = selected
    ? resolveVoiceHighlightStyle(selected)
    : null;

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as VoiceProvider)}
    >
      <SelectTrigger
        id={id}
        className={cn(
          "overflow-visible [&>span]:line-clamp-none [&>span]:overflow-visible",
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-baseline overflow-visible">
          <SelectValue />
          {selectedTag && selectedStyle ? (
            <VoiceHighlightTag label={selectedTag} style={selectedStyle} />
          ) : null}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const tag = option.highlightTag?.trim();
          const style = resolveVoiceHighlightStyle(option);
          const hint = option.decisionHint?.trim();
          const durationEnabled = voiceAllowsDuration(option, durationMinutes);
          return (
            <SelectPrimitive.Item
              key={option.id}
              value={option.id}
              disabled={!durationEnabled}
              className={cn(
                "relative flex w-full cursor-default select-none flex-col items-stretch gap-0.5 overflow-visible rounded-sm py-2.5 pl-8 pr-2 text-sm text-foreground outline-none",
                "focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
              )}
            >
              <span className="absolute left-2 top-3 flex h-3.5 w-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                  <Check className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
              </span>
              <span className="flex min-w-0 items-baseline">
                <SelectPrimitive.ItemText>
                  {formatVoiceProviderChoiceLabel(option)}
                </SelectPrimitive.ItemText>
                {tag && style ? (
                  <VoiceHighlightTag label={tag} style={style} />
                ) : null}
              </span>
              {hint ? (
                <span className="block text-[11px] font-normal leading-snug text-muted-foreground">
                  {hint}
                </span>
              ) : null}
              {durationEnabled ? null : (
                <span className="block text-[11px] text-muted-foreground">
                  Not available for {durationMinutes} min
                </span>
              )}
            </SelectPrimitive.Item>
          );
        })}
      </SelectContent>
    </Select>
  );
}
