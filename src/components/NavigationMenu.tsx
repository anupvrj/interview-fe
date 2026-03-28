"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavigationMenu() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();

  /** Programmatic nav + deferred drawer close avoids unmounting `<Link>` mid-navigation (fixes empty pricing / flaky SPA transitions on mobile). */
  const navigateFromMobileDrawer = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(href);
    setTimeout(() => setMobileMenuOpen(false), 0);
  };

  // Single outside-dismiss handler (pointer = mouse + touch)
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

  const menuItems = [
    { href: "/about-us", label: "About us" },
    { href: "/ai-resume-builder", label: "Resume Builder" },
    { href: "/ai-interview-coach", label: "AI Interview Coach" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <>
      {/* Desktop Menu */}
      <nav className="hidden md:flex items-center gap-4 sm:gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm sm:text-base text-gray-700 hover:text-[rgb(37,99,235)] transition-colors font-medium"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <div className="md:hidden" id="mobile-menu-button">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay - Covers entire screen */}
      {mobileMenuOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black/30 z-[60] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu - Slides from Left */}
      <nav
        id="mobile-menu"
        className={`fixed top-0 left-0 h-screen w-80 max-w-[85vw] bg-gray-100 z-[70] md:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-screen">
          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-2">
            <div className="flex flex-col">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={navigateFromMobileDrawer(item.href)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-800 border-b border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  <span>{item.label.toUpperCase()}</span>
                </Link>
              ))}
              
              {/* Dashboard link for signed-in users */}
              {isLoaded && user && (
                <Link
                  href="/dashboard"
                  onClick={navigateFromMobileDrawer("/dashboard")}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-800 border-b border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  <span>DASHBOARD</span>
                </Link>
              )}

              {/* Login/Register for signed-out users */}
              {isLoaded && !user && (
                <Link
                  href="/sign-in"
                  onClick={navigateFromMobileDrawer("/sign-in")}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-800 border-b border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  <span>LOGIN / REGISTER</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

