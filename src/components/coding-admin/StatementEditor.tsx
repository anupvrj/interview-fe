"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodingProblemStatement } from "@/components/coding/CodingProblemStatement";
import { insertStatementImage } from "@/lib/coding-problem-statement";
import { cn } from "@/lib/utils";

interface StatementEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

export function StatementEditor({
  value,
  onChange,
  placeholder = "Describe the problem, constraints, examples…",
}: StatementEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const insertImage = () => {
    const url = imageUrl.trim();
    if (!url) return;

    const textarea = textareaRef.current;
    const { value: next, cursor } = insertStatementImage(
      value,
      url,
      textarea?.selectionStart,
      textarea?.selectionEnd,
    );
    onChange(next);
    setImageUrl("");
    setImageOpen(false);
    setTab("edit");

    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-border p-0.5">
          <button
            type="button"
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              tab === "edit"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              tab === "preview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("preview")}
          >
            Preview
          </button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setImageOpen(true)}
        >
          <ImagePlus className="mr-1.5 h-4 w-4" />
          Insert image
        </Button>
      </div>

      {tab === "edit" ? (
        <textarea
          ref={textareaRef}
          className="min-h-[240px] w-full rounded-md border bg-card px-3 py-2 font-mono text-sm leading-relaxed"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div className="min-h-[240px] rounded-md border bg-muted/20 px-4 py-3">
          {value.trim() ? (
            <CodingProblemStatement statement={value} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Images are stored as{" "}
        <code className="rounded bg-muted px-1 py-0.5">[image: https://…]</code>{" "}
        on their own line. Use your own hosted URL or S3 link instead of LeetCode
        assets when possible.
      </p>

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="statement-image-url">Image URL</Label>
            <Input
              id="statement-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://your-cdn.example.com/diagram.png"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertImage();
                }
              }}
            />
          </div>
          {imageUrl.trim() ? (
            <div className="rounded-md border bg-muted/20 p-3">
              <CodingProblemStatement
                statement={`\n[image: ${imageUrl.trim()}]\n`}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImageOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={insertImage} disabled={!imageUrl.trim()}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
