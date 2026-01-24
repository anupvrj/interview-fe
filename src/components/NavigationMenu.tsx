"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export function NavigationMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Handle smooth scrolling for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href^='#']");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const id = href.substring(1);
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
            // Close mobile menu after navigation
            setMobileMenuOpen(false);
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const menu = document.getElementById('mobile-menu');
      const menuButton = target.closest('#mobile-menu-button');
      
      // Check if click is outside menu and not on the menu button
      if (menu && !menu.contains(target) && !menuButton) {
        setMobileMenuOpen(false);
      }
    };

    // Use a small delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const menu = document.getElementById('mobile-menu');
      const menuButton = document.getElementById('mobile-menu-button');
      
      // Check if click is outside menu and not on the menu button
      if (menu && !menu.contains(target) && menuButton && !menuButton.contains(target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const menuItems = [
    { href: "#build-resume", label: "Build Resume" },
    { href: "#start-interview", label: "Start Interview" },
    { href: "#why-us", label: "Why Us?" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <>
      {/* Desktop Menu */}
      <nav className="hidden md:flex items-center gap-4 sm:gap-6">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="text-sm sm:text-base text-gray-700 hover:text-landing-blue-700 transition-colors font-medium"
          >
            {item.label}
          </a>
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
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-800 border-b border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  <span>{item.label.toUpperCase()}</span>
                </a>
              ))}
              
              {/* Dashboard link for signed-in users */}
              {isLoaded && user && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-800 border-b border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  <span>DASHBOARD</span>
                </Link>
              )}

              {/* Login/Register for signed-out users */}
              {isLoaded && !user && (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
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

