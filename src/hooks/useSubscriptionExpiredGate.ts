"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSubscriptionExpired } from "@/lib/subscriptionAccess";

export function useSubscriptionExpiredGate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const guardSessionStart = useCallback(async (action: () => void) => {
    setChecking(true);
    try {
      const expired = await fetchSubscriptionExpired();
      if (expired) {
        setOpen(true);
        return;
      }
      action();
    } finally {
      setChecking(false);
    }
  }, []);

  const navigateToNewSession = useCallback(
    (path: string) => {
      void guardSessionStart(() => router.push(path));
    },
    [guardSessionStart, router],
  );

  return {
    open,
    setOpen,
    checking,
    guardSessionStart,
    navigateToNewSession,
  };
}
