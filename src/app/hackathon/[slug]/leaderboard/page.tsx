import type { Metadata } from "next";
import { HackathonLeaderboardPage } from "@/features/hackathon/pages/HackathonLeaderboardPage";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";
import { getPrivateAppRobots } from "@/lib/seo/site-url";

export const metadata: Metadata = {
  title: "Hackathon Leaderboard — InterviewTrix",
  robots: getPrivateAppRobots(),
};

export default async function HackathonLeaderboardRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <HackathonSlugProvider slug={slug}>
      <HackathonLeaderboardPage />
    </HackathonSlugProvider>
  );
}
