"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Sparkles,
  Loader2,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
import { contentApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AIContentPromptField } from "@/components/resume-editor/AIContentPromptField";
import { toast } from "sonner";

interface RichTextEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly showAiRefine?: boolean;
  /** Hint for the magic-button refine API (experience/projects should be "list"). */
  readonly preferredContentType?: "paragraph" | "list" | "auto";
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
  showAiRefine = true,
  preferredContentType = "auto",
}: RichTextEditorProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiUserPrompt, setAiUserPrompt] = useState("");
  const [aiOutputText, setAiOutputText] = useState("");
  const [aiContentType, setAiContentType] = useState<"paragraph" | "list">(
    "paragraph",
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "cursor-pointer",
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (normalizeHTML(html) === normalizeHTML(value || "")) {
        return;
      }
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[120px] p-3",
        "data-placeholder": placeholder,
      },
    },
    immediatelyRender: false, // Fix SSR hydration mismatch
  });

  // Normalize HTML content for comparison (remove extra whitespace)
  const normalizeHTML = (html: string): string => {
    if (!html) return "";
    // Remove leading/trailing whitespace from text nodes
    // This helps prevent false positives when comparing HTML with whitespace differences
    return html
      .replace(/>\s+</g, "><") // Remove whitespace between tags
      .replace(/\s+/g, " ") // Normalize multiple spaces to single space
      .trim();
  };

  // Update editor content when value prop changes (but avoid infinite loops)
  useEffect(() => {
    if (!editor) return;

    const currentContent = normalizeHTML(editor.getHTML());
    const newContent = normalizeHTML(value || "");

    // Only update if content actually changed (after normalization)
    if (newContent !== currentContent) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(newContent, { emitUpdate: false });
      // Restore cursor position if possible
      try {
        editor.commands.setTextSelection({ from, to });
      } catch {
        // Ignore selection errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Link Management
  const openLinkDialog = () => {
    const { from, to } = editor!.state.selection;
    const selectedText = editor!.state.doc.textBetween(from, to, " ");

    // Check if current selection is already a link
    const previousUrl = editor!.getAttributes("link").href;

    setLinkText(selectedText || "");
    setLinkUrl(previousUrl || "");
    setShowLinkDialog(true);
  };

  const insertLink = () => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setShowLinkDialog(false);
      return;
    }

    // Ensure URL has protocol
    let url = linkUrl;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // If there's link text and no selection, insert the text with link
    if (linkText && editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${linkText}</a>`)
        .run();
    } else {
      // Otherwise, apply link to selection
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }

    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  };

  const htmlToEditablePlain = (html: string): string => {
    if (/<li[\s>]/i.test(html)) {
      return [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((match) => match[1].replaceAll(/<[^>]*>/g, "").trim())
        .filter(Boolean)
        .join("\n");
    }
    return html
      .replaceAll(/<\/p>/gi, "\n")
      .replaceAll(/<br\s*\/?>/gi, "\n")
      .replaceAll(/<[^>]*>/g, " ")
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  };

  const looksLikePlainList = (text: string): boolean => {
    const lines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return false;
    const marked = lines.filter(
      (line) => /^[-•*●▪–]\s+/.test(line) || /^\d+[.)]\s+/.test(line),
    );
    return marked.length >= 1 || lines.length >= 3;
  };

  const plainToHtml = (text: string, type: "paragraph" | "list"): string => {
    if (type === "list") {
      const items = text
        .split("\n")
        .map((line) =>
          line
            .trim()
            .replace(/^[-•*●▪–]\s+/, "")
            .replace(/^\d+[.)]\s+/, ""),
        )
        .filter(Boolean);
      return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
    }
    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length <= 1) {
      return `<p>${text.trim()}</p>`;
    }
    return paragraphs.map((p) => `<p>${p}</p>`).join("");
  };

  const runAIRefine = async (options?: { usePrompt?: boolean }) => {
    if (!editor || isRefining) return;

    const currentContent = editor.getHTML();
    const plainText = currentContent.replaceAll(/<[^>]*>/g, "").trim();

    if (!plainText) {
      toast.error("Add some content before using AI refine.");
      return;
    }

    setIsRefining(true);
    try {
      const result = await contentApi.refineContent(
        currentContent,
        preferredContentType,
        options?.usePrompt === false
          ? undefined
          : aiUserPrompt.trim() || undefined,
      );
      const nextType = looksLikePlainList(htmlToEditablePlain(result.refinedContent))
        ? "list"
        : result.contentType;
      setAiContentType(nextType);
      setAiOutputText(htmlToEditablePlain(result.refinedContent));
    } catch (error) {
      console.error("Error refining content:", error);
      toast.error("Could not generate content. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const applyAIContent = () => {
    if (!editor || !aiOutputText.trim()) return;
    const insertType = looksLikePlainList(aiOutputText)
      ? "list"
      : aiContentType;
    const html = plainToHtml(aiOutputText, insertType);
    editor.commands.setContent(html);
    onChange(html);
    setShowAiDialog(false);
    setAiUserPrompt("");
    setAiOutputText("");
  };

  const openAiDialog = () => {
    if (!editor) return;
    const plainText = editor.getHTML().replaceAll(/<[^>]*>/g, "").trim();
    if (!plainText) {
      toast.error("Add some content before using AI refine.");
      return;
    }
    setAiUserPrompt("");
    setAiOutputText("");
    setShowAiDialog(true);
    void runAIRefine({ usePrompt: false });
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`rich-text-editor overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm ${className}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border-b border-border/60 bg-gradient-to-r from-[#7367F0]/[0.05] via-muted/30 to-transparent p-2">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("underline") ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Headers */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
            }
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
            }
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 3 }) ? "default" : "ghost"
            }
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive("link") ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={openLinkDialog}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          {editor.isActive("link") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={removeLink}
              title="Remove Link"
            >
              <Unlink className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white rounded-b-md relative">
        <EditorContent editor={editor} />

        {/* AI Refine Button - Positioned in bottom-right corner */}
        {showAiRefine ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute bottom-3 right-3 h-8 w-8 border-0 bg-[#7367F0] p-0 text-white shadow-[0_2px_10px_rgba(115,103,240,0.4)] transition-all duration-200 hover:bg-[#6e62e5] hover:shadow-[0_4px_16px_rgba(115,103,240,0.45)]"
          onClick={openAiDialog}
          disabled={isRefining || !value?.trim()}
          title="AI refine — improve content with optional custom instructions"
        >
          {isRefining ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
        ) : null}
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent
          overlayClassName="z-[80]"
          className="z-[80] w-[calc(100%-2rem)] sm:max-w-[425px]"
        >
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Add a hyperlink to the selected text or insert new linked text.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-text">Link Text (optional)</Label>
              <Input
                id="link-text"
                placeholder="e.g., Visit our website"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Leave empty to apply link to selected text
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                placeholder="e.g., https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl("");
                setLinkText("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={insertLink}>
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent
          overlayClassName="z-[80]"
          className="z-[80] flex max-h-[min(85dvh,640px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg [&>button]:hidden"
        >
          <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-4 text-left">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI content assistant
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 py-4">
            <AIContentPromptField
              id="rich-text-ai-prompt"
              value={aiUserPrompt}
              onChange={setAiUserPrompt}
              disabled={isRefining}
            />

            <div className="space-y-2">
              <Label htmlFor="rich-text-ai-output" className="text-sm font-medium">
                Generated content
              </Label>
              {isRefining ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </div>
              ) : (
                <Textarea
                  id="rich-text-ai-output"
                  value={aiOutputText}
                  onChange={(e) => setAiOutputText(e.target.value)}
                  rows={6}
                  className="min-h-[140px] text-sm"
                  placeholder="AI output will appear here. Edit before inserting."
                />
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void runAIRefine({ usePrompt: true })}
              disabled={isRefining}
            >
              {isRefining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Regenerate
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAiDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={applyAIContent}
                disabled={!aiOutputText.trim() || isRefining}
              >
                Insert
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rich-text-editor .ProseMirror {
          outline: none;
          min-height: 120px;
          padding: 12px;
          padding-bottom: 50px; /* Extra padding to avoid overlap with AI button */
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror ul {
          list-style-type: disc;
        }
        .rich-text-editor .ProseMirror ol {
          list-style-type: decimal;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: bold;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror strong {
          font-weight: bold;
        }
        .rich-text-editor .ProseMirror em {
          font-style: italic;
        }
        .rich-text-editor .ProseMirror u {
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror a {
          text-decoration: underline;
          cursor: pointer;
        }
        .rich-text-editor .ProseMirror a strong,
        .rich-text-editor .ProseMirror strong a {
          font-weight: bold;
        }
        .rich-text-editor .ProseMirror a u,
        .rich-text-editor .ProseMirror u a {
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror a em,
        .rich-text-editor .ProseMirror em a {
          font-style: italic;
        }
        /* Preview styles */
        .prose strong {
          font-weight: bold;
        }
        .prose em {
          font-style: italic;
        }
        .prose u {
          text-decoration: underline;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .prose h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .prose h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .prose h3 {
          font-size: 1.125rem;
          font-weight: bold;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .prose a {
          text-decoration: underline;
          cursor: pointer;
        }
        .prose a strong,
        .prose strong a {
          font-weight: bold;
        }
        .prose a u,
        .prose u a {
          text-decoration: underline;
        }
        .prose a em,
        .prose em a {
          font-style: italic;
        }
      `,
        }}
      />
    </div>
  );
}
