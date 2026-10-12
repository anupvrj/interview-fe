import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { HACKATHON_CHALLENGE, HACKATHON_LAUNCH, HACKATHON_PRIZES } from "@/lib/hackathon-2026-content";

/** Link preview card (Slack, WhatsApp, LinkedIn, X) for the hackathon landing page. */
export const runtime = "nodejs";
export const alt = "InterviewTrix: The Hiring Games — free hiring hackathon and online launch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Public Sans (the site font) as TTF; satori can't read woff2. Falls back to the default font offline. */
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
  const pool = HACKATHON_PRIZES.poolAmount.toLocaleString("en-IN");

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
            Hackathon · Product Launch
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3 }}>
            InterviewTrix:
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.18,
              paddingBottom: 6,
              letterSpacing: -3,
              backgroundImage: "linear-gradient(90deg, #4fb8ff, #1677ff)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            The Hiring Games
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 30, fontWeight: 500, color: "#cfdbe8", maxWidth: 940 }}>
            Learn from leading software industry experts how to land your next role in an AI-driven world.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, fontSize: 23, fontWeight: 800 }}>
          {[
            `Hackathon · ${HACKATHON_CHALLENGE.dateLabel.replace(/ \d{4}$/, "")}`,
            `Online launch · ${HACKATHON_LAUNCH.dateLabel.replace(/^\w+, /, "").replace(/ \d{4}$/, "")}`,
            `₹${pool} prize pool`,
            "Free entry",
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
