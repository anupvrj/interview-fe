"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FeatureUnavailable } from "@/components/features/FeatureUnavailable";
import { usePlatformFeatures } from "@/hooks/usePlatformFeatures";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import {
  isFeatureAccessibleForActiveRole,
} from "@/lib/platform-features";

export function FeatureRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { matchPath, isLoading } = usePlatformFeatures();
  const roleCtx = useActiveRole();
  const accessRole = roleCtx?.profile?.accessRole ?? null;
  const activeRole = roleCtx?.activeRole ?? null;

  if (isLoading) return children;
  const viewingAsSuperAdmin =
    !activeRole || activeRole === "super_admin";
  if (isPlatformAdmin(accessRole) && viewingAsSuperAdmin) return children;

  const feature = matchPath(pathname);
  if (!feature) return children;

  const allowed = viewingAsSuperAdmin
    ? feature.accessible
    : isFeatureAccessibleForActiveRole(
        feature.status,
        feature.category,
        activeRole,
      );
  if (allowed) return children;

  const backHref = pathname?.startsWith("/dashboard") ? "/dashboard" : "/";
  const backLabel = pathname?.startsWith("/dashboard")
    ? "Back to dashboard"
    : "Back to home";

  return (
    <FeatureUnavailable
      title={feature.unavailableTitle}
      message={feature.unavailableMessage}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
