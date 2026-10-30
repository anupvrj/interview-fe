"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  navLinkBecomeInterviewer,
  navLinkHackathon,
  navLinkPricing,
  navLinksHome,
  PublicMobileNav,
  useVisibleMarketingNav,
} from "@/components/NavigationMenu";
import { cn } from "@/lib/utils";
import { LiveChip } from "@/components/LiveChip";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import { mk26Path } from "./assets";

type Item = { href: string; label: string; description: string };

/** Same entries, order and feature-flag visibility as the production header (minus Hackathon); only the styling is new. */
function Dropdown({ label, items, active }: { label: string; items: readonly Item[]; active: boolean }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <li className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={cn("flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
        {label} <ChevronDown className={cn("size-3.5 opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-3">
          <div className="w-[360px] whitespace-normal rounded-2xl border border-border bg-white p-2.5 shadow-[0_20px_50px_-24px_rgba(30,20,90,.45)]">
            {items.map((p) => (
              <Link key={p.href} href={p.href} className="block rounded-xl px-3 py-2.5 hover:bg-muted">
                <span className="block text-[14px] font-medium text-foreground">{p.label}</span>
                <span className="block text-[12.5px] text-muted-foreground">{p.description}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

const linkCls = (active: boolean) => cn("hover:text-foreground", active && "text-foreground");

/**
 * A bright, near-solid bar that takes ~5% of whatever section sits under it, so dark sections don't grey it out.
 * A section can name its own tint with data-nav-tint (a near-black navy would only mix to grey).
 */
function tintBehind(nav: HTMLElement | null): string | undefined {
  const header = nav?.closest("header");
  if (!nav || !header) return;
  const r = nav.getBoundingClientRect();
  for (const el of document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)) {
    if (header.contains(el)) continue;
    for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
      const color = n.getAttribute("data-nav-tint") ?? getComputedStyle(n).backgroundColor;
      const [cr, cg, cb, ca = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
      if (cr === undefined || ca < 0.5) continue;
      const mix = (c: number) => Math.round(255 * 0.95 + c * 0.05);
      return `rgba(${mix(cr)}, ${mix(cg)}, ${mix(cb)}, 0.96)`;
    }
  }
}

export function Nav() {
  const pathname = usePathname() ?? "";
  const visible = useVisibleMarketingNav();
  const { resumeItems, showBecomeInterviewer, showHackathon } = visible;
  // the new design has a landing page for peer interviews, so send people there before the booking screen
  const mockItems = visible.mockItems.map((i) => (i.href === MK26_ROUTES.startPeerBooking ? { ...i, href: MK26_ROUTES.peerInterviews } : i));
  const [scrolled, setScrolled] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const [tint, setTint] = useState<string>();
  useEffect(() => {
    let raf = 0;
    const on = () => {
      setScrolled(window.scrollY > 12);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTint(tintBehind(bar.current)));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);

  const resumeActive = resumeItems.some((i) => pathname.startsWith(i.href));
  const mockActive = mockItems.some((i) => pathname.startsWith(i.href));

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
      <nav
        ref={bar}
        style={scrolled ? { backgroundColor: tint } : undefined}
        className={cn(
          "mx-auto flex h-16 max-w-[1180px] items-center gap-6 rounded-2xl border px-4 transition-all xl:gap-8",
          scrolled ? "border-border bg-white/85 shadow-[0_8px_30px_-12px_rgba(47,43,61,.25)] backdrop-blur-xl" : "border-transparent bg-transparent",
        )}
      >
        {/* phones and tablets get the production drawer: hamburger on the left, menu slides in from the left */}
        <div className="-ml-1 -mr-3 lg:hidden"><PublicMobileNav mockItems={mockItems} /></div>
        <Link href={MK26_ROUTES.home} className="shrink-0">
          <Image src={mk26Path("/shots/interviewtrix-logo.png")} alt="InterviewTrix" width={164} height={36} priority className="h-9 w-auto" />
        </Link>
        <ul className="hidden items-center gap-4 whitespace-nowrap text-[14px] font-semibold text-foreground/80 lg:flex xl:gap-6 xl:text-[14.5px]">
          {navLinksHome.map((l) => (
            <li key={l.href}><Link href={l.href} className={linkCls(l.match(pathname))}>{l.label}</Link></li>
          ))}
          {/* shown while the hackathon feature is on in admin, same switch as the old header */}
          {showHackathon && (
            <li>
              <Link href={navLinkHackathon.href} className={cn(linkCls(navLinkHackathon.match(pathname)), "inline-flex items-center gap-1.5")}>
                {navLinkHackathon.label}<LiveChip />
              </Link>
            </li>
          )}
          <Dropdown label="Resume" items={resumeItems} active={resumeActive} />
          <Dropdown label="Mock Interviews" items={mockItems} active={mockActive} />
          {showBecomeInterviewer && (
            <li><Link href={navLinkBecomeInterviewer.href} className={linkCls(navLinkBecomeInterviewer.match(pathname))}>{navLinkBecomeInterviewer.label}</Link></li>
          )}
          <li><Link href={navLinkPricing.href} className={linkCls(navLinkPricing.match(pathname))}>{navLinkPricing.label}</Link></li>
        </ul>
        <div className="ml-auto flex items-center gap-3">
          <SignedOut>
            <Link className="hidden whitespace-nowrap py-2.5 text-[14.5px] font-semibold text-foreground/80 hover:text-foreground sm:block" href={MK26_ROUTES.signIn}>Sign in</Link>
            <Button asChild className="h-10 rounded-xl px-4 hover:bg-primary/90">
              <StartLink href={MK26_ROUTES.startInterview}>Start free</StartLink>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild className="h-10 rounded-xl px-4 hover:bg-primary/90">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
