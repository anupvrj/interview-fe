"use client";

import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Toggle } from "./Toggle";
import type { NotificationTemplate } from "@/lib/api";

interface TemplateTableProps {
  templates: NotificationTemplate[];
  savingId: string | null;
  onEdit: (template: NotificationTemplate) => void;
  onToggleActive: (template: NotificationTemplate, next: boolean) => void;
}

export function TemplateTable({
  templates,
  savingId,
  onEdit,
  onToggleActive,
}: TemplateTableProps) {
  if (templates.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No templates found for this channel.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Template</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead className="text-center">Active</TableHead>
          <TableHead className="text-right">Edit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((t) => (
          <TableRow key={t._id}>
            <TableCell className="font-medium text-foreground">
              {t.name}
            </TableCell>
            <TableCell>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {t.eventType}
              </code>
            </TableCell>
            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
              {t.subject || "—"}
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                <Toggle
                  checked={t.isActive}
                  disabled={savingId === t._id}
                  label={`Toggle ${t.name}`}
                  onChange={(next) => onToggleActive(t, next)}
                />
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(t)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
