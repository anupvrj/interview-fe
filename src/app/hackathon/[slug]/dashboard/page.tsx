import { notFound } from "next/navigation";
import { HackathonDashboardPage } from "@/features/hackathon/pages/HackathonDashboardPage";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";
import { isHackathonEnabled } from "@/features/hackathon/config";

export default async function HackathonDashboardRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isHackathonEnabled()) notFound();
  const { slug } = await params;
  return (
    <HackathonSlugProvider slug={slug}>
      <HackathonDashboardPage />
    </HackathonSlugProvider>
  );
}
