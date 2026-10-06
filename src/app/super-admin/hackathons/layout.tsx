import { notFound } from "next/navigation";
import { isHackathonEnabled } from "@/features/hackathon/config";

export default function SuperAdminHackathonsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isHackathonEnabled()) notFound();
  return children;
}
