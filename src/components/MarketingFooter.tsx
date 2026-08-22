import Link from "next/link";
import { cn } from "@/lib/utils";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { SocialLinks } from "@/components/SocialLinks";
import {
  FOOTER_IMPORTANT_LINKS,
  FOOTER_POLICY_LINKS,
  FOOTER_PRODUCT_LINKS,
  type FooterLink,
} from "@/lib/marketing-footer-links";

interface MarketingFooterProps {
  as?: "section" | "footer";
  className?: string;
}

function FooterLinkColumn({
  title,
  links,
}: Readonly<{ title: string; links: FooterLink[] }>) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
        {title}
      </h2>
      <ul className="space-y-3">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm leading-snug text-gray-300 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MarketingFooter({
  as: Tag = "section",
  className,
}: MarketingFooterProps) {
  return (
    <Tag
      className={cn(
        "bg-slate-900 px-4 py-10 sm:px-6 sm:py-12 lg:py-14",
        className,
      )}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-10">
          {/* Footer menu 1 — logo & social */}
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <Link
              href="/"
              className="inline-flex transition-opacity hover:opacity-90"
            >
              <InterviewTrixLogo
                variant="white"
                className="h-8 w-auto sm:h-9"
              />
            </Link>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-white">
              Follow us
            </p>
            <SocialLinks
              className="mt-3 justify-center sm:justify-start"
              iconClassName="h-5 w-5"
            />
          </div>

          {/* Footer menu 2 — important links */}
          <FooterLinkColumn title="Important Links" links={FOOTER_IMPORTANT_LINKS} />

          {/* Footer menu 3 — products */}
          <FooterLinkColumn title="Our Products" links={FOOTER_PRODUCT_LINKS} />

          {/* Footer menu 4 — policies */}
          <FooterLinkColumn title="Policies" links={FOOTER_POLICY_LINKS} />
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 sm:mt-12">
          <p className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Interview Trix. All rights reserved.
          </p>
        </div>
      </div>
    </Tag>
  );
}
