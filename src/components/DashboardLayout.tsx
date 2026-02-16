"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Sparkles,
  PlayCircle,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Resumes",
    href: "/dashboard/resumes",
    icon: FileEdit,
  },
  {
    title: "Interviews",
    href: "/dashboard/interviews",
    icon: FileText,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Your Plan",
    href: "/dashboard/plan",
    icon: Crown,
  },
  {
    title: "Your Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              href="/"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity min-w-0"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-[10px]">
                  i<span className="text-xs">X</span>
                </span>
              </div>
              <span className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Interview{" "}
                <span className="text-[rgb(37,99,235)]">
                  Tri<span className="text-lg sm:text-xl">X</span>
                </span>
              </span>
            </Link>
          </div>
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
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">
                    i<span className="text-base">X</span>
                  </span>
                </div>
                {sidebarOpen && (
                  <span className="text-xl font-bold text-slate-900">
                    Interview{" "}
                    <span className="text-[rgb(37,99,235)]">
                      Tri<span className="text-2xl">X</span>
                    </span>
                  </span>
                )}
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname?.startsWith(item.href));

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
                    <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200" />
                    {sidebarOpen && (
                      <span className="font-medium transition-colors duration-200">
                        {item.title}
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
                <Link href="/dashboard/interviews/new">
                  <Button
                    size="default"
                    className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Interview
                  </Button>
                </Link>
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
