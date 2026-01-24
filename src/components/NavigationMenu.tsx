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
      <div className="md:hidden">
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <nav
        className={`fixed top-16 left-0 right-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 border-b shadow-lg z-50 md:hidden transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-2">
            {menuItems.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md relative overflow-hidden group"
                style={{
                  background: index % 2 === 0 
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)"
                    : "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                }}
              >
                <span className="relative z-10 text-gray-800 group-hover:text-purple-700 transition-colors">
                  {item.label}
                </span>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: index % 2 === 0
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)"
                      : "linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
                  }}
                />
              </a>
            ))}
            {/* Dashboard link for signed-in users */}
            {isLoaded && user && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <span className="relative z-10 text-gray-800 group-hover:text-blue-700 transition-colors">
                  Dashboard
                </span>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
                  }}
                />
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

