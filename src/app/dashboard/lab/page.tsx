import { redirect } from "next/navigation";

/** Agent Lab lives under Super Admin. */
export default function LabRedirectPage() {
  redirect("/super-admin/lab");
}
