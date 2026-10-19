import { AdminSitePopupEditor } from "@/features/site-popups/admin/AdminSitePopupEditor";

export default async function SuperAdminSitePopupEditPage({
  params,
}: Readonly<{ params: Promise<{ popupId: string }> }>) {
  const { popupId } = await params;
  return <AdminSitePopupEditor popupId={popupId} />;
}
