"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FeatureUnavailable } from "@/components/features/FeatureUnavailable";
import { usePlatformFeatures } from "@/hooks/usePlatformFeatures";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { isFeatureAccessibleForActiveRole } from "@/lib/platform-features";
import { isInstitutionProductEnabled } from "@/lib/institution-flags";

export function FeatureRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { matchPath, isLoading } = usePlatformFeatures();
  const { canUsePlatformFeature, loading: entitlementsLoading } =
    useEntitlements();
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
  const planLocked =
    allowed &&
    feature.builtIn === false &&
    Boolean(pathname?.startsWith("/dashboard")) &&
    !entitlementsLoading &&
    !canUsePlatformFeature(feature.key);
  const instituteLocked =
    allowed &&
    !planLocked &&
    Boolean(roleCtx?.profile?.institutionId) &&
    roleCtx?.profile?.accessRole === "user" &&
    !isInstitutionProductEnabled(
      roleCtx?.profile?.institutionFlags?.products,
      feature.key,
    );
  if (allowed && !planLocked && !instituteLocked) return children;

  const backHref = pathname?.startsWith("/dashboard") ? "/dashboard" : "/";
  const backLabel = pathname?.startsWith("/dashboard")
    ? "Back to dashboard"
    : "Back to home";

  return (
    <FeatureUnavailable
      title={
        planLocked
          ? `${feature.name} is not in your plan`
          : instituteLocked
            ? `${feature.name} is not enabled for your institute`
            : feature.unavailableTitle
      }
      message={
        planLocked
          ? `Upgrade your plan to use ${feature.name}.`
          : instituteLocked
            ? `Your institute has not enabled ${feature.name}.`
            : feature.unavailableMessage
      }
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
