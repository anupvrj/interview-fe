"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { NavigationMenu } from "@/components/NavigationMenu";

export type SiteHeaderProps = {
  /** Mobile hamburger / drawer menu (default: shared `NavigationMenu`) */
  mobileMenu?: ReactNode;
  /** Desktop nav area before auth buttons (default: `NavigationMenu`) */
  desktopNav?: ReactNode;
};

export function SiteHeader({
  mobileMenu = <NavigationMenu />,
  desktopNav = <NavigationMenu />,
}: SiteHeaderProps) {
  return (
    <nav className="fixed top-0 w-full z-50">
      <div
        className="sm:hidden h-1"
        style={{ backgroundColor: "rgb(37 99 235 / var(--tw-bg-opacity, 1))" }}
      />
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-4">
              <div className="sm:hidden">{mobileMenu}</div>

              <Link
                href="/"
                className="flex items-center hover:opacity-80 transition-opacity mx-auto sm:mx-0"
              >
                <InterviewTrixLogo
                  variant="onLightBg"
                  className="h-7 w-auto sm:hidden"
                  priority
                />
                <InterviewTrixLogo
                  className="hidden sm:block h-8 lg:h-10 w-auto"
                  priority
                />
              </Link>

              <div className="flex items-center gap-3 sm:hidden">
                <SignedOut>
                  <Link href="/sign-in" className="p-1">
                    <User className="w-5 h-5 text-slate-900" />
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox:
                          "w-6 h-6 ring-2 ring-blue-100 hover:ring-blue-300 transition-all",
                        userButtonPopoverCard: "shadow-2xl border-2 border-blue-100",
                        userButtonPopoverActionButton:
                          "hover:bg-blue-50 transition-colors text-gray-700 font-medium",
                        userButtonPopoverActionButtonIcon: "text-blue-600",
                      },
                    }}
                    afterSignOutUrl="/"
                    userProfileMode="navigation"
                    userProfileUrl="/dashboard/profile"
                  />
                </SignedIn>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 sm:gap-6">
              {desktopNav}
              <SignedOut>
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-4"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all text-xs sm:text-sm px-4 py-2"
                  >
                    Get Started
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="hidden md:block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-4"
                  >
                    Dashboard
                  </Button>
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 ring-2 ring-blue-100 hover:ring-blue-300 transition-all",
                      userButtonPopoverCard: "shadow-2xl border-2 border-blue-100",
                      userButtonPopoverActionButton:
                        "hover:bg-blue-50 transition-colors text-gray-700 font-medium",
                      userButtonPopoverActionButtonIcon: "text-blue-600",
                    },
                  }}
                  afterSignOutUrl="/"
                  userProfileMode="navigation"
                  userProfileUrl="/dashboard/profile"
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
