"use client";

import { useEffect, useState } from "react";
import { Loader2, Palette, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmailThemeControls } from "@/components/notifications/EmailThemeControls";
import {
  DEFAULT_EMAIL_THEME,
  mergeEmailTheme,
  type EmailThemeSettings,
} from "@/lib/notifications/email-theme";
import { notificationAdminApi, type NotificationConfig } from "@/lib/api";

interface EmailDesignSystemCardProps {
  config: NotificationConfig | null;
  onConfigChange: (config: NotificationConfig) => void;
}

export function EmailDesignSystemCard({
  config,
  onConfigChange,
}: EmailDesignSystemCardProps) {
  const [theme, setTheme] = useState<EmailThemeSettings>(() =>
    mergeEmailTheme(config?.emailTheme),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTheme(mergeEmailTheme(config?.emailTheme));
  }, [config?.emailTheme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await notificationAdminApi.updateConfig({ emailTheme: theme });
      onConfigChange(updated);
      setTheme(mergeEmailTheme(updated.emailTheme));
      toast.success("Global email design saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save email design");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Palette className="h-5 w-5 text-[#7367F0]" />
              Email design system
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-sm">
              Global typography, colors, and mobile layout rules applied to all
              outgoing emails. Override per template in the template builder.
            </CardDescription>
          </div>
          <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save global design
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <EmailThemeControls
          theme={theme}
          onChange={setTheme}
          disabled={saving}
        />
        <p className="mt-4 text-xs text-muted-foreground">
          Defaults: H1 {DEFAULT_EMAIL_THEME.h1FontSize}px · body{" "}
          {DEFAULT_EMAIL_THEME.bodyFontSize}px · desktop width{" "}
          {DEFAULT_EMAIL_THEME.desktopMaxWidth}px
        </p>
      </CardContent>
    </Card>
  );
}
