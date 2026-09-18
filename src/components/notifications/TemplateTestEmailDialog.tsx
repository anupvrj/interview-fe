"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  notificationAdminApi,
  type NotificationTemplate,
} from "@/lib/api";
import type { EmailThemeSettings } from "@/lib/notifications/email-theme";

interface TemplateTestEmailDialogProps {
  open: boolean;
  template: NotificationTemplate | null;
  subject: string;
  content: string;
  variables: Record<string, string>;
  emailTheme: EmailThemeSettings;
  useCustomEmailTheme: boolean;
  defaultRecipient?: string;
  onClose: () => void;
}

export function TemplateTestEmailDialog({
  open,
  template,
  subject,
  content,
  variables,
  emailTheme,
  useCustomEmailTheme,
  defaultRecipient = "",
  onClose,
}: TemplateTestEmailDialogProps) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setRecipient(defaultRecipient);
  }, [open, defaultRecipient]);

  const handleSend = async () => {
    if (!template) return;
    const to = recipient.trim();
    if (!to) {
      toast.error("Enter a recipient email");
      return;
    }

    setSending(true);
    try {
      const result = await notificationAdminApi.sendTestTemplate(
        template._id,
        {
          to,
          subject,
          content,
          variables,
          emailTheme: useCustomEmailTheme ? emailTheme : undefined,
          useCustomEmailTheme,
        },
      );
      toast.success(`Test email sent to ${result.sentTo}`);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send test email — check SES configuration";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  if (!template) return null;

  const variableCount = template.expectedVariables.length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#7367F0]" />
            Send test email
          </DialogTitle>
          <DialogDescription>
            Sends the current template with your preview sample data
            {variableCount > 0
              ? ` (${variableCount} variable${variableCount === 1 ? "" : "s"})`
              : ""}
            . Unsaved HTML and style changes are included. Subject is prefixed
            with <code className="text-xs">[Interview Trix Test]</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          <Label htmlFor="test-recipient">Recipient email</Label>
          <Input
            id="test-recipient"
            type="email"
            placeholder="you@company.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            autoComplete="email"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={sending}
            onClick={() => void handleSend()}
          >
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send test email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
