import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { HACKATHON_LAUNCH, LAUNCH_EVENT_META } from "@/lib/hackathon-2026-content";

/** Link preview card (WhatsApp, Instagram, LinkedIn, X) for /product-launch. */
export const runtime = "nodejs";
export const alt = LAUNCH_EVENT_META.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadPublicSans(): Promise<{ name: string; data: ArrayBuffer; weight: 500 | 800 }[]> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Public+Sans:wght@500;800", {
      headers: { "User-Agent": "Mozilla/4.0" },
    }).then((res) => res.text());
    const fonts = await Promise.all(
      ([500, 800] as const).map(async (weight) => {
        const block = css.split("@font-face").find((b) => b.includes(`font-weight: ${weight}`));
        const url = block?.match(/src: url\((.+?)\)/)?.[1];
        if (!url) throw new Error(`Public Sans ${weight} missing`);
        const data = await fetch(url).then((res) => res.arrayBuffer());
        return { name: "Public Sans", data, weight };
      }),
    );
    return fonts;
  } catch {
    return [];
  }
}

export default async function OpenGraphImage() {
  const fonts = await loadPublicSans();
  const logo = await readFile(path.join(process.cwd(), "public/brand/hackathon-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#040b17",
          backgroundImage:
            "radial-gradient(900px 520px at 88% 110%, rgba(40,110,255,0.55), transparent 65%), radial-gradient(600px 380px at 0% 0%, rgba(30,90,200,0.35), transparent 70%)",
          color: "#ffffff",
          fontFamily: fonts.length ? "Public Sans" : "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={311} height={64} alt="" />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 6,
              color: "#4fb8ff",
              textTransform: "uppercase",
            }}
          >
            Product launch · Live online
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Learn from
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -2,
              backgroundImage: "linear-gradient(90deg, #ffffff, #5eb8ff)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Industry Leaders
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 28, fontWeight: 500, color: "#cfdbe8", maxWidth: 920, lineHeight: 1.35 }}>
            Winners, product updates & career advice — free registration.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 23, fontWeight: 800 }}>
          {[
            HACKATHON_LAUNCH.dateLabel.replace(/ \d{4}$/, ""),
            HACKATHON_LAUNCH.timeLabel,
            "Free · Register now",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                whiteSpace: "nowrap",
                padding: "10px 22px",
                borderRadius: 999,
                border: "2px solid rgba(79,184,255,0.55)",
                backgroundColor: "rgba(13,37,80,0.75)",
                color: "#e6f1ff",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
