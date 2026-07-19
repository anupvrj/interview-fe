"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appCard } from "@/lib/app-theme";
import { isPlatformAdmin } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { ChannelConfigCard } from "@/components/notifications/ChannelConfigCard";
import { EmailDesignSystemCard } from "@/components/notifications/EmailDesignSystemCard";
import { TemplateTable } from "@/components/notifications/TemplateTable";
import { TemplateEditorDialog } from "@/components/notifications/TemplateEditorDialog";
import {
  userApi,
  notificationAdminApi,
  type NotificationChannelKey,
  type NotificationConfig,
  type NotificationTemplate,
} from "@/lib/api";

const CHANNEL_TABS: {
  key: NotificationChannelKey;
  label: string;
  icon: typeof Mail;
  available: boolean;
}[] = [
  { key: "email", label: "Email", icon: Mail, available: true },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, available: false },
];

export default function NotificationHubPage() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [channel, setChannel] = useState<NotificationChannelKey>("email");

  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingEditor, setSavingEditor] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const p = await userApi.getMyProfile();
        if (!isPlatformAdmin(p.accessRole ?? null)) {
          router.replace("/dashboard");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/dashboard");
      }
    })();
  }, [isLoaded, router]);

  const load = async (activeChannel: NotificationChannelKey) => {
    setLoading(true);
    try {
      const [cfg, tpls] = await Promise.all([
        notificationAdminApi.getConfig(),
        notificationAdminApi.listTemplates(activeChannel),
      ]);
      setConfig(cfg);
      setTemplates(tpls);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load Notification Hub");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) void load(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, channel]);

  const toggleActive = async (
    template: NotificationTemplate,
    next: boolean,
  ) => {
    setSavingId(template._id);
    try {
      const updated = await notificationAdminApi.updateTemplate(template._id, {
        isActive: next,
      });
      setTemplates((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t)),
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update template");
    } finally {
      setSavingId(null);
    }
  };

  const openEditor = (template: NotificationTemplate) => {
    setEditing(template);
    setEditorOpen(true);
  };

  const saveEditor = async (input: {
    name: string;
    subject: string;
    content: string;
    isActive: boolean;
    emailTheme?: NotificationTemplate["emailTheme"];
    useCustomEmailTheme?: boolean;
  }) => {
    if (!editing) return;
    setSavingEditor(true);
    try {
      const updated = await notificationAdminApi.updateTemplate(
        editing._id,
        input,
      );
      setTemplates((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t)),
      );
      toast.success("Template saved");
      setEditorOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save template");
    } finally {
      setSavingEditor(false);
    }
  };

  if (!authorized) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  const activeTab = CHANNEL_TABS.find((t) => t.key === channel);

  const renderBody = () => {
    if (activeTab && !activeTab.available) {
      return (
        <div
          className={cn(
            appCard,
            "flex h-64 flex-col items-center justify-center gap-2 text-center",
          )}
        >
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {activeTab.label} channel coming soon
          </p>
          <p className="max-w-md text-xs text-muted-foreground">
            The platform is channel-agnostic. When the {activeTab.label} channel
            is enabled, its templates and routing will appear here — no changes
            to producers required.
          </p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className={cn(appCard, "flex h-64 items-center justify-center")}>
          <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
        </div>
      );
    }

    return (
      <>
        <ChannelConfigCard
          channel={channel}
          config={config}
          onConfigChange={setConfig}
        />

        {channel === "email" && (
          <EmailDesignSystemCard config={config} onConfigChange={setConfig} />
        )}

        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
          <CardHeader className="border-b border-border/60 px-5 py-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Templates
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              {templates.length} template(s) for the {channel} channel. Toggle
              delivery or edit content with a live preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <TemplateTable
              templates={templates}
              savingId={savingId}
              onEdit={openEditor}
              onToggleActive={(t, next) => void toggleActive(t, next)}
            />
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Hub"
        badge="Notifications"
        description="Manage event-driven notification templates and routing across channels. Toggle templates, edit content with live preview, and configure recipients — all without a code deploy."
      />

      {/* Channel tabs */}
      <div className="flex flex-wrap gap-2">
        {CHANNEL_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === channel;
          return (
            <button
              key={tab.key}
              type="button"
              disabled={!tab.available}
              onClick={() => tab.available && setChannel(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-[#7367F0] bg-[#7367F0]/10 text-[#7367F0]"
                  : "border-border/60 text-muted-foreground hover:bg-muted",
                !tab.available && "cursor-not-allowed opacity-60",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {!tab.available && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {renderBody()}

      <TemplateEditorDialog
        open={editorOpen}
        template={editing}
        globalConfig={config}
        saving={savingEditor}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSave={(input) => void saveEditor(input)}
      />
    </div>
  );
}
