"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/app/ProfileMenu";
import { RoleSwitcher } from "@/components/roles/RoleSwitcher";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { roleHome } from "@/lib/roles";
import {
  SUPER_ADMIN_NAV_GROUPS,
  isSuperAdminNavItemActive,
} from "@/lib/super-admin-nav";
import { SuperAdminTopBreadcrumb } from "@/components/super-admin/SuperAdminTopBreadcrumb";
import {
  appNavIconWrap,
  appNavItemActive,
  appNavItemInactive,
  appSidebar,
  appTopBar,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";

export function SuperAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const roleCtx = useActiveRole();
  const profile = roleCtx?.profile ?? null;
  const roleReady = roleCtx?.ready ?? false;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!roleReady || !profile) return;
    if (!isPlatformAdmin(profile.accessRole ?? null)) {
      router.replace(roleHome(roleCtx?.activeRole ?? "candidate", profile));
    }
  }, [roleReady, profile, roleCtx, router]);

  if (!isLoaded || !roleReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!isPlatformAdmin(profile?.accessRole ?? null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const showNavLabels = sidebarOpen || mobileMenuOpen;

  const renderGroups = () =>
    SUPER_ADMIN_NAV_GROUPS.map((group) => (
      <div key={group.label} className="space-y-0.5">
        {showNavLabels ? (
          <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
        ) : (
          <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" />
        )}
        {group.items.map((item) => {
          const Icon = item.icon;
          const isActive = isSuperAdminNavItemActive(item.href, pathname);
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
                <span className="truncate">{item.title}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    ));

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            href="/super-admin"
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
        <div className="border-t border-border/60 px-3 py-2">
          <SuperAdminTopBreadcrumb />
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            appSidebar,
            "z-40 shrink-0 overflow-hidden",
            "max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:h-dvh max-lg:w-[260px]",
            "max-lg:transition-transform max-lg:duration-300 max-lg:ease-in-out",
            mobileMenuOpen
              ? "max-lg:translate-x-0"
              : "max-lg:-translate-x-full",
            "lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0 lg:transition-[width] lg:duration-300",
            sidebarOpen ? "lg:w-[260px]" : "lg:w-[78px]",
          )}
        >
          <div className="flex h-full flex-col lg:h-screen">
            <div className="hidden shrink-0 border-b border-sidebar-border/80 px-4 py-5 lg:block">
              <Link
                href="/super-admin"
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
              {sidebarOpen ? (
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Super Admin
                </p>
              ) : null}
            </div>

            <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-2.5 py-3 max-lg:pt-24">
              {renderGroups()}
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
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <SuperAdminTopBreadcrumb />
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <RoleSwitcher />
                <ThemeToggle />
                <ProfileMenu placement="bottom-end" />
              </div>
            </header>
          </div>
          <div className="p-4 sm:p-5 lg:px-6 lg:pb-8 lg:pt-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
