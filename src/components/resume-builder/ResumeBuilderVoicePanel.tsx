"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mic, MicOff, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resumeBuilderChatApi, type ChatCollectedProfile } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AssistantAvatar,
  ChatBubble,
  QuickReply,
  TypingIndicator,
} from "./resumeChatShared";
import {
  useGeminiVoiceSession,
  type VoiceStatus,
} from "./useGeminiVoiceSession";

interface ResumeBuilderVoicePanelProps {
  templateId: string;
  onReady: (profile: ChatCollectedProfile) => void;
  onBack: () => void;
  onSessionCreated?: (sessionId: string) => void;
}

function statusLabel(status: VoiceStatus, muted: boolean): string {
  switch (status) {
    case "connecting":
      return "Connecting…";
    case "ready":
      return "Getting ready…";
    case "speaking":
      return "Ava is speaking…";
    case "listening":
      return muted ? "Mic muted" : "Listening…";
    case "wrapping":
      return "Wrapping up…";
    case "building":
      return "Building your resume…";
    case "ended":
      return "All set!";
    case "error":
      return "Something went wrong";
    default:
      return "Ready when you are";
  }
}

const BUILDING_MESSAGES = [
  "Analyzing your conversation…",
  "Extracting your experience and skills…",
  "Organizing everything into your resume…",
  "Polishing the final details…",
];

/** Full-panel processing state shown while the transcript is distilled. */
function VoiceProcessingView() {
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((prev) => Math.min(prev + 1, BUILDING_MESSAGES.length - 1));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#7367F0]/20 [animation-duration:1.8s]" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-[#7367F0]/15" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#7367F0] to-[#8b7ff5] text-white shadow-[0_8px_24px_rgba(115,103,240,0.4)]">
          <Sparkles className="h-7 w-7 animate-pulse" />
        </span>
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-foreground">
          Building your resume
        </p>
        <p className="min-h-[20px] text-sm text-muted-foreground transition-all">
          {BUILDING_MESSAGES[messageIndex]}
        </p>
      </div>
      <div className="h-1.5 w-48 max-w-[70%] overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#7367F0] to-[#8b7ff5]" />
      </div>
      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(320%);
          }
        }
      `}</style>
    </div>
  );
}

export function ResumeBuilderVoicePanel({
  templateId,
  onReady,
  onBack,
  onSessionCreated,
}: Readonly<ResumeBuilderVoicePanelProps>) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    status,
    error,
    muted,
    aiSpeaking,
    building,
    messages,
    start,
    sendText,
    toggleMute,
    skipAndBuild,
    endAndBuild,
  } = useGeminiVoiceSession({ sessionId, onReady });

  useEffect(() => {
    let cancelled = false;
    async function initSession() {
      try {
        setCreating(true);
        const session = await resumeBuilderChatApi.createSession(
          templateId,
          "voice",
        );
        if (cancelled) return;
        setSessionId(session.sessionId);
        onSessionCreated?.(session.sessionId);
      } catch (err) {
        console.error("Failed to start voice session:", err);
        if (!cancelled) {
          setCreateError("Could not start the voice assistant. Please try again.");
        }
      } finally {
        if (!cancelled) setCreating(false);
      }
    }
    void initSession();
    return () => {
      cancelled = true;
    };
  }, [templateId, onSessionCreated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, aiSpeaking]);

  const handleStart = useCallback(() => {
    setStarted(true);
    start();
  }, [start]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendText(input);
    setInput("");
  }, [input, sendText]);

  const active = started && status !== "ended" && status !== "error";
  const isBusy = building || status === "building" || status === "ended";
  const showConnecting =
    started &&
    !isBusy &&
    (status === "connecting" || (status === "ready" && messages.length === 0));
  const combinedError = createError ?? error;

  return (
    <div className="flex h-[calc(100svh-11rem)] max-h-[680px] min-h-[440px] w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/60 bg-gradient-to-r from-[#7367F0]/[0.09] via-card to-transparent px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative shrink-0">
          <AssistantAvatar className="h-9 w-9" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
              active ? "bg-emerald-500" : "bg-muted-foreground/50",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Ava · Resume Coach
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                aiSpeaking ? "animate-pulse bg-[#7367F0]" : "bg-emerald-500",
              )}
            />
            <span className="truncate">{statusLabel(status, muted)}</span>
          </p>
        </div>
        {active && !isBusy ? (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
              muted
                ? "border-red-300 bg-red-50 text-red-500 hover:bg-red-100"
                : "border-border/80 bg-card text-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      {/* Body */}
      {isBusy ? (
        <div className="flex-1 overflow-hidden bg-muted/15">
          <VoiceProcessingView />
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto bg-muted/15 px-3 py-4 sm:px-4 sm:py-5"
          >
            {!started ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#7367F0]/15 [animation-duration:2.4s]" />
                  <AssistantAvatar className="relative h-14 w-14 sm:h-16 sm:w-16" />
                </div>
                <div className="max-w-sm">
                  <p className="font-semibold text-foreground">
                    Talk with Ava to build your resume
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Ava asks a few quick questions about your experience. Speak
                    naturally or type your answers — she wraps up and builds your
                    resume automatically when done.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleStart}
                  disabled={creating || !sessionId || Boolean(createError)}
                  className="h-11 rounded-xl bg-gradient-to-r from-[#7367F0] to-[#8b7ff5] px-6 text-white shadow-[0_4px_16px_rgba(115,103,240,0.35)] hover:opacity-90"
                >
                  {creating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="mr-2 h-4 w-4" />
                  )}
                  {creating ? "Preparing…" : "Start voice conversation"}
                </Button>
                {combinedError ? (
                  <p className="text-sm text-red-500">{combinedError}</p>
                ) : null}
              </div>
            ) : (
              <>
                {showConnecting ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting to Ava…
                  </div>
                ) : null}
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    createdAt={message.createdAt}
                  />
                ))}
                {aiSpeaking ? <TypingIndicator /> : null}
                {combinedError ? (
                  <p className="text-center text-sm text-red-500">
                    {combinedError}
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* Composer */}
          {started && status !== "error" ? (
            <div className="border-t border-border/60 bg-card px-3 py-2.5 sm:py-3">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <QuickReply disabled={isBusy} onClick={skipAndBuild}>
                  Skip &amp; build now
                </QuickReply>
                <QuickReply
                  variant="accent"
                  disabled={isBusy}
                  onClick={endAndBuild}
                >
                  I&apos;m done — build my resume
                </QuickReply>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-end gap-2 rounded-2xl border border-border/80 bg-background px-3 py-2 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Prefer to type? Answer here…"
                  className="max-h-32 min-h-[40px] flex-1 resize-none border-0 bg-transparent p-1.5 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send message"
                  className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#7367F0] to-[#8b7ff5] text-white shadow-[0_2px_10px_rgba(115,103,240,0.35)] hover:opacity-90"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-2 hidden px-1 text-[11px] text-muted-foreground/70 sm:block">
                Speak naturally or type · Enter to send
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
