"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "./Toggle";
import {
  notificationAdminApi,
  type NotificationChannelKey,
  type NotificationConfig,
} from "@/lib/api";

interface ChannelConfigCardProps {
  channel: NotificationChannelKey;
  config: NotificationConfig | null;
  onConfigChange: (config: NotificationConfig) => void;
}

export function ChannelConfigCard({
  channel,
  config,
  onConfigChange,
}: ChannelConfigCardProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmails(config?.adminEmails ?? []);
  }, [config]);

  if (!config) return null;

  const channelOn = config.channelToggles?.[channel] ?? false;

  const persist = async (patch: Parameters<typeof notificationAdminApi.updateConfig>[0]) => {
    setSaving(true);
    try {
      const updated = await notificationAdminApi.updateConfig(patch);
      onConfigChange(updated);
      toast.success("Configuration saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    const value = newEmail.trim().toLowerCase();
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (emails.includes(value)) {
      toast.error("Email already added");
      return;
    }
    const next = [...emails, value];
    setEmails(next);
    setNewEmail("");
    void persist({ adminEmails: next });
  };

  const removeEmail = (email: string) => {
    const next = emails.filter((e) => e !== email);
    setEmails(next);
    void persist({ adminEmails: next });
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Global routing &amp; toggles
        </CardTitle>
        <CardDescription className="mt-1 text-sm">
          Control channel delivery, admin recipients, and specific alert routing.
          Changes apply instantly — no deploy required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-5">
        {/* Channel master toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground capitalize">
              {channel} channel
            </p>
            <p className="text-xs text-muted-foreground">
              Master switch. When off, no {channel} notifications are dispatched.
            </p>
          </div>
          <Toggle
            checked={channelOn}
            disabled={saving}
            label={`Toggle ${channel} channel`}
            onChange={(next) =>
              void persist({ channelToggles: { [channel]: next } as any })
            }
          />
        </div>

        {/* Alert toggles */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Alert routing</p>
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
            <span className="text-sm text-foreground">
              Checkout failure alerts
            </span>
            <Toggle
              checked={config.alertToggles?.checkoutFailures ?? true}
              disabled={saving}
              label="Toggle checkout failure alerts"
              onChange={(next) =>
                void persist({ alertToggles: { checkoutFailures: next } })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
            <span className="text-sm text-foreground">
              Contact / sales form alerts
            </span>
            <Toggle
              checked={config.alertToggles?.contactForm ?? true}
              disabled={saving}
              label="Toggle contact form alerts"
              onChange={(next) =>
                void persist({ alertToggles: { contactForm: next } })
              }
            />
          </div>
        </div>

        {/* Admin recipients */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Admin recipients
          </p>
          <p className="text-xs text-muted-foreground">
            Destinations for admin-facing notifications (new applications,
            contact forms, checkout failures).
          </p>
          <div className="flex flex-wrap gap-2">
            {emails.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No admin recipients configured yet.
              </span>
            )}
            {emails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#7367F0]/10 px-3 py-1 text-xs font-medium text-[#7367F0]"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  disabled={saving}
                  className="rounded-full hover:bg-[#7367F0]/20"
                  aria-label={`Remove ${email}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="admin@interviewtrix.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmail}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
