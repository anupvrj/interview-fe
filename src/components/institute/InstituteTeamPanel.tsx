"use client";

import { useState } from "react";
import { Loader2, Plus, RotateCcw, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormField } from "@/components/app/FormField";
import {
  InstituteEmptyState,
  InstituteTableShell,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { lifecycleCardClass } from "@/components/institution-lifecycle/BillingPanels";
import { adminApi, type PendingInvitation } from "@/lib/api";
import { cn } from "@/lib/utils";

const STAFF_ROLE_OPTIONS = [
  { value: "institution_admin", label: "Admin" },
  { value: "institution_interview_manager", label: "Interview manager" },
  { value: "institution_moderator", label: "Moderator" },
];

function staffInitials(name: string | undefined, email: string | undefined): string {
  const n = (name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = (email || "").split("@")[0] || "?";
  return local.slice(0, 2).toUpperCase();
}

export type InstituteStaffMember = {
  clerkId: string;
  name: string;
  email: string;
  accessRole: string;
};

export function InstituteTeamPanel({
  institutionId,
  staff,
  pendingStaff,
  onReload,
}: Readonly<{
  institutionId: string;
  staff: InstituteStaffMember[];
  pendingStaff: PendingInvitation[];
  onReload: () => Promise<void>;
}>) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("institution_moderator");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const handleInviteStaff = async () => {
    if (!inviteEmail.trim()) return;
    try {
      setInviteSubmitting(true);
      const res = await adminApi.inviteInstitutionStaff(institutionId, {
        email: inviteEmail.trim(),
        staffRole: inviteRole,
      });
      toast.success(res.message);
      setInviteOpen(false);
      setInviteEmail("");
      await onReload();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Invite failed",
      );
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <>
      <Card className={lifecycleCardClass}>
        <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <CardTitle className="text-base">Team &amp; roles</CardTitle>
              <CardDescription>
                Invite interview managers and moderators with scoped permissions.
              </CardDescription>
            </div>
            <Button className="h-10 shrink-0 gap-2" onClick={() => setInviteOpen(true)}>
              <Plus className="h-4 w-4" />
              Invite member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {staff.length === 0 && pendingStaff.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={UserPlus}
                title="No team members yet"
                description="Invite colleagues as admins, interview managers, or moderators."
                action={
                  <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Invite member
                  </Button>
                }
              />
            </div>
          ) : (
            <InstituteTableShell>
              <Table className="w-full min-w-[640px]">
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-6 font-semibold text-foreground">Member</TableHead>
                    <TableHead className="font-semibold text-foreground">Role</TableHead>
                    <TableHead className="w-[88px] min-w-[88px] pr-6 text-right font-semibold text-foreground">
                      Remove
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingStaff.map((inv) => (
                    <TableRow key={`invite-${inv._id}`} className="border-border bg-amber-50/40">
                      <TableCell className="pl-6 align-middle">
                        <div className="flex items-center gap-3 py-1">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-sm font-bold text-white">
                            {staffInitials("", inv.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">Invite pending</p>
                            <p className="truncate text-xs text-muted-foreground">{inv.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle text-sm">{inv.roleLabel}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Resend invite to ${inv.email}`}
                            onClick={async () => {
                              try {
                                const res = await adminApi.resendInvitation(institutionId, inv._id);
                                toast.success(res.message || "Invitation resent");
                              } catch (err: unknown) {
                                toast.error(
                                  (err as { response?: { data?: { message?: string } } })?.response
                                    ?.data?.message || "Could not resend",
                                );
                              }
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            aria-label={`Revoke invite for ${inv.email}`}
                            onClick={async () => {
                              try {
                                await adminApi.revokeInvitation(institutionId, inv._id);
                                toast.success("Invitation revoked");
                                await onReload();
                              } catch (err: unknown) {
                                toast.error(
                                  (err as { response?: { data?: { message?: string } } })?.response
                                    ?.data?.message || "Could not revoke",
                                );
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staff.map((s) => (
                    <TableRow
                      key={s.clerkId}
                      className="border-border transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="pl-6 align-middle">
                        <div className="flex items-center gap-3 py-1">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-sm font-bold text-white shadow-md shadow-primary/15 ring-2 ring-white"
                            aria-hidden
                          >
                            {staffInitials(s.name, s.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{s.name || "—"}</p>
                            <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <select
                          className="app-control h-10 max-w-[220px] rounded-lg border-border text-sm shadow-sm"
                          value={s.accessRole}
                          aria-label={`Role for ${s.email}`}
                          onChange={async (e) => {
                            try {
                              await adminApi.updateInstitutionStaffRole(
                                institutionId,
                                s.clerkId,
                                e.target.value,
                              );
                              await onReload();
                              toast.success("Role updated");
                            } catch (err: unknown) {
                              toast.error(
                                (err as { response?: { data?: { message?: string } } })?.response
                                  ?.data?.message || "Update failed",
                              );
                            }
                          }}
                        >
                          {STAFF_ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="w-[88px] min-w-[88px] pr-6 text-right align-middle">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0 border-red-200/80 text-red-600 hover:bg-red-50"
                          title="Remove from institution"
                          aria-label={`Remove ${s.email}`}
                          onClick={async () => {
                            try {
                              await adminApi.removeInstitutionStaff(institutionId, s.clerkId);
                              await onReload();
                              toast.success("Staff removed");
                            } catch (err: unknown) {
                              toast.error(
                                (err as { response?: { data?: { message?: string } } })?.response
                                  ?.data?.message || "Remove failed",
                              );
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </InstituteTableShell>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-border/80 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Invite team member</DialogTitle>
            <DialogDescription>
              They must sign in with this email to accept institution access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <FormField label="Email" htmlFor="staff-email" required>
              <Input
                id="staff-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-11 border-border shadow-sm"
                placeholder="colleague@college.edu"
              />
            </FormField>
            <FormField label="Role" htmlFor="staff-role">
              <select
                id="staff-role"
                className="app-control h-11 w-full rounded-lg border-border shadow-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {STAFF_ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              className={instituteSecondaryClass}
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className={cn(institutePrimaryClass, "gap-2")}
              disabled={inviteSubmitting || !inviteEmail.trim()}
              onClick={() => void handleInviteStaff()}
            >
              {inviteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
