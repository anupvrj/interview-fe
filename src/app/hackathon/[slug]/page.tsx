import { Suspense } from "react";
import { redirect } from "next/navigation";
import { HackathonPublicPage } from "@/features/hackathon/pages/HackathonPublicPage";
import { HACKATHON_LANDING_PATH, HACKATHON_SLUG } from "@/features/hackathon/config";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";

export default async function HackathonPublicRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === HACKATHON_SLUG) {
    redirect(HACKATHON_LANDING_PATH);
  }
  return (
    <HackathonSlugProvider slug={slug}>
      <Suspense fallback={null}>
        <HackathonPublicPage />
      </Suspense>
    </HackathonSlugProvider>
  );
}
