"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { usePathname, useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Crown,
  User,
  Menu,
  X,
  PlayCircle,
  FileEdit,
  Shield,
  Building2,
  Users,
  UsersRound,
  CalendarClock,
  Settings,
  Receipt,
  Layers,
  Lock,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { userApi, AccessRole } from "@/lib/api";

interface DashboardLayoutProps {
  children: ReactNode;
}

const baseMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Build Resumes",
    href: "/dashboard/resumes",
    icon: FileEdit,
  },
  {
    title: "Practice Interview",
    href: "/dashboard/interviews",
    icon: FileText,
  },
  {
    title: "Peer interviews",
    href: "/dashboard/peer-interviews",
    icon: UsersRound,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Subscription",
    href: "/dashboard/plan",
    icon: Crown,
  },
  {
    title: "My Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accessRole, setAccessRole] = useState<AccessRole | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      userApi
        .getMyProfile()
        .then((profile) => {
          setAccessRole(profile.accessRole || "user");
          setInstitutionId(
            profile.institutionId ? String(profile.institutionId) : null,
          );
        })
        .catch(() => {
          setAccessRole("user");
          setInstitutionId(null);
        });
    }
  }, [isLoaded, user]);

  const isInstitutionAdmin = accessRole === "institution_admin";

  useEffect(() => {
    if (!isInstitutionAdmin || !institutionId || !pathname) return;
    const base = `/dashboard/institute/${institutionId}`;
    const allowed =
      pathname === base ||
      pathname.startsWith(`${base}/`) ||
      pathname === "/dashboard/profile" ||
      pathname.startsWith("/dashboard/profile/");
    if (!allowed && pathname.startsWith("/dashboard")) {
      router.replace(base);
    }
  }, [isInstitutionAdmin, institutionId, pathname, router]);

  const menuItems = useMemo(() => {
    if (isInstitutionAdmin && institutionId) {
      const base = `/dashboard/institute/${institutionId}`;
      return [
        { title: "Overview", href: base, icon: LayoutDashboard },
        { title: "Candidates", href: `${base}/candidates`, icon: Users },
        { title: "Batches", href: `${base}/batches`, icon: Layers },
        { title: "Schedules", href: `${base}/schedules`, icon: CalendarClock },
        { title: "Analytics", href: `${base}/analytics`, icon: BarChart2 },
        { title: "Institution", href: `${base}/settings`, icon: Settings },
        { title: "Plans & payments", href: `${base}/billing`, icon: Receipt },
        { title: "Your Profile", href: "/dashboard/profile", icon: User },
      ];
    }
    if (isInstitutionAdmin && !institutionId) {
      return [
        {
          title: "Institution",
          href: "/dashboard/institute",
          icon: Building2,
        },
        { title: "Your Profile", href: "/dashboard/profile", icon: User },
      ];
    }
    return [
      ...baseMenuItems,
      ...(accessRole === "super_admin"
        ? [
            {
              title: "Institution Admin",
              href: "/dashboard/institute",
              icon: Building2,
            },
            {
              title: "Super Admin",
              href: "/dashboard/super-admin",
              icon: Shield,
            },
          ]
        : []),
    ];
  }, [accessRole, institutionId, isInstitutionAdmin]);

  const institutionBase =
    isInstitutionAdmin && institutionId
      ? `/dashboard/institute/${institutionId}`
      : null;

  // Don't render until user is loaded to avoid hydration issues
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-blue-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(37,99,235)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/30">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex-shrink-0 h-9 w-9"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <Link
              href={
                isInstitutionAdmin && institutionId
                  ? `/dashboard/institute/${institutionId}`
                  : "/"
              }
              className="flex items-center hover:opacity-80 transition-opacity min-w-0"
            >
              <InterviewTrixLogo
                variant="onLightBg"
                className="h-7 w-auto max-w-[min(100%,11rem)] object-contain object-left"
              />
            </Link>
          </div>
          {!(isInstitutionAdmin && institutionId) && (
            <Link href="/dashboard/interviews/new" className="flex-shrink-0">
              <Button
                size="sm"
                className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white h-9 px-3 gap-1.5 text-xs sm:text-sm shadow-md transition-all"
              >
                <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Start</span>
                <span className="hidden sm:inline">Interview</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r shadow-sm transition-all duration-300 z-40",
            "fixed lg:sticky lg:top-0 lg:h-screen",
            sidebarOpen ? "w-64" : "w-0 lg:w-20",
            "overflow-hidden",
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b hidden lg:block">
              <Link
                href={
                  isInstitutionAdmin && institutionId
                    ? `/dashboard/institute/${institutionId}`
                    : "/"
                }
                className={cn(
                  "flex items-center hover:opacity-80 transition-opacity",
                  sidebarOpen ? "justify-start" : "justify-center",
                )}
              >
                <InterviewTrixLogo
                  className={cn(
                    "w-auto object-contain object-left",
                    sidebarOpen ? "h-8 max-w-[11rem]" : "h-7 max-w-[4rem]",
                  )}
                />
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (institutionBase && item.href === institutionBase
                    ? false
                    : item.href !== "/dashboard" &&
                      (pathname?.startsWith(`${item.href}/`) ?? false));

                const isPeerInterviews =
                  item.href === "/dashboard/peer-interviews";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      "hover:bg-blue-50 hover:scale-105 hover:shadow-md",
                      isActive
                        ? "!bg-[rgb(37,99,235)] !text-white shadow-md hover:!bg-[rgb(17,24,39)] hover:!text-white"
                        : "text-slate-700 hover:text-[rgb(37,99,235)]",
                    )}
                  >
                    <span className="relative flex-shrink-0">
                      <Icon className="w-5 h-5 transition-transform duration-200" />
                      {isPeerInterviews && !sidebarOpen && (
                        <Lock
                          className={cn(
                            "pointer-events-none absolute -bottom-1 -right-1 h-3 w-3 drop-shadow",
                            isActive ? "text-white" : "text-slate-500",
                          )}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      )}
                    </span>
                    {sidebarOpen && (
                      <span className="flex min-w-0 flex-1 items-center gap-2 font-medium transition-colors duration-200">
                        <span className="truncate">{item.title}</span>
                        {isPeerInterviews && (
                          <Lock
                            className={cn(
                              "h-3.5 w-3.5 flex-shrink-0 opacity-70",
                              isActive && "opacity-90",
                            )}
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t hidden lg:block">
              <div className="flex items-center gap-3 px-4 py-2">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "w-10 h-10 ring-2 ring-blue-100 hover:ring-blue-300 transition-all",
                      userButtonPopoverCard:
                        "shadow-2xl border-2 border-blue-100",
                      userButtonPopoverActionButton:
                        "hover:bg-blue-50 transition-colors text-gray-700 font-medium",
                      userButtonPopoverActionButtonIcon: "text-blue-600",
                      userButtonPopoverActionButtonText: "text-gray-700",
                      userButtonPopoverFooter: "border-t border-gray-200",
                    },
                  }}
                  afterSignOutUrl="/"
                  userProfileMode="navigation"
                  userProfileUrl="/dashboard/profile"
                />
                {sidebarOpen && user && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-white border-b shadow-sm sticky top-0 z-30">
            <div className="flex items-center justify-between px-6 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:flex"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.firstName || "User"}!
                </span>
                {!(isInstitutionAdmin && institutionId) && (
                  <Link href="/dashboard/interviews/new">
                    <Button
                      size="default"
                      className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Interview
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-3 sm:p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
