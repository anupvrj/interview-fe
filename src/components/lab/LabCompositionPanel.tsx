"use client";

import { useState } from "react";
import type { LabComposeLayer, LabComposeLiveResult } from "@/lib/runtimeApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";

type Props = {
  interviewId: string | null;
  environment: string;
  onEnvironmentChange: (env: string) => void;
  useDraft: boolean;
  onUseDraftChange: (v: boolean) => void;
  loading: boolean;
  composeResult: LabComposeLiveResult | null;
  onCompose: () => void;
  onLiveTest: () => void;
  onCreateInterview: () => void;
};

function LayerBlock({ layer }: { layer: LabComposeLayer }) {
  const [open, setOpen] = useState(layer.id === "final");
  return (
    <div className="rounded-md border border-border/60">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs"
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="min-w-0 flex-1 font-medium">{layer.label}</span>
        {layer.draftOverlay ? (
          <Badge variant="secondary" className="text-[9px]">
            draft
          </Badge>
        ) : null}
        {layer.promptName ? (
          <span className="max-w-[40%] truncate font-mono text-[10px] text-muted-foreground">
            {layer.promptName}
          </span>
        ) : null}
      </button>
      {open ? (
        <pre className="max-h-40 overflow-auto border-t border-border/40 bg-muted/15 p-2.5 text-[10px] leading-relaxed whitespace-pre-wrap">
          {layer.content || "(empty)"}
        </pre>
      ) : null}
    </div>
  );
}

export function LabCompositionPanel({
  interviewId,
  environment,
  onEnvironmentChange,
  useDraft,
  onUseDraftChange,
  loading,
  composeResult,
  onCompose,
  onLiveTest,
  onCreateInterview,
}: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3">
      <div>
        <h4 className="text-xs font-semibold">Composition</h4>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Production-path stack for this Lab interview. Preview layers, then Live
          Test.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[8rem]">
          <Label className="text-[10px] text-muted-foreground">Prompt env</Label>
          <Select value={environment} onValueChange={onEnvironmentChange}>
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="development">development</SelectItem>
              <SelectItem value="staging">staging</SelectItem>
              <SelectItem value="production">production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={useDraft}
            onChange={(e) => onUseDraftChange(e.target.checked)}
          />
          Overlay Lab draft
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {interviewId ? (
          <Badge variant="outline" className="font-mono text-[10px]">
            {interviewId}
          </Badge>
        ) : (
          <span className="text-muted-foreground">No Lab interview yet</span>
        )}
        {composeResult ? (
          <Badge variant="secondary" className="text-[10px]">
            RAG r{composeResult.rag.resumeSnippets}/p
            {composeResult.rag.pastInterviewSnippets}/s
            {composeResult.rag.performanceSnippets}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {!interviewId ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={onCreateInterview}
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            New Lab interview
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || !interviewId}
          onClick={onCompose}
        >
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Preview compose
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={loading || !interviewId}
          onClick={onLiveTest}
        >
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Live Test
        </Button>
      </div>

      {composeResult ? (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground">
            profile{" "}
            <code className="rounded bg-muted px-1">
              {composeResult.profileRef.name}
            </code>{" "}
            · env{" "}
            <code className="rounded bg-muted px-1">
              {composeResult.environment}
            </code>
          </p>
          {composeResult.layers.map((layer) => (
            <LayerBlock key={layer.id} layer={layer} />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Create a Lab interview, then Preview compose to see language override,
          dept rules, session body, profile, RAG, and the final system prompt.
        </p>
      )}
    </div>
  );
}
