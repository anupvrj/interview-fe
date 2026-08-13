"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X, Lock, Bell, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { interviewApi, type AccessRole } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/app/ProfileMenu";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { RoleSwitcher } from "@/components/roles/RoleSwitcher";
import { isPathAllowedForRole, roleHome, type ActiveRole } from "@/lib/roles";
import {
  appNavIconWrap,
  appNavItemActive,
  appNavItemInactive,
  appSidebar,
  appTopBar,
} from "@/lib/app-theme";
import {
  filterNavByActiveRole,
  getDashboardNavItems,
  withPeerNavItems,
  withRecruiterNavItems,
  type DashboardNavItem,
} from "@/lib/dashboard-nav";
import { SubscriptionExpiredBanner } from "@/components/SubscriptionExpiredBanner";
import { SubscriptionPendingBanner } from "@/components/SubscriptionPendingBanner";
import { TrialUpsellDialog, type TrialUpsellVariant } from "@/components/upsell/TrialUpsellDialog";
import { useUpsellState } from "@/components/upsell/useUpsellState";
import { useEntitlements } from "@/hooks/useEntitlements";
import { POST_ONBOARDING_TRIAL_OFFER_KEY } from "@/lib/trialFeatures";

interface DashboardLayoutProps {
  children: ReactNode;
}

function isPublicPeerInterviewerProfilePath(pathname: string): boolean {
  const hub = "/dashboard/peer-interviews/interviewer";
  if (!pathname.startsWith(`${hub}/`)) return false;
  const segment = pathname.slice(`${hub}/`.length).split("/")[0];
  return /^[a-f0-9]{24}$/i.test(segment);
}

function isInterviewerBookingsNavPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/dashboard/peer-interviews/interviewer/bookings" ||
    pathname.startsWith("/dashboard/peer-interviews/interviewer/bookings/")
  );
}

function isInterviewerHubNavPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/dashboard/peer-interviews/interviewer/apply") return false;
  if (pathname === "/dashboard/peer-interviews/interviewer/earnings")
    return false;
  if (pathname.startsWith("/dashboard/peer-interviews/interviewer/earnings/")) {
    return false;
  }
  if (isInterviewerBookingsNavPath(pathname)) return false;
  if (pathname === "/dashboard/peer-interviews/interviewer") return true;
  return pathname.startsWith("/dashboard/peer-interviews/interviewer/slots");
}

function isPeerInterviewsNavPath(pathname: string | null): boolean {
  if (!pathname?.startsWith("/dashboard/peer-interviews")) return false;
  if (pathname === "/dashboard/peer-interviews/interviewer/apply") return false;
  if (pathname === "/dashboard/peer-interviews/interviewer/earnings")
    return false;
  if (pathname.startsWith("/dashboard/peer-interviews/interviewer/earnings/")) {
    return false;
  }
  if (isInterviewerBookingsNavPath(pathname)) return false;
  if (isInterviewerHubNavPath(pathname)) return false;
  if (
    pathname.startsWith("/dashboard/peer-interviews/interviewer/") &&
    !isPublicPeerInterviewerProfilePath(pathname)
  ) {
    return false;
  }
  return true;
}

function isSuperAdminPeerInterviewersPath(pathname: string | null): boolean {
  return (
    pathname?.startsWith("/dashboard/super-admin/peer-interviewers") ?? false
  );
}

function isSuperAdminPeerBookingsPath(pathname: string | null): boolean {
  return pathname?.startsWith("/dashboard/super-admin/peer-bookings") ?? false;
}

function isSuperAdminIxRecruitersPath(pathname: string | null): boolean {
  return pathname?.startsWith("/dashboard/super-admin/ix-recruiters") ?? false;
}

function isRecruiterDashboardNavPath(pathname: string | null): boolean {
  return pathname === "/dashboard/ix-recruiter";
}

function isHireTalentNavPath(pathname: string | null): boolean {
  return pathname?.startsWith("/dashboard/ix-recruiter/candidates") ?? false;
}

function isShortlistedTalentsNavPath(pathname: string | null): boolean {
  return pathname?.startsWith("/dashboard/ix-recruiter/shortlisted") ?? false;
}

function isRecruiterApplyNavPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/dashboard/ix-recruiter/apply" ||
    pathname.startsWith("/dashboard/ix-recruiter/apply/")
  );
}

function isSuperAdminSystemDesignProblemsPath(pathname: string | null): boolean {
  return (
    pathname?.startsWith("/dashboard/super-admin/system-design-problems") ??
    false
  );
}

function isSuperAdminNotificationHubPath(pathname: string | null): boolean {
  return (
    pathname?.startsWith("/dashboard/super-admin/notification-hub") ?? false
  );
}

function isSuperAdminHomePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (
    isSuperAdminPeerInterviewersPath(pathname) ||
    isSuperAdminPeerBookingsPath(pathname) ||
    isSuperAdminIxRecruitersPath(pathname) ||
    isSuperAdminSystemDesignProblemsPath(pathname) ||
    isSuperAdminNotificationHubPath(pathname)
  ) {
    return false;
  }
  return (
    pathname === "/dashboard/super-admin" ||
    pathname.startsWith("/dashboard/super-admin/")
  );
}

function resolveNavActive(
  item: DashboardNavItem,
  pathname: string | null,
  institutionBase: string | null,
  isDashboardInterviewsDetailPath: boolean,
  interviewsSubpathKind: "general" | "coding_practice" | null,
  activeRole: ActiveRole | null,
): boolean {
  const baseActive =
    pathname === item.href ||
    (institutionBase && item.href === institutionBase
      ? false
      : item.href !== "/dashboard" &&
        (pathname?.startsWith(`${item.href}/`) ?? false));

  const codingRoundSidebar =
    isDashboardInterviewsDetailPath &&
    interviewsSubpathKind === "coding_practice";

  let isActive = baseActive;
  if (item.href === "/dashboard/interviews") {
    if (codingRoundSidebar) isActive = false;
    if (isDashboardInterviewsDetailPath && interviewsSubpathKind === null) {
      isActive = false;
    }
  }
  if (item.href === "/dashboard/coding-interviews") {
    if (codingRoundSidebar) isActive = true;
    if (isDashboardInterviewsDetailPath && interviewsSubpathKind === null) {
      isActive = false;
    }
  }
  if (item.href === "/dashboard/peer-interviews") {
    isActive = isPeerInterviewsNavPath(pathname);
  }
  if (item.href === "/dashboard/peer-interviews/interviewer") {
    isActive = isInterviewerHubNavPath(pathname);
  }
  if (item.href === "/dashboard/peer-interviews/interviewer/apply") {
    isActive = pathname === "/dashboard/peer-interviews/interviewer/apply";
  }
  if (item.href === "/dashboard/peer-interviews/interviewer/earnings") {
    isActive =
      pathname === "/dashboard/peer-interviews/interviewer/earnings" ||
      (pathname?.startsWith(
        "/dashboard/peer-interviews/interviewer/earnings/",
      ) ??
        false);
  }
  if (item.href === "/dashboard/peer-interviews/interviewer/bookings") {
    isActive =
      isInterviewerBookingsNavPath(pathname) ||
      (activeRole === "interviewer" &&
        (pathname?.startsWith("/dashboard/peer-interviews/bookings/") ??
          false));
  }
  if (item.href === "/dashboard/super-admin") {
    isActive = isSuperAdminHomePath(pathname);
  }
  if (item.href === "/dashboard/super-admin/peer-interviewers") {
    isActive = isSuperAdminPeerInterviewersPath(pathname);
  }
  if (item.href === "/dashboard/super-admin/peer-bookings") {
    isActive = isSuperAdminPeerBookingsPath(pathname);
  }
  if (item.href === "/dashboard/super-admin/ix-recruiters") {
    isActive = isSuperAdminIxRecruitersPath(pathname);
  }
  if (item.href === "/dashboard/super-admin/system-design-problems") {
    isActive = isSuperAdminSystemDesignProblemsPath(pathname);
  }
  if (item.href === "/dashboard/super-admin/notification-hub") {
    isActive = isSuperAdminNotificationHubPath(pathname);
  }
  if (item.href === "/dashboard/ix-recruiter") {
    isActive = isRecruiterDashboardNavPath(pathname);
  }
  if (item.href === "/dashboard/ix-recruiter/candidates") {
    isActive = isHireTalentNavPath(pathname);
  }
  if (item.href === "/dashboard/ix-recruiter/shortlisted") {
    isActive = isShortlistedTalentsNavPath(pathname);
  }
  if (item.href === "/dashboard/ix-recruiter/apply") {
    isActive = isRecruiterApplyNavPath(pathname);
  }
  return isActive;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const roleCtx = useActiveRole();
  const profile = roleCtx?.profile ?? null;
  const accessRole: AccessRole | null = profile?.accessRole ?? null;
  const institutionId = profile?.institutionId
    ? String(profile.institutionId)
    : null;
  const peerNav = profile?.peer ?? null;
  const recruiterNav = profile?.recruiter ?? null;
  const activeRole = roleCtx?.activeRole ?? null;
  const availableRoles = roleCtx?.availableRoles ?? [];
  const roleReady = roleCtx?.ready ?? false;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [interviewsSubpathKind, setInterviewsSubpathKind] = useState<
    "general" | "coding_practice" | null
  >(null);
  const [trialPromoOpen, setTrialPromoOpen] = useState(false);
  const [trialPromoVariant, setTrialPromoVariant] =
    useState<TrialUpsellVariant>("dashboard_promo");
  const [skipDelayedTrialPromo, setSkipDelayedTrialPromo] = useState(false);
  const { canUse, refresh: refreshEntitlements } = useEntitlements();
  const {
    shouldShowTrialPromo,
    markTrialPromoShown,
    dismissTrialPromo,
    refresh: refreshUpsell,
    data: upsellData,
  } = useUpsellState();

  const interviewsDetailMatch =
    /^\/dashboard\/interviews\/([^/]+)(?:\/|$)/.exec(pathname ?? "") ??
    undefined;
  const interviewsPathSegment = interviewsDetailMatch?.[1];
  const isDashboardInterviewsDetailPath = Boolean(
    interviewsPathSegment &&
    interviewsPathSegment !== "new" &&
    pathname !== "/dashboard/interviews",
  );

  useEffect(() => {
    if (!isDashboardInterviewsDetailPath || !interviewsPathSegment || !user) {
      setInterviewsSubpathKind(null);
      return;
    }
    let cancelled = false;
    interviewApi
      .getInterview(interviewsPathSegment)
      .then((inv) => {
        if (cancelled) return;
        setInterviewsSubpathKind(
          inv.metadata?.interviewKind === "coding_practice"
            ? "coding_practice"
            : "general",
        );
      })
      .catch(() => {
        if (!cancelled) setInterviewsSubpathKind(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isDashboardInterviewsDetailPath, interviewsPathSegment, user]);

  useEffect(() => {
    if (!roleReady || !upsellData?.showTrialUpsell) return;
    if (typeof window === "undefined") return;

    const postOnboarding =
      sessionStorage.getItem(POST_ONBOARDING_TRIAL_OFFER_KEY) === "1";
    const queryOffer =
      new URLSearchParams(window.location.search).get("trial_offer") === "1";

    if (!postOnboarding && !queryOffer) return;

    sessionStorage.removeItem(POST_ONBOARDING_TRIAL_OFFER_KEY);
    if (queryOffer && pathname) {
      router.replace(pathname);
    }

    setTrialPromoVariant("onboarding_complete");
    setTrialPromoOpen(true);
    setSkipDelayedTrialPromo(true);
    markTrialPromoShown();
  }, [
    roleReady,
    upsellData?.showTrialUpsell,
    pathname,
    router,
    markTrialPromoShown,
  ]);

  useEffect(() => {
    if (!roleReady || skipDelayedTrialPromo) return;
    if (!shouldShowTrialPromo()) return;

    const timer = window.setTimeout(() => {
      if (shouldShowTrialPromo()) {
        markTrialPromoShown();
        setTrialPromoVariant("dashboard_promo");
        setTrialPromoOpen(true);
      }
    }, 30_000);

    return () => window.clearTimeout(timer);
  }, [
    roleReady,
    skipDelayedTrialPromo,
    shouldShowTrialPromo,
    markTrialPromoShown,
  ]);

  const isInstitutionView = activeRole === "institution_admin";

  // Send multi-role users without a chosen role to the role chooser.
  useEffect(() => {
    if (!roleReady) return;
    if (!activeRole && availableRoles.length > 1) {
      router.replace("/select-role");
    }
  }, [roleReady, activeRole, availableRoles.length, router]);

  // Keep navigation within the active role's allowed area.
  useEffect(() => {
    if (!roleReady || !activeRole || !pathname) return;
    if (!pathname.startsWith("/dashboard")) return;
    if (!isPathAllowedForRole(activeRole, pathname, profile)) {
      router.replace(roleHome(activeRole, profile));
    }
  }, [roleReady, activeRole, pathname, profile, router]);

  const menuItems = useMemo(() => {
    const items = filterNavByActiveRole(
      withRecruiterNavItems(
        withPeerNavItems(
          getDashboardNavItems(accessRole, institutionId),
          peerNav,
        ),
        recruiterNav,
      ),
      activeRole,
      profile,
    );

    return items.map((item) => {
      if (item.href === "/dashboard/coding-interviews") {
        return { ...item, locked: !canUse("codingRound") };
      }
      if (item.href === "/dashboard/system-design") {
        return { ...item, locked: !canUse("systemDesign") };
      }
      if (item.href === "/dashboard/ix-report") {
        return { ...item, locked: !canUse("ixScore") };
      }
      return item;
    });
  }, [
    accessRole,
    institutionId,
    peerNav,
    recruiterNav,
    activeRole,
    profile,
    canUse,
  ]);

  const institutionBase =
    isInstitutionView && institutionId
      ? `/dashboard/institute/${institutionId}`
      : null;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const renderNavItem = (item: DashboardNavItem) => {
    const Icon = item.icon;
    const showNavLabels = sidebarOpen || mobileMenuOpen;
    const isActive = resolveNavActive(
      item,
      pathname,
      institutionBase,
      isDashboardInterviewsDetailPath,
      interviewsSubpathKind,
      activeRole,
    );

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        title={!showNavLabels ? item.title : undefined}
        className={cn(
          "group relative flex items-center gap-2 rounded-[0.625rem] px-2.5 py-2 text-sm font-medium leading-tight transition-all duration-200 lg:py-1.5",
          showNavLabels ? "justify-start" : "justify-center px-2",
          isActive ? appNavItemActive : appNavItemInactive,
        )}
      >
        <span
          className={cn(
            appNavIconWrap,
            "h-8 w-8",
            isActive
              ? item.accent.activeIconBg
              : cn(item.accent.iconBg, item.accent.iconText),
          )}
        >
          <Icon
            className={cn("h-4 w-4", isActive && "text-white")}
            strokeWidth={2}
          />
        </span>
        {showNavLabels ? (
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="truncate">{item.title}</span>
            {item.locked ? (
              <Lock
                className={cn(
                  "h-3.5 w-3.5 shrink-0 opacity-70",
                  isActive ? "text-white/90" : "text-muted-foreground",
                )}
                strokeWidth={2.25}
                aria-hidden
              />
            ) : null}
          </span>
        ) : item.locked ? (
          <Lock
            className={cn(
              "pointer-events-none absolute bottom-1 right-1 h-3 w-3",
              isActive ? "text-white" : "text-muted-foreground",
            )}
            strokeWidth={2.5}
            aria-hidden
          />
        ) : null}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-header shadow-header lg:hidden">
        <div className="grid h-14 grid-cols-3 items-center px-3 sm:h-16">
          <div className="justify-self-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 shrink-0"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
          <Link
            href="/"
            className="justify-self-center transition-opacity hover:opacity-80"
          >
            <InterviewTrixLogo
              variant="onLightBg"
              className="h-7 w-auto dark:hidden"
            />
            <InterviewTrixLogo
              variant="white"
              className="hidden h-7 w-auto dark:block"
            />
          </Link>
          <div className="flex items-center gap-1.5 justify-self-end">
            <ProfileMenu placement="bottom-end" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — full-height drawer on mobile, fixed rail on desktop */}
        <aside
          className={cn(
            appSidebar,
            "z-40 shrink-0 overflow-hidden",
            // Mobile drawer only
            "max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:h-dvh max-lg:w-[260px]",
            "max-lg:transition-transform max-lg:duration-300 max-lg:ease-in-out",
            mobileMenuOpen
              ? "max-lg:translate-x-0"
              : "max-lg:-translate-x-full",
            // Desktop — fixed to viewport; main content offset separately
            "lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0 lg:transition-[width] lg:duration-300",
            sidebarOpen ? "lg:w-[260px]" : "lg:w-[78px]",
          )}
        >
          <div className="flex h-full max-lg:h-full lg:h-screen flex-col">
            <div className="hidden shrink-0 border-b border-sidebar-border/80 px-4 py-5 lg:block">
              <Link
                href="/"
                className={cn(
                  "flex items-center transition-opacity hover:opacity-80",
                  sidebarOpen ? "justify-start" : "justify-center",
                )}
              >
                <InterviewTrixLogo
                  className={cn(
                    "w-auto object-contain object-left dark:hidden",
                    sidebarOpen ? "h-8 max-w-[11rem]" : "h-7 max-w-[2.75rem]",
                  )}
                />
                <InterviewTrixLogo
                  variant="white"
                  className={cn(
                    "hidden w-auto object-contain object-left dark:block",
                    sidebarOpen ? "h-8 max-w-[11rem]" : "h-7 max-w-[2.75rem]",
                  )}
                />
              </Link>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain px-2.5 py-3 max-lg:pt-16">
              {menuItems.map((item) => renderNavItem(item))}
            </nav>

            <div className="hidden shrink-0 border-t border-sidebar-border/80 p-4 lg:block">
              <div
                className={cn(
                  "flex items-center gap-3",
                  sidebarOpen ? "px-1" : "justify-center",
                )}
              >
                <ProfileMenu placement="top-start" />
                {sidebarOpen && user ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        {mobileMenuOpen ? (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}

        {/* Main */}
        <main
          className={cn(
            "min-w-0 flex-1 overflow-x-hidden bg-background",
            "lg:transition-[margin-left] lg:duration-300",
            sidebarOpen ? "lg:ml-[260px]" : "lg:ml-[78px]",
          )}
        >
          <div className="hidden px-6 pt-6 lg:block">
            <header
              className={cn(
                appTopBar,
                "flex items-center justify-between gap-4",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <RoleSwitcher />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
                  aria-label="Apps"
                >
                  <LayoutGrid className="h-[1.125rem] w-[1.125rem]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground hover:text-foreground"
                  aria-label="Notifications"
                >
                  <Bell className="h-[1.125rem] w-[1.125rem]" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ea5455] ring-2 ring-header" />
                </Button>
                <ProfileMenu placement="bottom-end" />
              </div>
            </header>
          </div>

          <div className="p-4 sm:p-5 lg:px-6 lg:pb-8 lg:pt-5">
            <SubscriptionPendingBanner />
            <SubscriptionExpiredBanner />
            {children}
          </div>
        </main>
      </div>

      <TrialUpsellDialog
        open={trialPromoOpen}
        onOpenChange={setTrialPromoOpen}
        variant={trialPromoVariant}
        onDismiss={dismissTrialPromo}
        onTrialStarted={() => {
          void refreshEntitlements();
          void refreshUpsell();
        }}
        hasPurchasedTrial={upsellData ? !upsellData.canPurchaseTrial : false}
      />
    </div>
  );
}
