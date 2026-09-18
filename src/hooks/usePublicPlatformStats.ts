"use client";

import { useEffect, useState } from "react";
import {
  marketingApi,
  type PublicPlatformStats,
} from "@/lib/api";

const FALLBACK_STATS: PublicPlatformStats = {
  users: 3000,
  resumes: 3000,
  interviews: 5000,
};

export function usePublicPlatformStats(): {
  stats: PublicPlatformStats | null;
  ready: boolean;
} {
  const [stats, setStats] = useState<PublicPlatformStats | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    marketingApi
      .getPublicStats()
      .then((live) => {
        if (cancelled) return;
        setStats({
          users: Math.max(0, Number(live.users) || 0),
          resumes: Math.max(0, Number(live.resumes) || 0),
          interviews: Math.max(0, Number(live.interviews) || 0),
        });
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setStats(FALLBACK_STATS);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, ready };
}
