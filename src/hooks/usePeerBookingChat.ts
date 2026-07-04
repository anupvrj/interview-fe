"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAuthToken,
  type PeerChatMessage,
  type PeerChatPartner,
  type PeerChatPresence,
} from "@/lib/api";
import { BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES } from "@/lib/interviewWebSocketPolicy";

const PING_INTERVAL_MS = 15_000;
const MAX_RECONNECT_ATTEMPTS = 8;

function buildChatWebSocketUrl(bookingId: string, token: string | null): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
  const baseUrl = apiUrl.replace(/\/api$/, "").replace(/^https?:\/\//, "");
  const wsProtocol = globalThis.location.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("clerk-user-id") : null;
  if (userId) params.set("userId", userId);
  const qs = params.toString();
  return `${wsProtocol}//${baseUrl}/api/peer/bookings/${bookingId}/chat${qs ? `?${qs}` : ""}`;
}

function upsertMessage(list: PeerChatMessage[], message: PeerChatMessage): PeerChatMessage[] {
  const idx = list.findIndex(
    (m) =>
      m.id === message.id ||
      (message.clientMessageId &&
        m.clientMessageId === message.clientMessageId),
  );
  if (idx >= 0) {
    const next = [...list];
    next[idx] = message;
    return next;
  }
  return [...list, message];
}

export function usePeerBookingChat(bookingId: string, enabled = true) {
  const [messages, setMessages] = useState<PeerChatMessage[]>([]);
  const [partner, setPartner] = useState<PeerChatPartner | null>(null);
  const [chatLocked, setChatLocked] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panelOpenRef = useRef(panelOpen);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    panelOpenRef.current = panelOpen;
    if (panelOpen) setUnreadCount(0);
  }, [panelOpen]);

  const clearTimers = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const sendPayload = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  }, []);

  const connect = useCallback(async () => {
    if (!enabled || !bookingId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    setConnecting(true);
    const token = await getAuthToken();
    const url = buildChatWebSocketUrl(bookingId, token);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      reconnectAttemptRef.current = 0;
      pingTimerRef.current = setInterval(() => {
        sendPayload({ type: "ping" });
      }, PING_INTERVAL_MS);
      sendPayload({
        type: "visibility",
        visible: document.visibilityState === "visible",
      });
    };

    ws.onmessage = (event) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        return;
      }

      const type = String(data.type || "");

      if (type === "connected") {
        setChatLocked(Boolean(data.chatLocked));
        if (data.partner && typeof data.partner === "object") {
          setPartner(data.partner as PeerChatPartner);
        }
        return;
      }

      if (type === "history" && Array.isArray(data.messages)) {
        setMessages(data.messages as PeerChatMessage[]);
        return;
      }

      if (type === "message" && data.message) {
        const message = data.message as PeerChatMessage;
        setMessages((prev) => upsertMessage(prev, message));
        if (!panelOpenRef.current) {
          setUnreadCount((n) => n + 1);
        }
        return;
      }

      if (type === "presence_update" && data.clerkId) {
        const presence = data.presence as PeerChatPresence;
        setPartner((prev) =>
          prev && prev.clerkId === data.clerkId ? { ...prev, presence } : prev,
        );
        return;
      }

      if (type === "chat_locked") {
        setChatLocked(true);
        return;
      }

      if (type === "typing" && data.clerkId) {
        setPartner((prev) => {
          if (!prev || prev.clerkId !== data.clerkId) return prev;
          const isTyping = Boolean(data.isTyping);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          if (isTyping) {
            setPartnerTyping(true);
            typingTimerRef.current = setTimeout(() => setPartnerTyping(false), 3000);
          } else {
            setPartnerTyping(false);
          }
          return prev;
        });
        return;
      }
    };

    ws.onclose = (event) => {
      setConnected(false);
      setConnecting(false);
      clearTimers();
      wsRef.current = null;

      if (!enabled) return;
      if (!BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES.has(event.code) && event.code !== 1008) {
        return;
      }
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) return;

      const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, 30_000);
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        void connect();
      }, delay);
    };

    ws.onerror = () => {
      setConnecting(false);
    };
  }, [bookingId, clearTimers, enabled, sendPayload]);

  useEffect(() => {
    if (!enabled) return;
    void connect();

    const onVisibility = () => {
      sendPayload({
        type: "visibility",
        visible: document.visibilityState === "visible",
      });
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [bookingId, clearTimers, connect, enabled, sendPayload]);

  const sendMessage = useCallback(
    (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || chatLocked) return false;
      const clientMessageId = crypto.randomUUID();
      sendPayload({ type: "message", body: trimmed, clientMessageId });
      return true;
    },
    [chatLocked, sendPayload],
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      sendPayload({ type: "typing", isTyping });
    },
    [sendPayload],
  );

  return {
    messages,
    partner,
    chatLocked,
    connected,
    connecting,
    partnerTyping,
    unreadCount,
    panelOpen,
    setPanelOpen,
    sendMessage,
    setTyping,
  };
}
