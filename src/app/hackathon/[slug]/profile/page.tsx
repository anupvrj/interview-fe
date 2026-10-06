import { notFound } from "next/navigation";
import { HackathonProfilePage } from "@/features/hackathon/pages/HackathonProfilePage";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";
import { isHackathonEnabled } from "@/features/hackathon/config";

export default async function HackathonProfileRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isHackathonEnabled()) notFound();
  const { slug } = await params;
  return (
    <HackathonSlugProvider slug={slug}>
      <HackathonProfilePage />
    </HackathonSlugProvider>
  );
}
