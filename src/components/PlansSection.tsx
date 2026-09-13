"use client";

import { useEffect, useRef, useState } from "react";
import { PricingPlansBlock } from "@/components/PricingPlansBlock";
import { appMarketingSection } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

export function PlansSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, 150);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkAndAnimate = () => {
      if (sectionRef.current && window.location.hash === "#pricing") {
        setIsVisible(false);
        setTimeout(() => {
          setIsVisible(true);
        }, 400);
      }
    };

    checkAndAnimate();

    window.addEventListener("hashchange", checkAndAnimate);

    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const isInView =
          rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
        if (isInView && window.location.hash === "#pricing") {
          setTimeout(() => {
            setIsVisible(true);
          }, 200);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", checkAndAnimate);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className={cn(
        appMarketingSection,
        "scroll-mt-20 py-12 transition-all duration-1000 ease-out sm:py-16 lg:py-20 px-4 sm:px-6",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
    >
      <div className="container mx-auto max-w-6xl">
        <PricingPlansBlock
          showHeading
          showViewAllPlansLink
        />
      </div>
    </section>
  );
}
