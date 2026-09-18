import type { Metadata } from "next";
import { getPrivateAppRobots } from "@/lib/seo/site-url";

export const metadata: Metadata = {
  robots: getPrivateAppRobots(),
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
