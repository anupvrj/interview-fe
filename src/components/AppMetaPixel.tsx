"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/analytics/fbq";

type Props = Readonly<{
  pixelId: string | null;
}>;

/**
 * Meta Pixel — official base code via `next/script` (`afterInteractive`).
 * The base code sends the first `PageView`; client-side route changes send the rest.
 * `pixelId` comes from the server layout (`getMetaPixelId()`).
 */
export function AppMetaPixel({ pixelId }: Props) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pixelId) return;
    if (lastPath.current === null) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackMetaEvent("PageView");
  }, [pathname, pixelId]);

  if (!pixelId) {
    return null;
  }

  const idLiteral = JSON.stringify(pixelId);

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${idLiteral});
fbq('track', 'PageView');
      `.trim()}
    </Script>
  );
}
