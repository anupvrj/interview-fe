import { cn } from "@/lib/utils";
import type { VoiceHighlightStyle } from "@/lib/voiceProviders";

const STYLE_CLASS: Record<VoiceHighlightStyle, string> = {
  popular: "voice-highlight-tag-popular",
  trending: "voice-highlight-tag-trending",
  flash: "voice-highlight-tag-flash",
  new: "voice-highlight-tag-new",
  hot: "voice-highlight-tag-hot",
};

export function VoiceHighlightTag({
  label,
  style,
  className,
}: Readonly<{
  label: string;
  style: VoiceHighlightStyle;
  className?: string;
}>) {
  const text = label.trim();
  if (!text) return null;

  return (
    <sup
      className={cn("voice-highlight-tag", STYLE_CLASS[style], className)}
    >
      <span className="voice-highlight-tag-shine" aria-hidden />
      <span className="voice-highlight-tag-text">{text}</span>
    </sup>
  );
}
