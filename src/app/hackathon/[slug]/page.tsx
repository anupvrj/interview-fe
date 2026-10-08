import { Suspense } from "react";
import { HackathonPublicPage } from "@/features/hackathon/pages/HackathonPublicPage";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";

export default async function HackathonPublicRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <HackathonSlugProvider slug={slug}>
      <Suspense fallback={null}>
        <HackathonPublicPage />
      </Suspense>
    </HackathonSlugProvider>
  );
}
