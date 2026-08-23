"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function ScrollSection({
  children,
  className = "",
  id,
}: ScrollSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px 120px 0px",
      },
    );

    const node = sectionRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      if (node) {
        observer.unobserve(node);
      }
    };
  }, []);

  // Check if section is target of navigation and trigger animation
  useEffect(() => {
    const checkAndAnimate = () => {
      if (id && window.location.hash === `#${id}`) {
        // Reset animation
        setIsVisible(false);
        // Wait for scroll to complete, then animate
        setTimeout(() => {
          setIsVisible(true);
        }, 150);
      }
    };

    // Check on mount
    checkAndAnimate();

    // Listen for hash changes
    window.addEventListener("hashchange", checkAndAnimate);
    
    // Also check when scrolling (for programmatic navigation)
    const handleScroll = () => {
      if (id && sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
        if (isInView && window.location.hash === `#${id}`) {
          setTimeout(() => {
            setIsVisible(true);
          }, 100);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", checkAndAnimate);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [id]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`${className} transition-all duration-500 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </section>
  );
}

