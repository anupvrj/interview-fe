import Link from "next/link";
import { Footer } from "@/components/marketing-2026/closing";
import { GridRunners } from "@/components/marketing-2026/graphics";
import { HL } from "@/components/marketing-2026/landing-kit";
import { Marketing2026Shell } from "@/components/marketing-2026/Marketing2026Shell";
import { Nav } from "@/components/marketing-2026/nav";
import { BrowserFrame } from "@/components/marketing-2026/primitives";

const LAUNCH_VIDEO_ID = "3zw7NrCmx8Y";
const LAUNCH_VIDEO_URL = `https://www.youtube.com/watch?v=${LAUNCH_VIDEO_ID}`;

export function EventRegistrationPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <section className="relative overflow-clip pb-24 pt-32 md:pt-40">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(42%_34%_at_50%_30%,rgba(115,103,240,.16),transparent_72%),radial-gradient(38%_30%_at_22%_14%,rgba(31,143,255,.10),transparent_70%),radial-gradient(36%_28%_at_80%_16%,rgba(155,140,255,.14),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_60%)]"
          />
          <GridRunners />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

          <div className="relative mx-auto max-w-[1120px] px-5 text-center">
            <h1 className="mx-auto text-[clamp(28px,7.2vw,64px)] font-black leading-[1.02] tracking-[-0.055em] text-[#2E3656]">
              <span className="block whitespace-nowrap">The launch was</span>
              <span className="block whitespace-nowrap">
                completed <span className={HL}>successfully</span>
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-[46ch] text-[16px] leading-relaxed text-[#4B5275] sm:text-[17px] md:text-[18.5px]">
              Thank you for joining. Watch the live stream from the launch below.
            </p>
          </div>

          <div className="relative mx-auto mt-12 max-w-[980px] px-4 md:mt-16">
            <BrowserFrame url="youtube.com/watch">
              <div className="aspect-video bg-black" id="launch-video">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${LAUNCH_VIDEO_ID}`}
                  title="InterviewTrix product launch live stream"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </BrowserFrame>
            <p className="mt-6 text-center">
              <Link
                href={LAUNCH_VIDEO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-6 text-[15.5px] font-semibold text-[#2E3656] hover:border-primary/40"
              >
                Watch on YouTube
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </Marketing2026Shell>
  );
}
