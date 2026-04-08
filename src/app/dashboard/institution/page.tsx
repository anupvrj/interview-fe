"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { userApi } from "@/lib/api";

/** @deprecated Use `/dashboard/institute` — this route redirects for bookmarks and old links. */
export default function LegacyInstitutionAdminRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      try {
        const p = await userApi.getMyProfile();
        if (p.accessRole === "institution_admin" && p.institutionId) {
          router.replace(`/dashboard/institute/${p.institutionId}`);
          return;
        }
        if (p.accessRole === "super_admin") {
          router.replace("/dashboard/institute");
          return;
        }
        router.replace("/dashboard");
      } catch {
        router.replace("/dashboard");
      }
    })();
  }, [isLoaded, user, router]);

  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
