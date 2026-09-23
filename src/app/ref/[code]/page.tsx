"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { affiliateApi } from "@/lib/api";
import {
  isValidReferralCode,
  rememberReferralCode,
} from "@/lib/affiliate-cookies";

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code || "");

  useEffect(() => {
    if (!isValidReferralCode(code)) {
      router.replace("/pricing");
      return;
    }
    const stored = rememberReferralCode(code);
    if (stored.code) {
      void affiliateApi.track({
        code: stored.code,
        visitorId: stored.visitorId,
      }).catch(() => undefined);
    }
    router.replace("/pricing");
  }, [code, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
    </div>
  );
}
