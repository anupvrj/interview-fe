import { useEffect } from "react";

/**
 * Hackathon dashboard / profile: no animations or transitions (pop-ups that faded and zoomed
 * in, pulsing cards, sliding banners). Pop-ups render outside the page, so the switch sits on
 * <html> while the page is open. Loading spinners keep turning.
 */
export function useNoMotion(): void {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("hk-no-motion");
    return () => root.classList.remove("hk-no-motion");
  }, []);
}
