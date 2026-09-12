"use client";

import { useEffect, useState } from "react";
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
import { CalendarClock } from "lucide-react";
import { adminApi } from "@/lib/api";

export function SuperAdminScheduledInterviewsCard() {
  const [schedules, setSchedules] = useState<any[]>([]);

  const loadSchedules = async () => {
    try {
      const s = await adminApi.listInterviewSchedules();
      setSchedules(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    void loadSchedules();
  }, []);

  const upcoming = schedules.filter((s) => s.status === "scheduled");
  if (upcoming.length === 0) return null;

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!confirm("Cancel this scheduled interview?")) return;
    try {
      await adminApi.cancelInterviewSchedule(scheduleId);
      await loadSchedules();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to cancel");
    }
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
      <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CalendarClock className="h-5 w-5" />
          Scheduled interviews
        </CardTitle>
        <CardDescription>
          Platform-wide — candidates see these on their dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-5">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/70 hover:bg-transparent">
                <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  When
                </TableHead>
                <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  Candidate
                </TableHead>
                <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  Role
                </TableHead>
                <TableHead className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(s.scheduledAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-[10rem] max-w-[18rem] flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {s.candidateName?.trim() ? s.candidateName.trim() : "—"}
                      </span>
                      <span className="break-all text-sm text-muted-foreground">
                        {s.candidateEmail?.trim() ? s.candidateEmail.trim() : "—"}
                      </span>
                      {!s.candidateName?.trim() && !s.candidateEmail?.trim() ? (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {s.candidateClerkId}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleCancelSchedule(String(s._id))}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
