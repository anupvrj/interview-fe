"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Renders assistant/user message text with **bold** and preserved newlines. */
export function renderMessageContent(content: string) {
  const html = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  return (
    <span
      className="block whitespace-pre-line"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function formatTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AssistantAvatar({
  className,
}: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7367F0] to-[#8b7ff5] text-white shadow-[0_2px_8px_rgba(115,103,240,0.35)]",
        className,
      )}
    >
      <Sparkles className="h-4 w-4" />
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <AssistantAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-card px-4 py-3 shadow-sm ring-1 ring-border/50">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
      </div>
    </div>
  );
}

/** A single chat bubble (assistant on the left, user on the right). */
export function ChatBubble({
  role,
  content,
  createdAt,
}: Readonly<{
  role: "assistant" | "user";
  content: string;
  createdAt?: string;
}>) {
  const isAssistant = role === "assistant";
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {isAssistant ? <AssistantAvatar /> : null}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isAssistant ? "items-start" : "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isAssistant
              ? "rounded-tl-sm bg-card text-foreground shadow-sm ring-1 ring-border/50"
              : "rounded-tr-sm bg-gradient-to-br from-[#7367F0] to-[#8b7ff5] text-white shadow-[0_2px_10px_rgba(115,103,240,0.3)]",
          )}
        >
          {renderMessageContent(content)}
        </div>
        {formatTime(createdAt) ? (
          <span className="px-1 text-[11px] text-muted-foreground/70">
            {formatTime(createdAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function QuickReply({
  children,
  onClick,
  disabled,
  variant = "default",
}: Readonly<{
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "accent";
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variant === "accent"
          ? "border-primary/30 bg-primary/[0.08] text-primary hover:bg-primary/15"
          : "border-border/80 bg-card text-foreground hover:border-primary/35 hover:bg-primary/[0.06] hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
