"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { FlaskConical } from "lucide-react";
import { userApi, type MyAccessState } from "@/lib/api";

/**
 * Sends blocked users to /account-blocked right after sign-in (the API interceptor
 * covers later requests) and tells institute candidates when their institute is
 * still in demo mode.
 */
export function AccountAccessGate() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [access, setAccess] = useState<MyAccessState | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    userApi
      .getMyAccess()
      .then((a) => {
        if (cancelled) return;
        setAccess(a);
        if (!a.allowed) {
          router.replace(`/account-blocked${a.code ? `?code=${encodeURIComponent(a.code)}` : ""}`);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, router]);

  if (!access?.allowed || !access.institutionManaged) return null;
  if (!access.warnings.includes("INSTITUTION_DEMO_MODE")) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#00BAD1]/30 bg-[#00BAD1]/10 px-4 py-3">
      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-[#00BAD1]" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {access.institution?.name ?? "Your institute"} is still being set up
        </p>
        <p className="text-sm text-muted-foreground">
          You can explore and build your resume now. Interviews unlock once your institute goes live.
        </p>
      </div>
    </div>
  );
}
