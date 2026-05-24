"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:text-[0.9375rem]";

export const practiceNavItems = [
  {
    href: "/ai-interview-coach",
    label: "Screening Round with AI",
    description: "Voice-led mock interviews with AI feedback",
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
] as const;

export const navLinksBeforePractice = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
] as const;

export const navLinksAfterPractice = [
  {
    href: "/ai-resume-builder",
    label: "Resume Builder",
    match: (path: string) => path.startsWith("/ai-resume-builder"),
  },
  {
    href: "/ats-checker",
    label: "ATS Checker",
    match: (path: string) => path.startsWith("/ats-checker"),
  },
  {
    href: "/pricing",
    label: "Pricing",
    match: (path: string) => path.startsWith("/pricing"),
  },
] as const;

/** @deprecated Use navLinksBeforePractice + navLinksAfterPractice */
export const primaryNavLinks = [
  ...navLinksBeforePractice,
  ...navLinksAfterPractice,
] as const;

function isPracticeActive(pathname: string) {
  return practiceNavItems.some(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

function linkClass(active: boolean) {
  return cn(navLinkClass, active && "text-foreground");
}

export function PublicDesktopNav() {
  const pathname = usePathname();
  const [practiceOpen, setPracticeOpen] = useState(false);

  useEffect(() => {
    setPracticeOpen(false);
  }, [pathname]);

  return (
    <nav
      className="hidden items-center gap-6 lg:flex xl:gap-8"
      aria-label="Main navigation"
    >
      {navLinksBeforePractice.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={linkClass(item.match(pathname))}
        >
          {item.label}
        </Link>
      ))}

      <div
        className="relative"
        onMouseEnter={() => setPracticeOpen(true)}
        onMouseLeave={() => setPracticeOpen(false)}
      >
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5",
            linkClass(isPracticeActive(pathname)),
          )}
          aria-expanded={practiceOpen}
          aria-haspopup="true"
          onClick={() => setPracticeOpen((open) => !open)}
        >
          Practice Interview
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              practiceOpen && "rotate-180",
            )}
          />
        </button>

        {practiceOpen ? (
          <div className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3">
            <div className="rounded-xl border border-border/60 bg-card p-2 shadow-header">
              {practiceNavItems.map((item) => (
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

      {navLinksAfterPractice.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={linkClass(item.match(pathname))}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function PublicMobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const { user, isLoaded } = useUser();

  const navigateFromMobileDrawer =
    (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      router.push(href);
      setTimeout(() => {
        setMobileMenuOpen(false);
        setPracticeOpen(false);
      }, 0);
    };

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
        setPracticeOpen(false);
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
    setPracticeOpen(false);
  }, [pathname]);

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

      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 z-[60] bg-black/30 lg:hidden"
          onClick={() => {
            setMobileMenuOpen(false);
            setPracticeOpen(false);
          }}
          aria-hidden
        />
      ) : null}

      <nav
        id="mobile-menu"
        className={cn(
          "fixed left-0 top-0 z-[70] flex h-screen w-80 max-w-[85vw] flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
        onClick={(e) => e.stopPropagation()}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {navLinksBeforePractice.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={navigateFromMobileDrawer(item.href)}
              className={cn(
                "flex items-center border-b border-border/60 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-muted/40",
                item.match(pathname)
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setPracticeOpen((open) => !open)}
            className={cn(
              "flex w-full items-center justify-between border-b border-border/60 px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-muted/40",
              isPracticeActive(pathname)
                ? "text-foreground"
                : "text-muted-foreground",
            )}
            aria-expanded={practiceOpen}
          >
            <span>Practice Interview</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                practiceOpen && "rotate-180",
              )}
            />
          </button>

          {practiceOpen ? (
            <div className="border-b border-border/60 bg-muted/20">
              {practiceNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={navigateFromMobileDrawer(item.href)}
                  className="block border-b border-border/40 px-6 py-3 last:border-b-0 hover:bg-muted/40"
                >
                  <span className="block text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          {navLinksAfterPractice.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={navigateFromMobileDrawer(item.href)}
              className={cn(
                "flex items-center border-b border-border/60 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-muted/40",
                item.match(pathname)
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}

          {isLoaded && !user ? (
            <Link
              href="/sign-in"
              onClick={navigateFromMobileDrawer("/sign-in")}
              className="flex items-center border-b border-border/60 px-4 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </nav>
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
