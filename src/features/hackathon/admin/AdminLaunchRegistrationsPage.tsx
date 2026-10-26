"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hackathonAdminApi, toHackathonError, type AdminLaunchRegistrationRow } from "../api";
import { formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { HackathonAdminField, hackathonAdminControlClass } from "./HackathonAdminField";
import { HackathonAdminShell } from "./HackathonAdminShell";
import {
  launchAttendedLabel,
  launchProfessionLabel,
  launchReadyLabel,
  launchWhyAttendLabel,
} from "./launchRegistrationLabels";
import { LAUNCH_EVENT_FORM } from "@/lib/hackathon-2026-content";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminLaunchRegistrationsPage({ hackathonId }: Readonly<{ hackathonId: string }>) {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hackathon = useQuery({
    queryKey: hackathonKeys.adminOne(hackathonId),
    queryFn: () => hackathonAdminApi.get(hackathonId),
  });

  const list = useQuery({
    queryKey: ["admin", "hackathons", hackathonId, "launch-registrations", { q, page }],
    queryFn: () =>
      hackathonAdminApi.launchRegistrations(hackathonId, {
        q: q || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const exportCsv = useMutation({
    mutationFn: () => hackathonAdminApi.exportLaunchRegistrationsCsv(hackathonId),
    onSuccess: (blob) => {
      const slug = hackathon.data?.slug ?? "hackathon";
      downloadBlob(blob, `${slug}-launch-event.csv`);
      toast.success("Launch event CSV downloaded");
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <HackathonAdminShell
      hackathonId={hackathonId}
      activeTab="launch_event"
      headerExtra={
        <Button variant="outline" size="sm" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending}>
          {exportCsv.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Export CSV
        </Button>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Registrations for the <strong className="font-medium text-foreground">31 Oct live event</strong> (
          {LAUNCH_EVENT_FORM.title}). Separate from hackathon participant sign-ups.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <HackathonAdminField id="hk-launch-search" label="Search" className="min-w-[200px] flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hk-launch-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email, or phone"
                className={cn(hackathonAdminControlClass, "pl-9")}
              />
            </div>
          </HackathonAdminField>
          <p className="text-sm tabular-nums text-muted-foreground sm:pb-2">
            {hackathon.data?.launchRegistrationCount ?? total} total RSVPs
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {list.isLoading ? (
              <div className="flex items-center gap-2 p-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading launch registrations…
              </div>
            ) : list.isError ? (
              <p className="p-6 text-sm text-destructive">{toHackathonError(list.error).message}</p>
            ) : (list.data?.rows.length ?? 0) === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No launch event registrations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Profession</TableHead>
                      <TableHead className="min-w-[200px]">Why attend</TableHead>
                      <TableHead>AI interview before?</TableHead>
                      <TableHead>Ready for AI interview?</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.data!.rows.map((row: AdminLaunchRegistrationRow) => (
                      <TableRow key={row.registrationId}>
                        <TableCell className="min-w-[140px] font-medium">{row.name}</TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums text-sm">
                          {row.phone ? (
                            <a href={`tel:${row.phone.replace(/\s+/g, "")}`} className="hover:underline">
                              {row.phone}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="min-w-[180px] text-sm">{row.email}</TableCell>
                        <TableCell className="text-sm">{launchProfessionLabel(row.profession)}</TableCell>
                        <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                          {launchWhyAttendLabel(row.whyAttend)}
                        </TableCell>
                        <TableCell className="text-sm">{launchAttendedLabel(row.attended)}</TableCell>
                        <TableCell className="text-sm">{launchReadyLabel(row.ready)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatIst(row.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {total > PAGE_SIZE ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {pages} · {total} registrations
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </HackathonAdminShell>
  );
}
