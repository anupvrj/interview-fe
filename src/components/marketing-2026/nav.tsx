"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MK26_ROUTES } from "./cta";
import { StartLink } from "./StartLink";
import { mk26Path } from "./assets";

const products = [
  { label: "AI Mock Interview", href: MK26_ROUTES.interview },
  { label: "AI Resume Builder", href: MK26_ROUTES.resume },
  { label: "AI Coding Round", href: MK26_ROUTES.coding },
  { label: "AI System Design", href: MK26_ROUTES.systemDesign },
];

const extras = [
  { label: "ATS checker", href: MK26_ROUTES.ats },
  { label: "Chrome extension", href: MK26_ROUTES.chrome },
  { label: "Pricing", href: MK26_ROUTES.pricing },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
      <nav
        className={cn(
          "mx-auto flex h-16 max-w-[1180px] items-center gap-8 rounded-2xl border px-4 transition-all",
          scrolled || open ? "border-border bg-white/85 shadow-[0_8px_30px_-12px_rgba(47,43,61,.25)] backdrop-blur-xl" : "border-transparent bg-transparent",
        )}
      >
        <Link href={MK26_ROUTES.home} className="shrink-0" onClick={() => setOpen(false)}>
          <Image src={mk26Path("/shots/interviewtrix-logo.png")} alt="InterviewTrix" width={164} height={36} priority className="h-9 w-auto" />
        </Link>
        <ul className="hidden items-center gap-6 text-[14.5px] text-foreground/75 lg:flex">
          <li className="relative">
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground"
              aria-expanded={productOpen}
              onClick={() => setProductOpen((v) => !v)}
              onBlur={() => setTimeout(() => setProductOpen(false), 150)}
            >
              Product <ChevronDown className="size-3.5 opacity-60" />
            </button>
            {productOpen && (
              <div className="absolute left-0 top-full mt-3 w-64 rounded-2xl border border-border bg-white p-2 shadow-[0_20px_50px_-24px_rgba(30,20,90,.45)]">
                {products.map((p) => (
                  <Link key={p.href} href={p.href} className="block rounded-xl px-3 py-2.5 text-[14px] text-foreground hover:bg-muted">
                    {p.label}
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li>
            <Link href={MK26_ROUTES.chrome} className="flex items-center gap-1 hover:text-foreground">
              Integrations
              <span className="rounded-md bg-primary-muted px-1.5 py-0.5 text-[10px] font-medium text-primary">ChatGPT</span>
            </Link>
          </li>
          <li>
            <Link href={MK26_ROUTES.about} className="hover:text-foreground">Solutions</Link>
          </li>
          <li>
            <Link href={MK26_ROUTES.pricing} className="hover:text-foreground">Pricing</Link>
          </li>
        </ul>
        <div className="ml-auto flex items-center gap-3">
          <SignedOut>
            <Link className="hidden whitespace-nowrap text-[14.5px] text-foreground/75 hover:text-foreground sm:block" href={MK26_ROUTES.signIn}>Sign in</Link>
            <Button asChild className="h-10 rounded-xl px-4 hover:bg-primary/90">
              <StartLink href={MK26_ROUTES.startInterview}>Start free</StartLink>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild className="h-10 rounded-xl px-4 hover:bg-primary/90">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </SignedIn>
          <button className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="mx-auto mt-2 max-w-[1180px] rounded-2xl border border-border bg-white/95 p-4 shadow-[0_20px_50px_-24px_rgba(30,20,90,.45)] backdrop-blur-xl lg:hidden">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
          {products.map((p) => (
            <Link key={p.href} href={p.href} onClick={() => setOpen(false)} className="block rounded-xl px-2 py-2.5 text-[15px] font-medium text-[#2E3656]">
              {p.label}
            </Link>
          ))}
          {extras.map((p) => (
            <Link key={p.href} href={p.href} onClick={() => setOpen(false)} className="block rounded-xl px-2 py-2.5 text-[15px] text-[#2E3656]">
              {p.label}
            </Link>
          ))}
          <SignedOut>
            <Link href={MK26_ROUTES.signIn} onClick={() => setOpen(false)} className="mt-2 block rounded-xl px-2 py-2.5 text-[15px] text-[#2E3656]">
              Sign in
            </Link>
          </SignedOut>
        </div>
      )}
    </header>
  );
}
