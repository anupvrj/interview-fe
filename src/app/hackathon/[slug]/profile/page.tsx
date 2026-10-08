import { HackathonProfilePage } from "@/features/hackathon/pages/HackathonProfilePage";
import { HackathonSlugProvider } from "@/features/hackathon/hooks";

export default async function HackathonProfileRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <HackathonSlugProvider slug={slug}>
      <HackathonProfilePage />
    </HackathonSlugProvider>
  );
}
