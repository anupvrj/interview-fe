"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  resumeBuilderChatApi,
  type ChatCollectedProfile,
  type ResumeBuilderChatMessage,
  type ResumeBuilderChatMode,
} from "@/lib/api";
import {
  AssistantAvatar,
  ChatBubble,
  QuickReply,
  TypingIndicator,
} from "./resumeChatShared";

interface ResumeBuilderChatPanelProps {
  templateId: string;
  onReady: (profile: ChatCollectedProfile) => void;
  onBack: () => void;
  onSessionCreated?: (sessionId: string) => void;
}

export function ResumeBuilderChatPanel({
  templateId,
  onReady,
  onBack,
  onSessionCreated,
}: Readonly<ResumeBuilderChatPanelProps>) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ResumeBuilderChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string>("active");
  const [chatMode, setChatMode] = useState<ResumeBuilderChatMode | null>(null);
  /** Why the chat couldn't start, in words a person can act on (shown in the panel, not an alert). */
  const [startError, setStartError] = useState<string | null>(null);
  /** A message that didn't go through (what was typed is kept so it can be sent again). */
  const [sendError, setSendError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const showSkipActions = chatMode !== null && status === "active";
  const showModeOptions = chatMode === null && status === "active";

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      try {
        setLoading(true);
        setStartError(null);
        const session = await resumeBuilderChatApi.createSession(templateId);
        if (cancelled) return;
        setSessionId(session.sessionId);
        setMessages(session.messages);
        setStatus(session.status);
        setChatMode(session.mode);
        onSessionCreated?.(session.sessionId);
      } catch (error) {
        console.error("Failed to start chat session:", error);
        if (!cancelled) setStartError(getApiErrorMessage(error, "We couldn't start the AI chat. Please try again."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initSession();
    return () => {
      cancelled = true;
    };
  }, [templateId, attempt]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const sendMessage = async (
    content: string,
    action?: "skip" | "skip_and_build",
  ) => {
    if (!sessionId || sending) return;
    if (!content.trim() && !action) return;

    let sent = false;
    try {
      setSending(true);
      setSendError(null);
      const response = await resumeBuilderChatApi.sendMessage(
        sessionId,
        content,
        action,
      );
      setMessages(response.messages);
      setStatus(response.status);
      setChatMode(response.mode);
      sent = true;

      if (response.status === "ready_for_build") {
        onReady(response.collectedProfile);
      }
    } catch (error: unknown) {
      console.error("Chat message failed:", error);
      setSendError(getApiErrorMessage(error, "Your message didn't go through. Please try again."));
    } finally {
      setSending(false);
      // Keep what was typed when it didn't go through, so it can be sent again.
      if (sent) setInput("");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-[#7367F0]/[0.09] via-card to-transparent px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative">
          <AssistantAvatar className="h-9 w-9" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            Resume Assistant
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {sending ? "Typing…" : "Online · powered by AI"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto bg-muted/15 px-4 py-5"
      >
        {startError ? (
          <div role="alert" className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="text-sm font-semibold text-foreground">The AI chat didn&apos;t start</p>
            <p className="mt-1 text-sm text-muted-foreground">{startError}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Back
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="h-16 w-3/5 animate-pulse rounded-2xl rounded-tl-sm bg-muted" />
            </div>
            <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl rounded-tr-sm bg-muted" />
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatBubble
                key={`${message.role}-${index}-${message.createdAt}`}
                role={message.role}
                content={message.content}
                createdAt={message.createdAt}
              />
            ))}
            {sending ? <TypingIndicator /> : null}
            {sendError ? (
              <p role="alert" className="mx-auto max-w-md rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
                {sendError}
              </p>
            ) : null}
          </>
        )}
      </div>

      {/* Composer */}
      {status === "active" ? (
        <div className="border-t border-border/60 bg-card px-3 py-3">
          {(showModeOptions || showSkipActions) && (
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              {showModeOptions ? (
                <>
                  <QuickReply
                    disabled={sending}
                    onClick={() => void sendMessage("1")}
                  >
                    Paste all at once
                  </QuickReply>
                  <QuickReply
                    disabled={sending}
                    onClick={() => void sendMessage("2")}
                  >
                    Chat and build
                  </QuickReply>
                </>
              ) : null}
              {showSkipActions ? (
                <>
                  <QuickReply
                    disabled={sending}
                    onClick={() => void sendMessage("", "skip")}
                  >
                    Skip
                  </QuickReply>
                  <QuickReply
                    variant="accent"
                    disabled={sending}
                    onClick={() => void sendMessage("", "skip_and_build")}
                  >
                    Skip &amp; build now
                  </QuickReply>
                </>
              ) : null}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-2xl border border-border/80 bg-background px-3 py-2 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="max-h-32 min-h-[40px] flex-1 resize-none border-0 bg-transparent p-1.5 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#7367F0] to-[#8b7ff5] text-white shadow-[0_2px_10px_rgba(115,103,240,0.35)] hover:opacity-90"
              disabled={sending || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground/70">
            Press Enter to send · Shift + Enter for a new line
          </p>
        </div>
      ) : (
        <div className="border-t border-border/60 bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          Profile ready — building your resume…
        </div>
      )}
    </div>
  );
}
