"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { usePeerBookingChat } from "@/hooks/usePeerBookingChat";
import type { PeerChatMessage, PeerChatPresence } from "@/lib/api";

function presenceLabel(presence: PeerChatPresence): string {
  if (presence === "online") return "Online";
  if (presence === "away") return "Away";
  return "Offline";
}

function presenceClass(presence: PeerChatPresence): string {
  if (presence === "online") return "bg-emerald-500";
  if (presence === "away") return "bg-amber-500";
  return "bg-muted-foreground/50";
}

function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: PeerChatMessage;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isOwn
            ? "rounded-br-md bg-[#7367F0] text-white"
            : "rounded-bl-md border border-border/60 bg-muted/40 text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isOwn ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function PeerMeetingChatPanel({
  bookingId,
  viewerClerkId,
  viewerRole,
  className,
}: {
  bookingId: string;
  viewerClerkId?: string;
  viewerRole?: "candidate" | "interviewer";
  className?: string;
}) {
  const {
    messages,
    partner,
    chatLocked,
    connected,
    connecting,
    partnerTyping,
    sendMessage,
    setTyping,
  } = usePeerBookingChat(bookingId, Boolean(bookingId));

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const typingSentRef = useRef(false);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, partnerTyping]);

  const handleSend = () => {
    if (!draft.trim()) return;
    if (sendMessage(draft)) {
      setDraft("");
      setTyping(false);
      typingSentRef.current = false;
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (chatLocked) return;
    if (value.trim() && !typingSentRef.current) {
      typingSentRef.current = true;
      setTyping(true);
    }
    if (!value.trim() && typingSentRef.current) {
      typingSentRef.current = false;
      setTyping(false);
    }
  };

  const partnerPresence = partner?.presence ?? "offline";
  const chatTitle =
    viewerRole === "interviewer"
      ? "Chat with Candidate"
      : viewerRole === "candidate"
        ? "Chat with Interviewer"
        : `Chat with ${partner?.displayName ?? "partner"}`;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card",
        className,
      )}
    >
      <div className="border-b border-border/60 bg-[#7367F0]/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
            <MessageSquare className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-foreground">{chatTitle}</h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", presenceClass(partnerPresence))}
              />
              <span>In room · {presenceLabel(partnerPresence)}</span>
              {!connected && connecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex max-h-[280px] min-h-[200px] flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Coordinate with your {partner?.displayName ? "partner" : "interview partner"} here
            while the session is in progress.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={Boolean(viewerClerkId && message.senderClerkId === viewerClerkId)}
            />
          ))
        )}
        {partnerTyping ? (
          <p className="text-xs italic text-muted-foreground">Typing…</p>
        ) : null}
      </div>

      <div className="border-t border-border/60 p-4">
        {chatLocked ? (
          <p className="text-center text-xs text-muted-foreground">
            Chat is closed — interview marked done. You can still read messages above.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder="Type a message…"
              rows={2}
              className="min-h-[44px] resize-none rounded-xl text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!connected}
            />
            <Button
              type="button"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl bg-[#7367F0] text-white hover:bg-[#6e62e5]"
              onClick={handleSend}
              disabled={!connected || !draft.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
