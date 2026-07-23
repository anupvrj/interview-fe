"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import {
  PublicDesktopNav,
  PublicMobileNav,
} from "@/components/NavigationMenu";
import { ProfileMenu } from "@/components/app/ProfileMenu";
import { Button } from "@/components/ui/button";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { cn } from "@/lib/utils";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";

export type SiteHeaderProps = {
  mobileNav?: ReactNode;
  desktopNav?: ReactNode;
};

function ProfileControl({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      <SignedOut>
        <Button
          variant="outline"
          size="sm"
          asChild
          className={cn(
            instituteSecondaryClass,
            "hidden h-9 px-3 text-xs lg:inline-flex lg:text-sm",
          )}
        >
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button
          size="sm"
          asChild
          className={cn(
            institutePrimaryClass,
            "h-8 shrink-0 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-xs",
          )}
        >
          <Link href="/sign-up">
            <span className="hidden sm:inline">Start New Interview</span>
            <span className="sm:hidden">Get started</span>
          </Link>
        </Button>
      </SignedOut>
      <SignedIn>
        <ProfileMenu />
      </SignedIn>
    </div>
  );
}

export function SiteHeader({
  mobileNav = <PublicMobileNav />,
  desktopNav = <PublicDesktopNav />,
}: SiteHeaderProps) {
  const { user, isLoaded } = useUser();
  const isMobileViewport = useIsMobileViewport();
  const logoHref =
    isLoaded && user && isMobileViewport ? "/dashboard" : "/";

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/60 bg-header/95 shadow-header backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: hamburger left · logo center · profile right */}
        <div className="relative flex h-14 items-center justify-between gap-2 sm:h-16 lg:hidden">
          <div className="relative z-10 shrink-0">{mobileNav}</div>
          <Link
            href={logoHref}
            className="absolute left-1/2 top-1/2 z-0 max-w-[calc(100%-9.5rem)] -translate-x-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
          >
            <InterviewTrixLogo
              variant="onLightBg"
              className="h-6 w-auto max-w-full sm:h-7"
              priority
            />
          </Link>
          <div className="relative z-10 shrink-0">
            <ProfileControl />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden h-[4.25rem] items-center gap-6 lg:flex">
          <Link
            href="/"
            className="flex shrink-0 items-center transition-opacity hover:opacity-80"
          >
            <InterviewTrixLogo className="h-8 w-auto xl:h-9" priority />
          </Link>
          <div className="flex flex-1 justify-center">{desktopNav}</div>
          <ProfileControl />
        </div>
      </div>
    </header>
  );
}
