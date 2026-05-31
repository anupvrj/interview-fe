"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminApi,
  type PeerInterviewBooking,
  type PeerInterviewer,
  type PeerInterviewerSlot,
} from "@/lib/api";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const INTERVIEWER_FORM_LABEL =
  "text-sm font-medium text-muted-foreground leading-snug shrink-0";
const INTERVIEWER_FORM_ROW =
  "grid grid-cols-[11rem_minmax(0,1fr)] items-center gap-x-5 gap-y-0";
const INTERVIEWER_FORM_ROW_TOP =
  "grid grid-cols-[11rem_minmax(0,1fr)] items-start gap-x-5 gap-y-0";
const INTERVIEWER_FORM_INPUT = "h-9 w-full";

function InterviewerFormField({
  id,
  label,
  multilineLabel,
  children,
}: {
  id: string;
  label: string;
  multilineLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={multilineLabel ? INTERVIEWER_FORM_ROW_TOP : INTERVIEWER_FORM_ROW}>
      <Label htmlFor={id} className={INTERVIEWER_FORM_LABEL}>
        {label}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function PeerInterviewAdminPanel() {
  const [interviewers, setInterviewers] = useState<PeerInterviewer[]>([]);
  const [bookings, setBookings] = useState<PeerInterviewBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [ivOpen, setIvOpen] = useState(false);
  const [editingIv, setEditingIv] = useState<PeerInterviewer | null>(null);
  const [slotIvId, setSlotIvId] = useState<string | null>(null);
  const [slots, setSlots] = useState<PeerInterviewerSlot[]>([]);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [assignIvId, setAssignIvId] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    totalExperienceYears: 0,
    currentCompany: "",
    profileImageUrl: "",
    industries: "",
    targetRoles: "",
    timezone: "Asia/Kolkata",
    isActive: true,
  });

  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 1,
    specificDate: "",
    startTime: "16:00",
    endTime: "17:00",
    durationMinutes: 60,
    useSpecificDate: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ivs, bks] = await Promise.all([
        adminApi.listPeerInterviewers(),
        adminApi.listPeerBookings(),
      ]);
      setInterviewers(ivs);
      setBookings(bks);
    } catch {
      toast.error("Failed to load peer interview data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateIv = () => {
    setEditingIv(null);
    setForm({
      name: "",
      email: "",
      role: "",
      totalExperienceYears: 0,
      currentCompany: "",
      profileImageUrl: "",
      industries: "",
      targetRoles: "",
      timezone: "Asia/Kolkata",
      isActive: true,
    });
    setIvOpen(true);
  };

  const openEditIv = (iv: PeerInterviewer) => {
    setEditingIv(iv);
    setForm({
      name: iv.name,
      email: iv.email,
      role: iv.role,
      totalExperienceYears: iv.totalExperienceYears,
      currentCompany: iv.currentCompany,
      profileImageUrl: iv.profileImageUrl || "",
      industries: (iv.industries || []).join(", "),
      targetRoles: (iv.targetRoles || []).join(", "),
      timezone: iv.timezone,
      isActive: iv.isActive,
    });
    setIvOpen(true);
  };

  const saveIv = async () => {
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      totalExperienceYears: Number(form.totalExperienceYears),
      currentCompany: form.currentCompany,
      profileImageUrl: form.profileImageUrl || undefined,
      industries: form.industries.split(",").map((s) => s.trim()).filter(Boolean),
      targetRoles: form.targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
      timezone: form.timezone,
      isActive: form.isActive,
    };
    try {
      if (editingIv) {
        await adminApi.updatePeerInterviewer(editingIv._id, payload);
        toast.success("Interviewer updated");
      } else {
        await adminApi.createPeerInterviewer(payload);
        toast.success("Interviewer created");
      }
      setIvOpen(false);
      await load();
    } catch {
      toast.error("Save failed");
    }
  };

  const deleteIv = async (id: string) => {
    if (!confirm("Delete interviewer and all slots?")) return;
    try {
      await adminApi.deletePeerInterviewer(id);
      toast.success("Deleted");
      await load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const openSlots = async (id: string) => {
    setSlotIvId(id);
    try {
      const s = await adminApi.listPeerInterviewerSlots(id);
      setSlots(s);
    } catch {
      toast.error("Could not load slots");
      setSlots([]);
    }
  };

  const addSlot = async () => {
    if (!slotIvId) return;
    try {
      await adminApi.createPeerInterviewerSlot(slotIvId, {
        dayOfWeek: slotForm.useSpecificDate ? undefined : slotForm.dayOfWeek,
        specificDate: slotForm.useSpecificDate ? slotForm.specificDate : undefined,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        durationMinutes: slotForm.durationMinutes,
        isActive: true,
      });
      toast.success("Slot added");
      setSlots(await adminApi.listPeerInterviewerSlots(slotIvId));
    } catch {
      toast.error("Could not add slot");
    }
  };

  const deleteSlot = async (slotId: string) => {
    if (!slotIvId) return;
    try {
      await adminApi.deletePeerInterviewerSlot(slotIvId, slotId);
      setSlots(await adminApi.listPeerInterviewerSlots(slotIvId));
    } catch {
      toast.error("Could not delete slot");
    }
  };

  const assignBooking = async (bookingId: string) => {
    if (!assignIvId) return;
    try {
      await adminApi.assignPeerBooking(bookingId, assignIvId);
      toast.success("Assigned and confirmed");
      setAssignOpen(null);
      await load();
    } catch {
      toast.error("Assign failed");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === "pending_assignment");

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Peer interviewers</CardTitle>
            <CardDescription>Profiles and availability for booking</CardDescription>
          </div>
          <Button className={institutePrimaryClass} size="sm" onClick={openCreateIv}>
            <Plus className="mr-1 h-4 w-4" />
            Add interviewer
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>TZ</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviewers.map((iv) => (
                <TableRow key={iv._id}>
                  <TableCell>{iv.name}</TableCell>
                  <TableCell>{iv.role}</TableCell>
                  <TableCell>{iv.currentCompany}</TableCell>
                  <TableCell className="text-xs">{iv.timezone}</TableCell>
                  <TableCell>{iv.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openSlots(iv._id)}>
                      Slots
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditIv(iv)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteIv(iv._id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {slotIvId ? (
        <Card>
          <CardHeader>
            <CardTitle>Availability slots</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setSlotIvId(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={slotForm.useSpecificDate}
                  onChange={(e) =>
                    setSlotForm((f) => ({ ...f, useSpecificDate: e.target.checked }))
                  }
                />
                One-off date
              </label>
              {slotForm.useSpecificDate ? (
                <Input
                  type="date"
                  value={slotForm.specificDate}
                  onChange={(e) =>
                    setSlotForm((f) => ({ ...f, specificDate: e.target.value }))
                  }
                />
              ) : (
                <select
                  className="h-10 rounded-md border px-2 text-sm"
                  value={slotForm.dayOfWeek}
                  onChange={(e) =>
                    setSlotForm((f) => ({
                      ...f,
                      dayOfWeek: Number(e.target.value),
                    }))
                  }
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
              <Input
                placeholder="Start HH:mm"
                value={slotForm.startTime}
                onChange={(e) =>
                  setSlotForm((f) => ({ ...f, startTime: e.target.value }))
                }
              />
              <Input
                placeholder="End HH:mm"
                value={slotForm.endTime}
                onChange={(e) =>
                  setSlotForm((f) => ({ ...f, endTime: e.target.value }))
                }
              />
            </div>
            <Button size="sm" onClick={addSlot}>
              Add slot
            </Button>
            <ul className="text-sm space-y-1">
              {slots.map((s) => (
                <li key={s._id} className="flex justify-between border-b py-2">
                  <span>
                    {s.specificDate
                      ? s.specificDate
                      : DAYS[s.dayOfWeek ?? 0]}{" "}
                    {s.startTime}–{s.endTime} ({s.durationMinutes}m)
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => deleteSlot(s._id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            {pending.length} pending assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Target role</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.bookingId}>
                  <TableCell className="text-xs">{b.candidateClerkId}</TableCell>
                  <TableCell>{b.targetJobRole}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(b.scheduledAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{b.status}</TableCell>
                  <TableCell className="text-right">
                    {b.status === "pending_assignment" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssignOpen(b.bookingId);
                          setAssignIvId("");
                        }}
                      >
                        Assign
                      </Button>
                    ) : b.meetLink ? (
                      <a
                        href={b.meetLink}
                        className="text-xs text-primary underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Meet
                      </a>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={ivOpen} onOpenChange={setIvOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIv ? "Edit interviewer" : "New interviewer"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-1">
            <InterviewerFormField id="iv-name" label="Name">
              <Input
                id="iv-name"
                className={INTERVIEWER_FORM_INPUT}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </InterviewerFormField>
            <InterviewerFormField id="iv-email" label="Email">
              <Input
                id="iv-email"
                type="email"
                className={INTERVIEWER_FORM_INPUT}
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </InterviewerFormField>
            <InterviewerFormField id="iv-role" label="Role">
              <Input
                id="iv-role"
                className={INTERVIEWER_FORM_INPUT}
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
              />
            </InterviewerFormField>
            <InterviewerFormField id="iv-exp" label="Years experience">
              <Input
                id="iv-exp"
                type="number"
                min={0}
                className={INTERVIEWER_FORM_INPUT}
                value={form.totalExperienceYears}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    totalExperienceYears: Number(e.target.value),
                  }))
                }
              />
            </InterviewerFormField>
            <InterviewerFormField id="iv-company" label="Current company">
              <Input
                id="iv-company"
                className={INTERVIEWER_FORM_INPUT}
                value={form.currentCompany}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentCompany: e.target.value }))
                }
              />
            </InterviewerFormField>
            <InterviewerFormField id="iv-photo" label="Profile image URL">
              <Input
                id="iv-photo"
                className={INTERVIEWER_FORM_INPUT}
                value={form.profileImageUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, profileImageUrl: e.target.value }))
                }
              />
            </InterviewerFormField>
            <InterviewerFormField
              id="iv-industries"
              label="Industries (comma-separated)"
              multilineLabel
            >
              <Input
                id="iv-industries"
                className={INTERVIEWER_FORM_INPUT}
                placeholder="e.g. FinTech, SaaS"
                value={form.industries}
                onChange={(e) =>
                  setForm((f) => ({ ...f, industries: e.target.value }))
                }
              />
            </InterviewerFormField>
            <InterviewerFormField
              id="iv-target-roles"
              label="Target roles (comma-separated)"
              multilineLabel
            >
              <Input
                id="iv-target-roles"
                className={INTERVIEWER_FORM_INPUT}
                placeholder="e.g. SDE, Product Manager"
                value={form.targetRoles}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetRoles: e.target.value }))
                }
              />
            </InterviewerFormField>
            <InterviewerFormField id="iv-timezone" label="Timezone">
              <Input
                id="iv-timezone"
                className={INTERVIEWER_FORM_INPUT}
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
              />
            </InterviewerFormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIvOpen(false)}>
              Cancel
            </Button>
            <Button className={institutePrimaryClass} onClick={saveIv}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign interviewer</DialogTitle>
          </DialogHeader>
          <select
            className="w-full h-10 rounded-md border px-2"
            value={assignIvId}
            onChange={(e) => setAssignIvId(e.target.value)}
          >
            <option value="">Select…</option>
            {interviewers
              .filter((i) => i.isActive)
              .map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name} — {i.role}
                </option>
              ))}
          </select>
          <DialogFooter>
            <Button
              className={institutePrimaryClass}
              disabled={!assignIvId || !assignOpen}
              onClick={() => assignOpen && assignBooking(assignOpen)}
            >
              Confirm assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
