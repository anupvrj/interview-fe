"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { userApi, adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  InstituteEmptyState,
  InstituteTableShell,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { InstituteSettingsHero } from "@/components/institute/InstituteSettingsHero";
import { FormField } from "@/components/app/FormField";

const instituteCardClass =
  "overflow-hidden rounded-xl border border-border/60 bg-card shadow-card";

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

export default function InstituteSettingsPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [staff, setStaff] = useState<
    Array<{ clerkId: string; name: string; email: string; accessRole: string }>
  >([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("institution_moderator");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const isAdmin =
    profile?.accessRole === "institution_admin" ||
    profile?.accessRole === "super_admin";

  const loadStaff = async () => {
    const rows = await adminApi.listInstitutionStaff(institutionId);
    setStaff(rows);
  };

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    adminApi
      .getInstitutionDashboard(institutionId)
      .then(async (d) => {
        const inst = d.institution as {
          name?: string;
          slug?: string;
          domain?: string | null;
          contactEmail?: string | null;
        };
        setName(inst.name ?? "");
        setSlug(inst.slug ?? "");
        setDomain(inst.domain ?? "");
        setContactEmail(inst.contactEmail ?? "");
        if (isAdmin) await loadStaff();
      })
      .catch(() => toast.error("Failed to load institution"))
      .finally(() => setLoading(false));
  }, [profile, institutionId, isAdmin]);

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
      await loadStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invite failed");
    } finally {
      setInviteSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="h-[8.5rem] animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <InstituteSettingsHero
        institutionName={name}
        staffCount={isAdmin ? staff.length : undefined}
        isAdmin={isAdmin}
        loading={loading}
      />

      <Card className={instituteCardClass}>
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground">
              Institution profile
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Name, slug, domain, and contact email are managed by a super admin.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-9 w-9 animate-spin text-[#7367F0]" />
            </div>
          ) : (
            <dl className="grid max-w-2xl gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-foreground">Name</dt>
                <dd className="mt-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                  {name.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-foreground">Slug</dt>
                <dd className="mt-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                  {slug.trim() || "—"}
                </dd>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Used in URLs — lowercase, hyphens only
                </p>
              </div>
              <div>
                <dt className="text-sm font-medium text-foreground">Custom domain</dt>
                <dd className="mt-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                  {domain.trim() || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-foreground">Contact email</dt>
                <dd className="mt-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                  {contactEmail.trim() || "—"}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card className={instituteCardClass}>
          <CardHeader className="border-b border-border/60 px-5 py-4">
            <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
              <div className="min-w-0">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Team &amp; roles
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Invite interview managers and moderators with scoped permissions.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className={cn(institutePrimaryClass, "h-10 shrink-0 gap-2")}
                onClick={() => setInviteOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Invite member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {staff.length === 0 ? (
              <div className="px-4 py-6 sm:px-6">
                <InstituteEmptyState
                  icon={UserPlus}
                  title="No team members yet"
                  description="Invite colleagues as admins, interview managers, or moderators."
                  action={
                    <Button
                      size="sm"
                      className={cn(institutePrimaryClass, "gap-2")}
                      onClick={() => setInviteOpen(true)}
                    >
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
                              <p className="truncate font-semibold text-foreground">
                                {s.name || "—"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <select
                            className={cn(
                              "app-control h-10 max-w-[220px] rounded-lg border-border text-sm shadow-sm",
                            )}
                            value={s.accessRole}
                            aria-label={`Role for ${s.email}`}
                            onChange={async (e) => {
                              try {
                                await adminApi.updateInstitutionStaffRole(
                                  institutionId,
                                  s.clerkId,
                                  e.target.value,
                                );
                                await loadStaff();
                                toast.success("Role updated");
                              } catch (err: any) {
                                toast.error(err?.response?.data?.message || "Update failed");
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
                                await adminApi.removeInstitutionStaff(
                                  institutionId,
                                  s.clerkId,
                                );
                                await loadStaff();
                                toast.success("Staff removed");
                              } catch (err: any) {
                                toast.error(err?.response?.data?.message || "Remove failed");
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
      ) : null}

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
              {inviteSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
