"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeerBookingCardShell } from "@/components/peer/PeerBookingCardShell";
import { cn } from "@/lib/utils";
import { peerApi, type PeerChatMessage } from "@/lib/api";

const PAGE_SIZE = 10;

function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function PeerBookingChatHistoryCard({
  bookingId,
  viewerClerkId,
}: {
  bookingId: string;
  viewerClerkId?: string;
  viewerRole?: "candidate" | "interviewer";
}) {
  const [messages, setMessages] = useState<PeerChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    peerApi
      .listChatMessages(bookingId, { limit: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setMessages(res.messages);
          setHasMore(res.hasMore);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || "Could not load chat history");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0];
      const res = await peerApi.listChatMessages(bookingId, {
        limit: PAGE_SIZE,
        before: oldest.id,
      });
      setMessages((prev) => [...res.messages, ...prev]);
      setHasMore(res.hasMore);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || "Could not load older messages");
    } finally {
      setLoadingMore(false);
    }
  }, [bookingId, hasMore, loadingMore, messages]);

  return (
    <PeerBookingCardShell title="Meeting chat history" icon={MessageSquare}>
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#7367F0]" />
          Loading messages…
        </div>
      ) : error ? (
        <p className="py-4 text-sm text-muted-foreground">{error}</p>
      ) : messages.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          No messages from the meeting room yet.
        </p>
      ) : (
        <div className="space-y-3">
          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          ) : null}
          <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {messages.map((message) => {
              const isOwn = Boolean(
                viewerClerkId && message.senderClerkId === viewerClerkId,
              );
              const senderLabel = isOwn
                ? "You"
                : message.senderRole === "interviewer"
                  ? "Interviewer"
                  : "Candidate";
              return (
                <li
                  key={message.id}
                  className={cn(
                    "rounded-xl border px-3 py-2.5",
                    isOwn
                      ? "border-[#7367F0]/20 bg-[#7367F0]/[0.06]"
                      : "border-border/60 bg-muted/20",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{senderLabel}</span>
                    <time dateTime={message.createdAt}>
                      {formatMessageTime(message.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                    {message.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </PeerBookingCardShell>
  );
}
