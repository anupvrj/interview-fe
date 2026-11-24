import type { Metadata } from "next";
import { Marketing2026Shell } from "@/components/marketing-2026/Marketing2026Shell";
import { Nav } from "@/components/marketing-2026/nav";
import { Footer } from "@/components/marketing-2026/closing";
import { GuestResumeBuilder } from "@/components/resume-builder/GuestResumeBuilder";
import { getSiteUrl } from "@/lib/seo/site-url";

export const metadata: Metadata = {
  title: "Build Your Resume Free | Interview Trix",
  description: "Upload your resume or start from scratch, see it in ATS-friendly templates, and sign up only when you want to save or download.",
  alternates: { canonical: `${getSiteUrl()}/resume-builder/start` },
};

export default function GuestResumeBuilderPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <GuestResumeBuilder />
      </main>
      <Footer />
    </Marketing2026Shell>
  );
}
