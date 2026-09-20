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
        <CardTitle className="flex min-w-0 items-start gap-2 text-base sm:items-center sm:text-lg">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" />
          <span className="min-w-0">Scheduled interviews</span>
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed sm:text-sm">
          Platform-wide — candidates see these on their dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 py-0 sm:px-0">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="h-auto border-b border-border/70 bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[1%] whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                  When
                </TableHead>
                <TableHead className="w-[1%] min-w-[12rem] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                  Candidate
                </TableHead>
                <TableHead className="w-[1%] min-w-[10rem] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                  Role
                </TableHead>
                <TableHead className="w-[1%] whitespace-nowrap px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae] sm:px-5">
                  Actions
                </TableHead>
                <TableHead aria-hidden className="w-full p-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((s) => (
                <TableRow key={s._id} className="h-auto">
                  <TableCell className="px-4 py-3 align-top text-sm sm:px-5">
                    <span className="whitespace-nowrap">
                      {new Date(s.scheduledAt).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-0 px-4 py-3 align-top sm:px-5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium text-foreground">
                        {s.candidateName?.trim() ? s.candidateName.trim() : "—"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground sm:text-sm">
                        {s.candidateEmail?.trim() ? s.candidateEmail.trim() : "—"}
                      </span>
                      {!s.candidateName?.trim() && !s.candidateEmail?.trim() ? (
                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                          {s.candidateClerkId}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-0 px-4 py-3 align-top sm:px-5">
                    <span className="whitespace-nowrap">{s.role}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right align-top sm:px-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11 text-red-600"
                      onClick={() => handleCancelSchedule(String(s._id))}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                  <TableCell aria-hidden className="w-full p-0" />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
