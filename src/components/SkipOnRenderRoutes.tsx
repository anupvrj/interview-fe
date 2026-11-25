"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Pages only the server's headless renderer opens (resume thumbnails). */
export function isRenderRoute(pathname: string | null | undefined): boolean {
  return !!pathname && (pathname === "/render" || pathname.startsWith("/render/"));
}

/**
 * Leaves out analytics, session recording and popups on render pages: they'd count the renderer
 * as a visitor, record resume content, or cover the page being screenshotted.
 */
export function SkipOnRenderRoutes({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isRenderRoute(pathname) ? null : <>{children}</>;
}
