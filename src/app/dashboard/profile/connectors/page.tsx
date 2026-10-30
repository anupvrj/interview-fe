"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Copy,
  KeyRound,
  Link2,
  Loader2,
  Plug,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectorApi, type ConnectorTokenRow } from "@/lib/api";
import { Mono } from "@/components/marketing-2026/primitives";
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
import { ListHeader } from "@/components/dashboard-2026/PracticeHero";
import { cn, formatDate } from "@/lib/utils";

const fieldLabelClass = "block text-sm font-medium text-foreground";
const fieldHintClass = "text-[12.5px] leading-relaxed text-muted-foreground";

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

  const lastUsed = tokens
    .map((t) => t.lastUsedAt)
    .filter((d): d is string => Boolean(d))
    .sort((x, y) => +new Date(y) - +new Date(x))[0];

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_10%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_60%_at_95%_30%,rgba(31,143,255,.10),transparent_70%)]" />
        <div className="relative p-6 md:p-9">
          <Eyebrow>AI CONNECTORS</Eyebrow>
          <h1 className="text-balance mt-5 max-w-[22ch] text-[32px] font-black leading-[1.03] tracking-[-0.05em] text-foreground sm:text-[42px] xl:text-[50px]">
            Practise from{" "}
            <span className="bg-gradient-to-r from-[#7367F0] to-[#1F8FFF] bg-clip-text text-transparent">the AI you already use.</span>
          </h1>
          <p className="text-balance mt-4 max-w-[60ch] text-[15.5px] leading-relaxed text-muted-foreground md:text-[17px]">
            Let ChatGPT, Claude, Gemini or Cursor import your resumes and start mock interviews as you. Generate a token, paste it into the AI app, then take the interview on Interview Trix.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["ChatGPT", "Claude", "Gemini", "Cursor"].map((t) => (
              <Mono key={t} className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">{t.toUpperCase()}</Mono>
            ))}
          </div>
        </div>
        <div className="relative grid grid-cols-3 divide-x divide-border border-t border-border">
          {([
            ["Active tokens", loading ? "…" : String(tokens.length), "one per AI app"],
            ["Last used", lastUsed ? formatDate(lastUsed) : "—", lastUsed ? "by any token" : "no calls yet"],
            ["Connection types", "2", "MCP and OpenAPI"],
          ] as const).map(([k, v, d]) => (
            <div key={k} className="min-w-0 px-5 py-4 md:px-6">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <Mono className="mt-1 block truncate text-[20px] tracking-tight text-foreground md:text-[24px]">{v}</Mono>
              <p className="truncate text-[11.5px] text-muted-foreground/80">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section className="overflow-hidden rounded-[22px] border border-border bg-card">
          <ListHeader eyebrow="01 · CONNECTION" title="Server URLs." description="Copy the URL that matches the app you're connecting. You'll also need an access token." />
          <div className="space-y-5 p-5 md:p-6">
            <UrlRow label="MCP server URL" hint="Use this in ChatGPT, Claude and Cursor (remote MCP / plugin)." value={mcpUrl} copyLabel="MCP server URL" onCopy={copy} />
            <UrlRow label="OpenAPI schema URL" hint="Use this in ChatGPT Custom GPT Actions and Gemini Gems." value={openapiUrl} copyLabel="OpenAPI schema URL" onCopy={copy} />
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-border bg-card">
          <ListHeader eyebrow="02 · SETUP" title="How to connect." description="Every app sends your token as Authorization: Bearer <token>." />
          <ol className="divide-y divide-border">
            <SetupStep step="01" title="ChatGPT, Claude, Cursor" body="Add a remote MCP server with the MCP server URL. Auth header: Authorization, value Bearer plus your token." />
            <SetupStep step="02" title="ChatGPT Custom GPT" body="Import the OpenAPI schema URL as an Action. Auth type: API Key. Header: Authorization. Value: Bearer plus your token." />
            <SetupStep step="03" title="Gemini Gems" body="Import the same OpenAPI schema URL and use Bearer plus your token as the API key." />
          </ol>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-border bg-card">
          <ListHeader eyebrow="03 · ACCESS" title="Create an access token." description="Give each AI app its own token. Revoking one doesn't affect the others." />
          <div className="space-y-3 p-5 md:p-6">
            <Label htmlFor="token-name" className={fieldLabelClass}>Token name</Label>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Input
                id="token-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ChatGPT on my laptop"
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-xl"
              />
              <Button
                className="h-11 w-full shrink-0 rounded-xl px-5 shadow-[0_10px_30px_-10px_rgba(115,103,240,.7)] sm:w-auto"
                onClick={() => void handleCreate()}
                disabled={creating || loading}
              >
                {creating ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Generate token
              </Button>
            </div>
            <p className={fieldHintClass}>A name you&apos;ll recognise later. This is not the secret itself.</p>
            {secret ? (
              <div className="mt-2 space-y-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/[0.08] p-4">
                <Mono className="block text-[11px] text-amber-700 dark:text-amber-300">COPY THIS TOKEN NOW</Mono>
                <p className={fieldHintClass}>Interview Trix won&apos;t show the full token again. Store it in the AI app and treat it like a password.</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <code className="min-w-0 flex-1 break-all rounded-xl border border-border bg-background px-3 py-2.5 font-[family-name:var(--font-geist-mono)] text-xs sm:text-[13px]">
                    {secret}
                  </code>
                  <Button variant="outline" className="h-11 shrink-0 rounded-xl" onClick={() => copy(secret, "Access token")}>
                    <Copy />
                    Copy token
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-border bg-card">
          <ListHeader eyebrow="04 · MANAGE" title="Your tokens." description={tokens.length ? `${tokens.length} active. Revoke any you no longer use.` : "Tokens you create show up here."} />
          {loading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" /> Loading tokens…
            </p>
          ) : tokens.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#7367F0] to-[#1F8FFF] text-white"><Plug className="h-5 w-5" /></span>
              <p className="mt-3 text-[15px] font-semibold text-foreground">No tokens yet</p>
              <p className={cn(fieldHintClass, "mx-auto mt-1 max-w-sm")}>Generate one, then paste it into ChatGPT, Claude, Cursor or Gemini.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {tokens.map((token) => (
                <li key={token.tokenId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-[15px] font-semibold text-foreground">{token.name}</p>
                      <Mono className={cn("rounded-md border px-1.5 py-0.5 text-[10px]", token.prefix === "itx_live_" ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "border-border text-muted-foreground")}>
                        {token.prefix === "itx_live_" ? "LIVE" : "TEST"}
                      </Mono>
                    </div>
                    <Mono className="mt-1 block text-[11px] text-muted-foreground">
                      CREATED {formatDate(token.createdAt).toUpperCase()} · {token.lastUsedAt ? `LAST USED ${formatDate(token.lastUsedAt).toUpperCase()}` : "NOT USED YET"}
                    </Mono>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 w-full shrink-0 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                    onClick={() => void handleRevoke(token.tokenId)}
                  >
                    <Trash2 />
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
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
        <div className="flex min-w-0 flex-1 items-start gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5">
          <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <code className="min-w-0 flex-1 break-all font-[family-name:var(--font-geist-mono)] text-xs sm:text-[13px]">
            {value}
          </code>
        </div>
        <Button
          variant="outline"
          className="h-11 shrink-0 rounded-xl"
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
    <li className="flex min-w-0 gap-4 px-5 py-4 md:px-6">
      <Mono className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border text-[11px] text-primary">
        {step}
      </Mono>
      <div className="min-w-0">
        <p className="text-[14.5px] font-semibold leading-snug text-foreground">{title}</p>
        <p className={cn(fieldHintClass, "mt-1")}>{body}</p>
      </div>
    </li>
  );
}
