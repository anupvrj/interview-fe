import { Suspense } from "react";
import { HackathonDashboardPage } from "@/features/hackathon/pages/HackathonDashboardPage";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";
import { HackathonPageLoader } from "@/features/hackathon/components/HackathonPageLoader";

export default async function HackathonDashboardRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <HackathonSlugProvider slug={slug}>
      {/* The interview result pop-up reads ?result= (useSearchParams). */}
      <Suspense fallback={<HackathonPageLoader />}>
        <HackathonDashboardPage />
      </Suspense>
    </HackathonSlugProvider>
  );
}
