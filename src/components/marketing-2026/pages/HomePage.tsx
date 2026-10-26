import { HomeHackathonPromoStrip } from "@/components/marketing/HomeHackathonPromoStrip";
import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Hero } from "../hero";
import { Logos } from "../logos";
import { Problem } from "../problem";
import { TryQuestion } from "../try-question";
import { ProductRail } from "../product-rail";
import { MemoryStory } from "../memory-story";
import { SkillsGraph } from "../skills-graph";
import { ResumeSpotlight } from "../resume-spotlight";
import { Everywhere } from "../everywhere";
import { Proof, Pricing, Faq, FinalCta, Footer } from "../closing";
import { Chapter } from "../story";

export function HomePage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <Hero />
        <Logos />
        <HomeHackathonPromoStrip />
        <Chapter n="01"><Problem /></Chapter>
        <Chapter n="02"><TryQuestion /></Chapter>
        <Chapter n="03"><ProductRail /></Chapter>
        <Chapter n="04"><MemoryStory /></Chapter>
        <Chapter n="05"><SkillsGraph /></Chapter>
        <Chapter n="06"><ResumeSpotlight /></Chapter>
        <Chapter n="07"><Everywhere /></Chapter>
        <Chapter n="08"><Proof /></Chapter>
        <Chapter n="09"><Pricing /></Chapter>
        <Faq />
        <Chapter n="end"><FinalCta /></Chapter>
      </main>
      <Footer />
    </Marketing2026Shell>
  );
}
