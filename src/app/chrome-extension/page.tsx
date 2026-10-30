"use client";
import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { Marketing2026Shell } from "@/components/marketing-2026/Marketing2026Shell";
import { Nav } from "@/components/marketing-2026/nav";
import { FinalCta, Footer } from "@/components/marketing-2026/closing";
import { ChromeBoards, ChromeHero, ChromePrivacy, ChromeSteps } from "@/components/marketing-2026/chrome-extension";
import LegacyChromeExtensionPage from "./legacy-page";

export default function ChromeExtensionPage() {
  if (!isMarketing2026Enabled()) return <LegacyChromeExtensionPage />;
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <ChromeHero />
        <ChromeSteps />
        <ChromeBoards />
        <ChromePrivacy />
      </main>
      <FinalCta primary="Open resume builder" primaryHref="/dashboard/resumes/new" />
      <Footer />
    </Marketing2026Shell>
  );
}
