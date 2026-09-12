"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChromeIcon } from "@/components/chrome-extension/ChromeIcon";
import { appOutlineButton, appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

export function getChromeExtensionHref(): string {
  return process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL || "/chrome-extension";
}

export function isExternalChromeExtensionHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function AddToChromeButton({
  className,
  variant = "primary",
  size = "default",
  label = "Add to Chrome",
}: Readonly<{
  className?: string;
  variant?: "primary" | "outline";
  size?: "default" | "lg" | "sm";
  label?: string;
}>) {
  const href = getChromeExtensionHref();
  const external = isExternalChromeExtensionHref(href);
  const buttonClass = cn(
    variant === "primary" ? appPrimaryButton : appOutlineButton,
    size === "lg" && "h-auto px-5 py-4 text-sm sm:px-6 sm:py-5 sm:text-base",
    size === "sm" && "h-11",
    className,
  );

  const content = (
    <>
      <ChromeIcon className="mr-2 h-4 w-4" />
      {label}
    </>
  );

  if (external) {
    return (
      <Button asChild className={buttonClass} size={size === "lg" ? "lg" : size}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button asChild className={buttonClass} size={size === "lg" ? "lg" : size}>
      <Link href={href}>{content}</Link>
    </Button>
  );
}
