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

interface RichTextEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
}: RichTextEditorProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
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
      onChange(editor.getHTML());
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
      editor.commands.setContent(newContent);
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

  // AI Content Refinement
  const handleAIRefine = async () => {
    if (!editor || isRefining) return;

    const currentContent = editor.getHTML();
    const plainText = currentContent.replaceAll(/<[^>]*>/g, "").trim();

    if (!plainText) {
      return;
    }

    setIsRefining(true);
    try {
      const result = await contentApi.refineContent(currentContent);

      // Update editor with refined content
      editor.commands.setContent(result.refinedContent);
      onChange(result.refinedContent);
    } catch (error) {
      console.error("Error refining content:", error);
      // Could add a toast notification here
    } finally {
      setIsRefining(false);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`rich-text-editor border rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 rounded-t-md">
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={handleAIRefine}
          disabled={isRefining || !value?.trim()}
          title="AI Refine - Make content more professional and resume-friendly"
        >
          {isRefining ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[425px]">
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
