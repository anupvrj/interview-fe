import { FeatureRouteGuard } from "@/components/features/FeatureRouteGuard";

export default function ConnectorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FeatureRouteGuard>{children}</FeatureRouteGuard>;
}
