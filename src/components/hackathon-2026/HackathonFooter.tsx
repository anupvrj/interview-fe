import Link from "next/link";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { HackathonBrand } from "@/components/hackathon-2026/HackathonBrand";
import { SectionLink } from "@/components/hackathon-2026/HackathonMotion";
import { HACKATHON_2026_PATH, HACKATHON_ABOUT, HACKATHON_NAV, HACKATHON_SOCIALS } from "@/lib/hackathon-2026-content";

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  linkedin: Linkedin,
  x: XLogo,
  instagram: Instagram,
  youtube: Youtube,
} as const;

export function HackathonFooter() {
  return (
    <footer className="border-t border-[#142e4b] text-sm text-[#dbe6f3]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 px-5 py-9 text-center md:flex-row md:justify-between md:py-8 md:text-left">
        <Link
          href={HACKATHON_2026_PATH}
          aria-label="Hackathon home"
          className="shrink-0"
          onClick={(event) => {
            if (window.location.pathname === HACKATHON_2026_PATH) {
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <HackathonBrand size="lg" />
        </Link>
        <nav className="flex max-w-[17rem] flex-wrap justify-center gap-x-6 gap-y-3 md:max-w-none md:gap-x-8" aria-label="Hackathon footer">
          <Link href={HACKATHON_ABOUT.href} className="transition-colors hover:text-[#4fb8ff]">
            {HACKATHON_ABOUT.label}
          </Link>
          {HACKATHON_NAV.map((item) => (
            <SectionLink key={item.href} href={item.href} className="transition-colors hover:text-[#4fb8ff]">
              {item.label}
            </SectionLink>
          ))}
        </nav>
        <ul className="flex items-center gap-4">
          {HACKATHON_SOCIALS.map((social) => {
            const Icon = SOCIAL_ICONS[social.icon];
            return (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Interview Trix on ${social.label}`}
                  className="grid size-9 place-items-center rounded-lg text-white transition-[color,transform] duration-300 hover:-translate-y-0.5 hover:text-[#4fb8ff]"
                >
                  <Icon className="size-[22px]" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="border-t border-[#0f2640]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-3 px-5 py-5 text-center text-[13px] text-[#b4c3d4] sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Interview Trix. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
