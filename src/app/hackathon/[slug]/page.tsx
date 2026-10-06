import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HackathonPublicPage } from "@/features/hackathon/pages/HackathonPublicPage";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";
import { isHackathonEnabled } from "@/features/hackathon/config";

export default async function HackathonPublicRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isHackathonEnabled()) notFound();
  const { slug } = await params;
  return (
    <HackathonSlugProvider slug={slug}>
      <Suspense fallback={null}>
        <HackathonPublicPage />
      </Suspense>
    </HackathonSlugProvider>
  );
}
