"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItemClass =
  "flex w-full items-center gap-3 rounded-[0.625rem] px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50";

type ProfileMenuProps = {
  className?: string;
  /** Where the panel opens relative to the avatar trigger */
  placement?: "bottom-end" | "top-start";
  avatarClassName?: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileMenu({
  className,
  placement = "bottom-end",
  avatarClassName,
}: ProfileMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = getInitials(displayName) || "U";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  };

  if (!isLoaded || !user) return null;

  const panelPositionClass =
    placement === "top-start"
      ? "bottom-full left-0 pb-2"
      : "right-0 top-full pt-2";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex rounded-full ring-2 ring-primary/20 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          avatarClassName,
        )}
        aria-label="Open account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7367F0]/10 text-sm font-semibold text-[#7367F0]">
            {initials}
          </span>
        )}
      </button>

      {open ? (
        <div
          className={cn("absolute z-[80] w-[min(18rem,calc(100vw-2rem))]", panelPositionClass)}
        >
          <div
            id={menuId}
            role="menu"
            aria-label="Account menu"
            className="overflow-hidden rounded-xl border border-border bg-card shadow-header"
          >
            <div className="border-b border-border px-4 py-4">
              <div className="flex items-center gap-3">
                {user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.imageUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/10 text-sm font-semibold text-[#7367F0] ring-2 ring-primary/20">
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  {email ? (
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-0.5 p-2">
              <Link
                href="/dashboard"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-[#7367F0]" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                <UserRound className="h-4 w-4 shrink-0 text-[#7367F0]" />
                My Profile
              </Link>
            </div>

            <div className="border-t border-border p-2">
              <button
                type="button"
                role="menuitem"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
                className={cn(
                  menuItemClass,
                  "text-destructive hover:bg-destructive/10 disabled:opacity-60",
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
