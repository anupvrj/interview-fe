"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Users,
  Plus,
  Pencil,
  Trash2,
  Coins,
  Crown,
  FileText,
  Video,
  Search,
  ChevronRight,
} from "lucide-react";
import { userApi, adminApi, User } from "@/lib/api";
import { formatDate, getScoreColor } from "@/lib/utils";

export default function InstitutionAdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Add user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPlan, setAddPlan] = useState<"free" | "premium" | "enterprise">("free");
  const [addInstitutionId, setAddInstitutionId] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Selected user for actions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userInterviews, setUserInterviews] = useState<any[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadProfile();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (profile && (profile.accessRole === "institution_admin" || profile.accessRole === "super_admin")) {
      loadUsers();
      if (profile.accessRole === "super_admin") {
        adminApi.listInstitutions().then(setInstitutions).catch(() => {});
      }
    }
  }, [profile, page, search]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const p = await userApi.getMyProfile();
      setProfile(p);
      if (p.accessRole !== "institution_admin" && p.accessRole !== "super_admin") {
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/dashboard");
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, total: t } = await adminApi.listUsers({
        limit,
        skip: page * limit,
        search: search || undefined,
      });
      setUsers(data);
      setTotal(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!addEmail?.trim()) return;
    const instId =
      profile?.accessRole === "super_admin"
        ? addInstitutionId || undefined
        : profile?.institutionId;
    if (profile?.accessRole === "institution_admin" && !instId) {
      alert("Institution is required");
      return;
    }
    try {
      setAddSubmitting(true);
      const result = await adminApi.addUser(addEmail, addPlan, instId);
      setAddOpen(false);
      setAddEmail("");
      setAddPlan("free");
      setAddInstitutionId("");
      alert(result.message);
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add user");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (
      !confirm(
        `Delete ${u.name} (${u.email})? This will permanently delete the user, their resumes, interviews, reports, and all related data. This cannot be undone.`
      )
    )
      return;
    try {
      await adminApi.deleteUser(u.clerkId);
      loadUsers();
      if (selectedUser?._id === u._id) setSelectedUser(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleAddCredits = async (u: User, amount: number) => {
    try {
      await adminApi.addCredits(u.clerkId, amount, "Admin adjustment");
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add credits");
    }
  };

  const handleUpdatePlan = async (u: User, plan: "free" | "premium" | "enterprise") => {
    try {
      await adminApi.updatePlan(u.clerkId, plan);
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update plan");
    }
  };

  const loadUserInterviews = async (u: User) => {
    setSelectedUser(u);
    setInterviewsLoading(true);
    try {
      const data = await adminApi.getUserInterviews(u.clerkId);
      setUserInterviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewsLoading(false);
    }
  };

  const [reportDialog, setReportDialog] = useState<{ interviewId: string; data: any } | null>(null);

  const openReport = async (interviewId: string) => {
    try {
      const data = await adminApi.getInterviewReport(interviewId);
      setReportDialog({ interviewId, data });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to load report");
    }
  };

  const openVideo = async (interviewId: string) => {
    try {
      const { videoUrl } = await adminApi.getInterviewVideoUrl(interviewId);
      window.open(videoUrl, "_blank");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to load video");
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Institution Admin</h1>
        <p className="text-slate-600 mt-1">
          Manage users, credits, plans, and view reports
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({total})
          </CardTitle>
          <CardDescription>Users in your institution</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          u.subscription?.plan === "enterprise"
                            ? "bg-amber-100 text-amber-800"
                            : u.subscription?.plan === "premium"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.subscription?.plan || "free"}
                      </span>
                    </TableCell>
                    <TableCell>{u.credits?.total ?? 0}</TableCell>
                    <TableCell className="text-slate-600">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUserInterviews(u)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Reports
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCredits(u, 100)}
                      >
                        <Coins className="w-4 h-4" />
                      </Button>
                      <select
                        className="text-xs border rounded px-2 py-1"
                        value={(u as any).subscription?.plan || "free"}
                        onChange={(e) =>
                          handleUpdatePlan(
                            u,
                            e.target.value as "free" | "premium" | "enterprise"
                          )
                        }
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteUser(u)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {total > limit && (
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>
              Interviews & Reports - {selectedUser.name}
            </CardTitle>
            <CardDescription>
              View scores, reports, and recorded videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviewsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="space-y-2">
                {userInterviews.map((inv: any) => (
                  <div
                    key={inv.interviewId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-lg font-bold ${getScoreColor(
                          inv.report?.overallScore ?? 0
                        )}`}
                      >
                        {inv.report?.overallScore ?? "-"}
                      </span>
                      <span className="text-slate-600">
                        {formatDate(inv.createdAt)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReport(inv.interviewId)}
                      >
                        Report
                      </Button>
                      {inv.session?.s3VideoKey && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVideo(inv.interviewId)}
                        >
                          <Video className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {userInterviews.length === 0 && (
                  <p className="text-slate-500">No interviews yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!reportDialog} onOpenChange={() => setReportDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Report</DialogTitle>
          </DialogHeader>
          {reportDialog?.data && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span
                  className={`text-3xl font-bold ${getScoreColor(
                    reportDialog.data.overallScore ?? 0
                  )}`}
                >
                  {reportDialog.data.overallScore ?? "-"}
                </span>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {reportDialog.data.categoryScores &&
                    Object.entries(reportDialog.data.categoryScores).map(
                      ([k, v]: [string, any]) => (
                        <div key={k}>
                          {k}: {v}
                        </div>
                      )
                    )}
                </div>
              </div>
              {reportDialog.data.strengths?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Strengths</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {reportDialog.data.strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {reportDialog.data.improvements?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Improvements</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {reportDialog.data.improvements.map(
                      (s: string, i: number) => (
                        <li key={i}>{s}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Enter email and assign a plan. The user will receive an invitation email to verify and sign up.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                className="w-full mt-2 border rounded px-3 py-2"
                value={addPlan}
                onChange={(e) =>
                  setAddPlan(e.target.value as "free" | "premium" | "enterprise")
                }
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            {profile?.accessRole === "super_admin" && institutions.length > 0 && (
              <div>
                <Label htmlFor="institution">Institution (optional)</Label>
                <select
                  id="institution"
                  className="w-full mt-2 border rounded px-3 py-2"
                  value={addInstitutionId}
                  onChange={(e) => setAddInstitutionId(e.target.value)}
                >
                  <option value="">None</option>
                  {institutions.map((inst) => (
                    <option key={inst._id} value={String(inst._id)}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!addEmail?.trim() || addSubmitting}
            >
              {addSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
