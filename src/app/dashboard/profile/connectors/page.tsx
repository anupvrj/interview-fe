"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Copy,
  KeyRound,
  Link2,
  Loader2,
  Plug,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectorApi, type ConnectorTokenRow } from "@/lib/api";
import {
  appBadgeNeutral,
  appCard,
  appOutlineButton,
  appPrimaryButton,
} from "@/lib/app-theme";
import { cn, formatDate } from "@/lib/utils";

const fieldLabelClass = "block text-sm font-medium text-foreground";
const fieldHintClass = "text-xs leading-relaxed text-muted-foreground";
const sectionEyebrowClass =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

function defaultMcpUrl() {
  if (typeof window === "undefined") return "https://mcp.interviewtrix.com/mcp";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:5004/mcp";
  }
  return "https://mcp.interviewtrix.com/mcp";
}

function defaultOpenApiUrl() {
  const mcp = defaultMcpUrl();
  if (mcp.startsWith("http://localhost:5004")) {
    return "http://localhost:5004/api/connector/v1/openapi.json";
  }
  return "https://mcp.interviewtrix.com/api/connector/v1/openapi.json";
}

export default function ConnectorSettingsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [tokens, setTokens] = useState<ConnectorTokenRow[]>([]);
  const [mcpUrl, setMcpUrl] = useState("https://mcp.interviewtrix.com/mcp");
  const [openapiUrl, setOpenapiUrl] = useState(
    "https://mcp.interviewtrix.com/api/connector/v1/openapi.json",
  );
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    setMcpUrl(defaultMcpUrl());
    setOpenapiUrl(defaultOpenApiUrl());
  }, []);

  const load = useCallback(async () => {
    const result = await connectorApi.listTokens();
    setTokens(result.data || []);
    if (result.mcp_url) setMcpUrl(result.mcp_url);
    if (result.openapi_url) setOpenapiUrl(result.openapi_url);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    load()
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Could not load your tokens");
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, load]);

  async function handleCreate() {
    setCreating(true);
    try {
      const result = await connectorApi.createToken(name.trim() || undefined);
      setSecret(result.data.token);
      if (result.data.mcp_url) setMcpUrl(result.data.mcp_url);
      if (result.data.openapi_url) setOpenapiUrl(result.data.openapi_url);
      toast.success("Token created. Copy it now — it will not be shown again.");
      setName("");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not create token");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    try {
      await connectorApi.revokeToken(tokenId);
      toast.success("Token revoked");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not revoke token");
    }
  }

  function copy(value: string, copiedLabel: string) {
    void navigator.clipboard.writeText(value);
    toast.success(`${copiedLabel} copied`);
  }

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="container mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            <Plug className="size-6 shrink-0 text-[#7367F0]" />
            AI connectors
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Let ChatGPT, Claude, Gemini, or Cursor import your resumes and start
            mock interviews as you. Generate a token, paste it into the AI app,
            then take the interview on Interview Trix.
          </p>
        </header>

        <div className={cn(appCard, "space-y-5 p-4 sm:p-6")}>
          <div className="space-y-1">
            <p className={sectionEyebrowClass}>Connection</p>
            <h2 className="text-base font-semibold sm:text-lg">Server URLs</h2>
            <p className={fieldHintClass}>
              Copy the URL that matches the app you are connecting. You will
              also need an access token from the section below.
            </p>
          </div>
          <div className="space-y-4">
            <UrlRow
              label="MCP server URL"
              hint="Use this in ChatGPT, Claude, and Cursor (remote MCP / plugin)."
              value={mcpUrl}
              copyLabel="MCP server URL"
              onCopy={copy}
            />
            <UrlRow
              label="OpenAPI schema URL"
              hint="Use this in ChatGPT Custom GPT Actions and Gemini Gems."
              value={openapiUrl}
              copyLabel="OpenAPI schema URL"
              onCopy={copy}
            />
          </div>
        </div>

        <div className={cn(appCard, "space-y-5 p-4 sm:p-6")}>
          <div className="space-y-1">
            <p className={sectionEyebrowClass}>Setup</p>
            <h2 className="text-base font-semibold sm:text-lg">
              How to connect
            </h2>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            <SetupStep
              step="1"
              title="ChatGPT, Claude, Cursor"
              body="Add a remote MCP server with the MCP server URL. Auth header: Authorization, value Bearer plus your token."
            />
            <SetupStep
              step="2"
              title="ChatGPT Custom GPT"
              body="Import the OpenAPI schema URL as an Action. Auth type: API Key. Header: Authorization. Value: Bearer plus your token."
            />
            <SetupStep
              step="3"
              title="Gemini Gems"
              body="Import the same OpenAPI schema URL and use Bearer plus your token as the API key."
            />
          </ol>
        </div>

        <div className={cn(appCard, "space-y-5 p-4 sm:p-6")}>
          <div className="space-y-1">
            <p className={sectionEyebrowClass}>Access</p>
            <h2 className="text-base font-semibold sm:text-lg">
              Create an access token
            </h2>
            <p className={fieldHintClass}>
              Each AI app should get its own token. You can revoke a token at
              any time without affecting the others.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="token-name" className={fieldLabelClass}>
              Token name
            </Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                id="token-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ChatGPT on my laptop"
                autoComplete="off"
                className="h-11 min-w-0 flex-1"
              />
              <Button
                className={cn(appPrimaryButton, "h-11 w-full shrink-0 sm:w-auto")}
                onClick={() => void handleCreate()}
                disabled={creating || loading}
              >
                {creating ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Generate token
              </Button>
            </div>
            <p className={fieldHintClass}>
              A name you will recognize later. This is not the secret itself.
            </p>
          </div>
          {secret ? (
            <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-foreground">
                Copy this access token now
              </p>
              <p className={fieldHintClass}>
                Interview Trix will not show the full token again. Store it in
                the AI app, then treat it like a password.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-background px-3 py-2.5 text-xs sm:text-sm">
                  {secret}
                </code>
                <Button
                  variant="outline"
                  className={cn(appOutlineButton, "h-11 shrink-0")}
                  onClick={() => copy(secret, "Access token")}
                >
                  <Copy />
                  Copy token
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className={cn(appCard, "space-y-5 p-4 sm:p-6")}>
          <div className="space-y-1">
            <p className={sectionEyebrowClass}>Manage</p>
            <h2 className="text-base font-semibold sm:text-lg">Your tokens</h2>
          </div>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" /> Loading tokens…
            </p>
          ) : tokens.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
              <Sparkles className="mx-auto mb-3 size-6 text-[#7367F0]" />
              <p className="text-sm font-medium">No tokens yet</p>
              <p className={cn(fieldHintClass, "mx-auto mt-1 max-w-sm")}>
                Generate a token above, then paste it into ChatGPT, Claude,
                Cursor, or Gemini.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tokens.map((token) => {
                const usedLabel = token.lastUsedAt
                  ? `Last used ${formatDate(token.lastUsedAt)}`
                  : "Not used yet";
                return (
                <li
                  key={token.tokenId}
                  className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{token.name}</p>
                      <span className={appBadgeNeutral}>
                        {token.prefix === "itx_live_" ? "Live" : "Test"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(token.createdAt)} · {usedLabel}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className={cn(appOutlineButton, "h-11 w-full sm:w-auto")}
                    onClick={() => void handleRevoke(token.tokenId)}
                  >
                    <Trash2 />
                    Revoke token
                  </Button>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function UrlRow({
  label,
  hint,
  value,
  copyLabel,
  onCopy,
}: {
  label: string;
  hint: string;
  value: string;
  copyLabel: string;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className={fieldLabelClass}>{label}</p>
        <p className={fieldHintClass}>{hint}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-start gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5">
          <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <code className="min-w-0 flex-1 break-all text-xs sm:text-sm">
            {value}
          </code>
        </div>
        <Button
          variant="outline"
          className={cn(appOutlineButton, "h-11 shrink-0")}
          onClick={() => onCopy(value, copyLabel)}
        >
          <Copy />
          Copy URL
        </Button>
      </div>
    </div>
  );
}

function SetupStep({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7367F0]/10 text-xs font-semibold text-[#7367F0]">
        {step}
      </span>
      <p className="text-sm font-medium leading-snug">{title}</p>
      <p className={fieldHintClass}>{body}</p>
    </li>
  );
}
