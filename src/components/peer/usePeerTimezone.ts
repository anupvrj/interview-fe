"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { peerApi } from "@/lib/api";
import {
  DEFAULT_PEER_TIMEZONE,
  detectBrowserTimezone,
  formatPeerTimezoneLabel,
  isValidPeerTimezone,
} from "@/components/peer/peerSlotTime";

export function usePeerTimezone() {
  const [timezone, setTimezoneState] = useState(DEFAULT_PEER_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    peerApi
      .getTimezone()
      .then(({ timezone: saved }) => {
        if (cancelled) return;
        const tz =
          saved && isValidPeerTimezone(saved) ? saved : detectBrowserTimezone();
        setTimezoneState(tz);
      })
      .catch(() => {
        if (!cancelled) setTimezoneState(detectBrowserTimezone());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTimezone = useCallback(async (next: string) => {
    if (!isValidPeerTimezone(next)) {
      toast.error("Invalid timezone");
      return;
    }
    setSaving(true);
    try {
      const { timezone: saved } = await peerApi.setTimezone(next);
      setTimezoneState(saved);
      toast.success("Timezone updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save timezone");
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    timezone,
    setTimezone,
    loading,
    saving,
    timezoneLabel: formatPeerTimezoneLabel(timezone),
  };
}
