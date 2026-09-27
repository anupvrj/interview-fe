"use client";

import { useEffect, useRef } from "react";
import {
  IntegrityTelemetryClient,
  type IntegrityWsSender,
} from "@/lib/integrity/IntegrityTelemetryClient";
import type { IntegrityEvent, IntegritySessionKind } from "@/lib/integrity/types";

export function useIntegritySession(
  kind: IntegritySessionKind,
  sessionId: string | undefined,
  enabled = true,
) {
  const clientRef = useRef<IntegrityTelemetryClient | null>(null);

  if (sessionId && !clientRef.current) {
    clientRef.current = new IntegrityTelemetryClient(kind, sessionId);
  }
  if (
    sessionId &&
    clientRef.current &&
    (clientRef.current.sessionId !== sessionId ||
      clientRef.current.kind !== kind)
  ) {
    clientRef.current.dispose();
    clientRef.current = new IntegrityTelemetryClient(kind, sessionId);
  }

  useEffect(() => {
    clientRef.current?.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return undefined;
    const onHide = () => {
      void client.flush({ keepalive: true });
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      client.dispose();
      if (clientRef.current === client) clientRef.current = null;
    };
  }, [kind, sessionId]);

  return {
    emit: (event: IntegrityEvent) => clientRef.current?.emit(event),
    bindWs: (send: IntegrityWsSender | null) => clientRef.current?.bindWs(send),
    flush: () => clientRef.current?.flush(),
    client: clientRef.current,
  };
}
