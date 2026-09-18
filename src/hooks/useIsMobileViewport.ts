"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `lg` — same breakpoint as mobile header / drawer nav. */
const MOBILE_VIEWPORT_QUERY = "(max-width: 1023px)";

export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}
