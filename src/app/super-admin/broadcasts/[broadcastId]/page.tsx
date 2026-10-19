import { AdminBroadcastEditor } from "@/features/broadcasts/admin/AdminBroadcastEditor";

export default async function SuperAdminBroadcastEditPage({
  params,
}: Readonly<{ params: Promise<{ broadcastId: string }> }>) {
  const { broadcastId } = await params;
  return <AdminBroadcastEditor broadcastId={broadcastId} />;
}
