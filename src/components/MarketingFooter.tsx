import Link from "next/link";
import { cn } from "@/lib/utils";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { SocialLinks } from "@/components/SocialLinks";

interface MarketingFooterProps {
  as?: "section" | "footer";
  className?: string;
}

export function MarketingFooter({
  as: Tag = "section",
  className,
}: MarketingFooterProps) {
  return (
    <Tag
      className={cn(
        "py-8 sm:py-10 px-4 sm:px-6 bg-slate-900",
        className,
      )}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 md:gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 md:gap-6">
            <Link
              href="/"
              className="inline-flex items-center hover:opacity-90 transition-opacity"
            >
              <InterviewTrixLogo
                variant="white"
                className="h-7 sm:h-8 lg:h-10 w-auto"
              />
            </Link>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
              <nav className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6">
                <Link
                  href="/hire-ix-talent"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Hire iX Talent
                </Link>
                <Link
                  href="/about-us"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  About us
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/refund"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Refund policy
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Contact us
                </Link>
              </nav>
              <SocialLinks className="md:ml-0 shrink-0" />
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-gray-400 text-center">
            © 2026 Interview Trix. All rights reserved.
          </p>
        </div>
      </div>
    </Tag>
  );
}
