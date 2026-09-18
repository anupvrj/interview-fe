"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { affiliateApi } from "@/lib/api";
import {
  isValidReferralCode,
  rememberReferralCode,
} from "@/lib/affiliate-cookies";

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams.get("ref");
    if (!raw || !isValidReferralCode(raw)) return;
    const { code, visitorId } = rememberReferralCode(raw);
    if (!code) return;
    void affiliateApi.track({ code, visitorId }).catch(() => undefined);
  }, [searchParams]);

  return null;
}
