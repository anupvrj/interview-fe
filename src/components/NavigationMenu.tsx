"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:text-[13px] xl:text-[0.9375rem]";

export const mockInterviewNavItems = [
  {
    href: "/ai-interview-coach",
    label: "AI Mock Interview",
    description: "Free voice mock interviews with AI feedback",
  },
  {
    href: "/ai-coding-practice",
    label: "Practice Coding Round",
    description: "Solve problems and defend your approach",
  },
  {
    href: "/ai-system-design",
    label: "Practice System Design",
    description: "Whiteboard architecture with AI coaching",
  },
  {
    href: "/dashboard/peer-interviews/book",
    label: "Peer Interview with Experts",
    description: "Book live mock interviews with verified experts",
  },
] as const;

/** @deprecated Use mockInterviewNavItems */
export const practiceNavItems = mockInterviewNavItems;

export const resumeNavItems = [
  {
    href: "/ai-resume-builder",
    label: "Resume Builder",
    description: "Build ATS-optimized resumes with AI",
  },
  {
    href: "/ats-checker",
    label: "ATS Checker",
    description: "Score and fix your resume for ATS",
  },
] as const;

export const navLinksHome = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
] as const;

export const navLinkDashboard = {
  href: "/dashboard",
  label: "Dashboard",
  match: (path: string) => path.startsWith("/dashboard"),
} as const;

export const navLinkBecomeInterviewer = {
  href: "/become-peer-interviewer",
  label: "Become Interviewer",
  match: (path: string) => path.startsWith("/become-peer-interviewer"),
} as const;

export const navLinkHireTalent = {
  href: "/hire-ix-talent",
  label: "Hire iX Talent",
  match: (path: string) => path.startsWith("/hire-ix-talent"),
} as const;

export const navLinkPricing = {
  href: "/pricing",
  label: "Pricing",
  match: (path: string) => path.startsWith("/pricing"),
} as const;

/** @deprecated Use navLinksHome */
export const navLinksBeforePractice = navLinksHome;

/** @deprecated Use navLinkBecomeInterviewer + navLinkHireTalent */
export const navLinksBeforeResume = [
  navLinkHireTalent,
  navLinkBecomeInterviewer,
] as const;

/** @deprecated Use navLinkPricing */
export const navLinksAfterResume = [navLinkPricing] as const;

/** @deprecated Use navLinksHome + navLinkBecomeInterviewer + navLinkHireTalent + navLinkPricing */
export const navLinksAfterPractice = [
  navLinkBecomeInterviewer,
  navLinkHireTalent,
  navLinkPricing,
] as const;

/** @deprecated Use navLinksHome + navLinkBecomeInterviewer + navLinkHireTalent + navLinkPricing */
export const primaryNavLinks = [
  ...navLinksHome,
  navLinkHireTalent,
  navLinkBecomeInterviewer,
  navLinkPricing,
] as const;

function isMockInterviewActive(pathname: string) {
  if (pathname.startsWith("/dashboard/peer-interviews")) {
    return true;
  }

  return mockInterviewNavItems.some((item) => {
    if (item.href.startsWith("/dashboard/")) {
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
}

function isResumeActive(pathname: string) {
  return resumeNavItems.some(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

function linkClass(active: boolean) {
  return cn(navLinkClass, active && "text-foreground");
}

function MockInterviewsDropdown({
  open,
  onOpenChange,
  pathname,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}) {
  const active = isMockInterviewActive(pathname);

  return (
    <div
      className="relative"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5",
          linkClass(active),
        )}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => onOpenChange(!open)}
      >
        Mock Interviews
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3">
          <div className="rounded-xl border border-border/60 bg-card p-2 shadow-header">
            {mockInterviewNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className="block text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {item.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResumeDropdown({
  open,
  onOpenChange,
  pathname,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}) {
  const active = isResumeActive(pathname);

  return (
    <div
      className="relative"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5",
          linkClass(active),
        )}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => onOpenChange(!open)}
      >
        Resume
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3">
          <div className="rounded-xl border border-border/60 bg-card p-2 shadow-header">
            {resumeNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className="block text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {item.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
  onClick,
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        className ?? linkClass(active),
        !className && active && "text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function PublicDesktopNav() {
  const pathname = usePathname();
  const [mockInterviewsOpen, setMockInterviewsOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);

  useEffect(() => {
    setMockInterviewsOpen(false);
    setResumeOpen(false);
  }, [pathname]);

  return (
    <nav
      className="hidden items-center gap-6 lg:flex xl:gap-8"
      aria-label="Main navigation"
    >
      {navLinksHome.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          active={item.match(pathname)}
        />
      ))}

      <ResumeDropdown
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        pathname={pathname}
      />

      <MockInterviewsDropdown
        open={mockInterviewsOpen}
        onOpenChange={setMockInterviewsOpen}
        pathname={pathname}
      />

      <NavLink
        href={navLinkBecomeInterviewer.href}
        label={navLinkBecomeInterviewer.label}
        active={navLinkBecomeInterviewer.match(pathname)}
      />

      <NavLink
        href={navLinkHireTalent.href}
        label={navLinkHireTalent.label}
        active={navLinkHireTalent.match(pathname)}
      />

      <NavLink
        href={navLinkPricing.href}
        label={navLinkPricing.label}
        active={navLinkPricing.match(pathname)}
      />
    </nav>
  );
}

/** Portaled above SiteHeader (`z-50`) — must be literal Tailwind classes for JIT. */
export function PublicMobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mockInterviewsOpen, setMockInterviewsOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigateFromMobileDrawer =
    (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      router.push(href);
      setTimeout(() => {
        setMobileMenuOpen(false);
        setMockInterviewsOpen(false);
        setResumeOpen(false);
      }, 0);
    };

  const mobileMenuBorderClass = "border-primary-foreground/20";
  const mobileMenuSubBorderClass = "border-primary-foreground/15";

  const mobileLinkClass = (active: boolean) =>
    cn(
      "flex items-center border-b px-4 py-3.5 text-sm font-medium transition-colors hover:bg-primary-foreground/10",
      mobileMenuBorderClass,
      active ? "text-primary-foreground" : "text-primary-foreground/90",
    );

  const mobileSubmenuToggleClass = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between border-b px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-primary-foreground/10",
      mobileMenuBorderClass,
      active ? "text-primary-foreground" : "text-primary-foreground/90",
    );

  const mobileSubmenuPanelClass = cn(
    "border-b bg-primary-foreground/10",
    mobileMenuBorderClass,
  );

  const mobileSubmenuLinkClass =
    "block border-b px-6 py-3 last:border-b-0 transition-colors hover:bg-primary-foreground/10";

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const menu = document.getElementById("mobile-menu");
      const menuButton = document.getElementById("mobile-menu-button");
      if (
        menu &&
        !menu.contains(target) &&
        menuButton &&
        !menuButton.contains(target)
      ) {
        setMobileMenuOpen(false);
        setMockInterviewsOpen(false);
        setResumeOpen(false);
      }
    };

    const timeoutId = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMockInterviewsOpen(false);
    setResumeOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMockInterviewsOpen(false);
    setResumeOpen(false);
  };

  const mobileMenuPortal =
    mounted &&
    createPortal(
      <>
        {mobileMenuOpen ? (
          <div
            className="fixed inset-0 z-[100] bg-black/30 lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden
          />
        ) : null}

        <nav
          id="mobile-menu"
          className={cn(
            "fixed left-0 top-0 z-[110] flex h-dvh w-80 max-w-[85vw] flex-col bg-primary text-primary-foreground shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label="Mobile navigation"
          aria-hidden={!mobileMenuOpen}
        >
        <div
          className={cn(
            "flex items-center justify-between border-b px-4 py-4",
            mobileMenuBorderClass,
          )}
        >
          <span className="text-sm font-semibold text-primary-foreground">Menu</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {navLinksHome.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={navigateFromMobileDrawer(item.href)}
              className={mobileLinkClass(item.match(pathname))}
            >
              {item.label}
            </Link>
          ))}

          {isLoaded && user ? (
            <Link
              href={navLinkDashboard.href}
              onClick={navigateFromMobileDrawer(navLinkDashboard.href)}
              className={mobileLinkClass(navLinkDashboard.match(pathname))}
            >
              {navLinkDashboard.label}
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setResumeOpen((open) => !open)}
            className={mobileSubmenuToggleClass(isResumeActive(pathname))}
            aria-expanded={resumeOpen}
          >
            <span>Resume</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                resumeOpen && "rotate-180",
              )}
            />
          </button>

          {resumeOpen ? (
            <div className={mobileSubmenuPanelClass}>
              {resumeNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={navigateFromMobileDrawer(item.href)}
                  className={cn(mobileSubmenuLinkClass, mobileMenuSubBorderClass)}
                >
                  <span className="block text-sm font-medium text-primary-foreground">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-primary-foreground/75">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMockInterviewsOpen((open) => !open)}
            className={mobileSubmenuToggleClass(isMockInterviewActive(pathname))}
            aria-expanded={mockInterviewsOpen}
          >
            <span>Mock Interviews</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                mockInterviewsOpen && "rotate-180",
              )}
            />
          </button>

          {mockInterviewsOpen ? (
            <div className={mobileSubmenuPanelClass}>
              {mockInterviewNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={navigateFromMobileDrawer(item.href)}
                  className={cn(mobileSubmenuLinkClass, mobileMenuSubBorderClass)}
                >
                  <span className="block text-sm font-medium text-primary-foreground">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-primary-foreground/75">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          <Link
            href={navLinkBecomeInterviewer.href}
            onClick={navigateFromMobileDrawer(navLinkBecomeInterviewer.href)}
            className={mobileLinkClass(navLinkBecomeInterviewer.match(pathname))}
          >
            {navLinkBecomeInterviewer.label}
          </Link>

          <Link
            href={navLinkHireTalent.href}
            onClick={navigateFromMobileDrawer(navLinkHireTalent.href)}
            className={mobileLinkClass(navLinkHireTalent.match(pathname))}
          >
            {navLinkHireTalent.label}
          </Link>

          <Link
            href={navLinkPricing.href}
            onClick={navigateFromMobileDrawer(navLinkPricing.href)}
            className={mobileLinkClass(navLinkPricing.match(pathname))}
          >
            {navLinkPricing.label}
          </Link>

          {isLoaded && !user ? (
            <Link
              href="/sign-in"
              onClick={navigateFromMobileDrawer("/sign-in")}
              className={mobileLinkClass(false)}
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </nav>
      </>,
      document.body,
    );

  return (
    <>
      <div id="mobile-menu-button" className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-9 w-9 p-0"
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

      {mobileMenuPortal}
    </>
  );
}

/** @deprecated Use PublicDesktopNav / PublicMobileNav via SiteHeader instead. */
export function NavigationMenu() {
  return (
    <>
      <PublicDesktopNav />
      <PublicMobileNav />
    </>
  );
}
