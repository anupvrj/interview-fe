"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
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
          className={cn(institutePrimaryClass, "h-9 px-3 text-xs sm:text-sm")}
        >
          <Link href="/sign-up">
            <span className="hidden min-[420px]:inline">Start New Interview</span>
            <span className="min-[420px]:hidden">Get started</span>
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
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/60 bg-header/95 shadow-header backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: hamburger left · logo center · profile right */}
        <div className="grid h-14 grid-cols-3 items-center sm:h-16 lg:hidden">
          <div className="justify-self-start">{mobileNav}</div>
          <Link
            href="/"
            className="justify-self-center transition-opacity hover:opacity-80"
          >
            <InterviewTrixLogo variant="onLightBg" className="h-7 w-auto" priority />
          </Link>
          <div className="justify-self-end">
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
