"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { Loader2, Code2, Mail, Palette, RefreshCw, RotateCcw } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  notificationAdminApi,
  type NotificationConfig,
  type NotificationTemplate,
} from "@/lib/api";
import { EmailPreviewFrame } from "@/components/notifications/EmailPreviewFrame";
import { EmailThemeControls } from "@/components/notifications/EmailThemeControls";
import { TemplateTestEmailDialog } from "@/components/notifications/TemplateTestEmailDialog";
import {
  mergeEmailTheme,
  type EmailThemeSettings,
  type PreviewViewport,
} from "@/lib/notifications/email-theme";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-[#7367F0]" />
    </div>
  ),
});

interface TemplateEditorDialogProps {
  open: boolean;
  template: NotificationTemplate | null;
  globalConfig: NotificationConfig | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: {
    name: string;
    subject: string;
    content: string;
    isActive: boolean;
    emailTheme?: Partial<EmailThemeSettings>;
    useCustomEmailTheme?: boolean;
  }) => void;
}

type EditorPanel = "content" | "style";

export function TemplateEditorDialog({
  open,
  template,
  globalConfig,
  saving,
  onClose,
  onSave,
}: TemplateEditorDialogProps) {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [panel, setPanel] = useState<EditorPanel>("content");
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [useCustomEmailTheme, setUseCustomEmailTheme] = useState(false);
  const [emailTheme, setEmailTheme] = useState<EmailThemeSettings>(() =>
    mergeEmailTheme(globalConfig?.emailTheme),
  );
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<
    Record<string, string>
  >({});
  const [sampleVarsLoading, setSampleVarsLoading] = useState(false);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const editorRef = useRef<any>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject ?? "");
      setContent(template.content);
      setIsActive(template.isActive);
      setUseCustomEmailTheme(template.useCustomEmailTheme ?? false);
      setEmailTheme(
        mergeEmailTheme(
          globalConfig?.emailTheme,
          template.emailTheme,
        ),
      );
      setPanel("content");
      setViewport("desktop");
      setPreviewVariables({});
    }
  }, [template, globalConfig?.emailTheme]);

  useEffect(() => {
    if (!open || !template) return;

    let cancelled = false;
    setSampleVarsLoading(true);
    notificationAdminApi
      .getTemplateSampleVariables(template._id)
      .then((data) => {
        if (!cancelled) setPreviewVariables(data);
      })
      .catch(() => {
        if (!cancelled) {
          const fallback: Record<string, string> = {};
          for (const key of template.expectedVariables) {
            fallback[key] = "";
          }
          setPreviewVariables(fallback);
        }
      })
      .finally(() => {
        if (!cancelled) setSampleVarsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, template]);

  const resetPreviewVariables = async () => {
    if (!template) return;
    setSampleVarsLoading(true);
    try {
      const data = await notificationAdminApi.getTemplateSampleVariables(
        template._id,
      );
      setPreviewVariables(data);
    } finally {
      setSampleVarsLoading(false);
    }
  };

  const refreshPreview = useCallback(async () => {
    if (!template) return;
    setPreviewLoading(true);
    try {
      const result = await notificationAdminApi.previewTemplate(template._id, {
        subject,
        content,
        emailTheme: useCustomEmailTheme ? emailTheme : undefined,
        useCustomEmailTheme,
        variables: previewVariables,
      });
      setPreviewHtml(result.html);
      setPreviewSubject(result.subject);
    } catch {
      setPreviewHtml(
        "<p style='padding:24px;font-family:sans-serif;color:#666'>Preview unavailable — check HTML syntax.</p>",
      );
      setPreviewSubject(subject);
    } finally {
      setPreviewLoading(false);
    }
  }, [
    template,
    subject,
    content,
    emailTheme,
    useCustomEmailTheme,
    previewVariables,
  ]);

  useEffect(() => {
    if (!open || !template) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      void refreshPreview();
    }, 450);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [open, template, refreshPreview]);

  const insertVariable = (variable: string) => {
    const token = `{{${variable}}}`;
    const editor = editorRef.current;
    if (editor) {
      const selection = editor.getSelection();
      editor.executeEdits("insert-variable", [
        { range: selection, text: token, forceMoveMarkers: true },
      ]);
      editor.focus();
    } else {
      setContent((c) => c + token);
    }
    void navigator.clipboard?.writeText(token).catch(() => undefined);
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 lg:max-w-7xl">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle>Email template builder — {template.name}</DialogTitle>
          <DialogDescription>
            <code className="text-xs">{template.eventType}</code> · Edit HTML,
            tune typography & layout, preview with sample data, and send test
            emails before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Template name</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-subject">Subject</Label>
              <Input
                id="tpl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>

          {template.expectedVariables.length > 0 && (
            <div className="mb-4 rounded-lg border border-border/60 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Preview & test data — edit values or click to insert in HTML
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => void resetPreviewVariables()}
                  disabled={sampleVarsLoading}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reset defaults
                </Button>
              </div>
              {sampleVarsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#7367F0]" />
                </div>
              ) : (
                <div className="grid max-h-[220px] gap-2 overflow-y-auto sm:grid-cols-2">
                  {template.expectedVariables.map((v) => (
                    <div key={v} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => insertVariable(v)}
                          className="shrink-0 rounded-md bg-[#7367F0]/10 px-2 py-0.5 font-mono text-xs text-[#7367F0] hover:bg-[#7367F0]/20"
                          title="Insert into HTML"
                        >
                          {`{{${v}}}`}
                        </button>
                      </div>
                      <Input
                        value={previewVariables[v] ?? ""}
                        onChange={(e) =>
                          setPreviewVariables((prev) => ({
                            ...prev,
                            [v]: e.target.value,
                          }))
                        }
                        className="h-8 font-mono text-xs"
                        placeholder={`Sample ${v.replace(/_/g, " ")}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="flex min-h-[560px] flex-col gap-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={panel === "content" ? "default" : "outline"}
                  onClick={() => setPanel("content")}
                >
                  <Code2 className="mr-1.5 h-4 w-4" />
                  HTML content
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={panel === "style" ? "default" : "outline"}
                  onClick={() => setPanel("style")}
                >
                  <Palette className="mr-1.5 h-4 w-4" />
                  Style & layout
                </Button>
              </div>

              {panel === "content" ? (
                <div className="min-h-[500px] flex-1 overflow-hidden rounded-lg border border-border/60">
                  <MonacoEditor
                    height="500px"
                    defaultLanguage="html"
                    value={content}
                    onChange={(v) => setContent(v ?? "")}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto rounded-lg border border-border/60 p-4">
                  <label className="mb-4 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useCustomEmailTheme}
                      onChange={(e) => setUseCustomEmailTheme(e.target.checked)}
                      className="h-4 w-4 accent-[#7367F0]"
                    />
                    Override global email design for this template
                  </label>
                  <EmailThemeControls
                    theme={emailTheme}
                    onChange={setEmailTheme}
                    disabled={!useCustomEmailTheme}
                  />
                  {!useCustomEmailTheme && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Using the global design from Email design system. Enable
                      override to customize this template only.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="min-h-[560px]">
              <EmailPreviewFrame
                html={previewHtml}
                subject={previewSubject}
                viewport={viewport}
                onViewportChange={setViewport}
                loading={previewLoading}
                className="h-full min-h-[560px]"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void refreshPreview()}
                  disabled={previewLoading}
                >
                  <RefreshCw className={cn("mr-1.5 h-4 w-4", previewLoading && "animate-spin")} />
                  Refresh preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTestEmailOpen(true)}
                >
                  <Mail className="mr-1.5 h-4 w-4" />
                  Send test email
                </Button>
              </div>
            </div>
          </div>
        </div>

        <TemplateTestEmailDialog
          open={testEmailOpen}
          template={template}
          subject={subject}
          content={content}
          variables={previewVariables}
          emailTheme={emailTheme}
          useCustomEmailTheme={useCustomEmailTheme}
          defaultRecipient={
            user?.primaryEmailAddress?.emailAddress ??
            user?.emailAddresses?.[0]?.emailAddress ??
            ""
          }
          onClose={() => setTestEmailOpen(false)}
        />

        <DialogFooter className="gap-2 border-t border-border/60 px-6 py-4">
          <label className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-[#7367F0]"
            />
            Active
          </label>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              if (!name.trim()) {
                toast.error("Template name is required");
                return;
              }
              onSave({
                name: name.trim(),
                subject,
                content,
                isActive,
                emailTheme: useCustomEmailTheme ? emailTheme : {},
                useCustomEmailTheme,
              });
            }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
