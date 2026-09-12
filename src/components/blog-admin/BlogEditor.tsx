"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Blockquote from "@tiptap/extension-blockquote";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
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
  Link as LinkIcon,
  Unlink,
  ImagePlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Loader2,
  Eye,
  Code2,
  TextQuote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminBlogApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BLOG_FONT_SIZES,
  blogFontSizeExtensions,
  getActiveBlogFontSize,
} from "@/components/blog-admin/extensions/blogFontSize";
import {
  blogColorExtensions,
  getActiveBlogTextColor,
} from "@/components/blog-admin/extensions/blogTextColor";
import { EditorColorPicker } from "@/components/blog-admin/EditorColorPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "@/styles/blog-blockquote.css";
import "@/styles/blog-paragraph-spacing.css";
import { normalizeBlogParagraphSpacing } from "@/lib/blog/paragraph-spacing";

type EditorMode = "visual" | "code";

type BlockFormat = "paragraph" | "h1" | "h2" | "h3" | "quote";

const BLOCK_FORMAT_OPTIONS: { value: BlockFormat; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "quote", label: "Quote" },
];

function getActiveBlockFormat(editor: Editor): BlockFormat {
  if (editor.isActive("blockquote")) return "quote";
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  return "paragraph";
}

function applyBlockFormat(editor: Editor, format: BlockFormat) {
  let chain = editor.chain().focus();

  if (format === "quote") {
    chain.setBlockquote().run();
    return;
  }

  if (editor.isActive("blockquote")) {
    chain = chain.lift("blockquote");
  }

  if (format === "paragraph") {
    chain.setParagraph().run();
    return;
  }

  const level = Number(format.slice(1)) as 1 | 2 | 3;
  chain.setHeading({ level }).run();
}

interface BlogEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
}

async function uploadBlogImage(file: File): Promise<string> {
  const { publicUrl } = await adminBlogApi.uploadImage(file);
  return publicUrl;
}

export function BlogEditor({
  value,
  onChange,
  placeholder = "Write your blog post…",
  className = "",
}: BlogEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<EditorMode>("visual");
  const [codeHtml, setCodeHtml] = useState(value || "");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageAlt, setImageAlt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeFontSize, setActiveFontSize] = useState("");
  const [activeTextColor, setActiveTextColor] = useState("");
  const [activeBlockFormat, setActiveBlockFormat] = useState<BlockFormat>("paragraph");
  const pendingFileRef = useRef<File | null>(null);
  const modeRef = useRef<EditorMode>("visual");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
      }),
      Blockquote.configure({
        HTMLAttributes: { class: "blog-medium-blockquote" },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "cursor-pointer text-primary underline" },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "blog-inline-image rounded-lg max-w-full h-auto my-4",
          loading: "lazy",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ...blogFontSizeExtensions,
      ...blogColorExtensions,
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      if (modeRef.current !== "visual") return;
      onChange(normalizeBlogParagraphSpacing(ed.getHTML()));
    },
    editorProps: {
      attributes: {
        class:
          "blog-editor focus:outline-none min-h-[280px] p-4 prose prose-sm max-w-none dark:prose-invert",
        "data-placeholder": placeholder,
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!editor) return;

    const syncToolbarState = () => {
      setActiveFontSize(getActiveBlogFontSize(editor));
      setActiveTextColor(getActiveBlogTextColor(editor));
      setActiveBlockFormat(getActiveBlockFormat(editor));
    };

    syncToolbarState();
    editor.on("selectionUpdate", syncToolbarState);
    editor.on("transaction", syncToolbarState);

    return () => {
      editor.off("selectionUpdate", syncToolbarState);
      editor.off("transaction", syncToolbarState);
    };
  }, [editor]);

  useEffect(() => {
    if (mode !== "visual" || !editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value, mode]);

  useEffect(() => {
    if (mode !== "code") return;
    if (value !== codeHtml) {
      setCodeHtml(value || "");
    }
  }, [value, mode, codeHtml]);

  const switchToVisual = () => {
    const normalized = normalizeBlogParagraphSpacing(codeHtml);
    if (editor) {
      editor.commands.setContent(normalized || "", { emitUpdate: false });
    }
    setCodeHtml(normalized);
    onChange(normalized);
    setMode("visual");
  };

  const switchToCode = () => {
    const html = normalizeBlogParagraphSpacing(editor?.getHTML() ?? value ?? "");
    setCodeHtml(html);
    onChange(html);
    setMode("code");
  };

  const insertImage = (src: string, alt: string) => {
    if (!editor || !src.trim()) return;
    editor
      .chain()
      .focus()
      .setImage({ src: src.trim(), alt: alt.trim() || "Blog image" })
      .run();
  };

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      insertImage(url, file.name.replace(/\.[^.]+$/, ""));
      toast.success("Image uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      toast.error(msg);
    } finally {
      setUploading(false);
      pendingFileRef.current = null;
    }
  };

  const confirmImageDialog = async () => {
    if (pendingFileRef.current) {
      await handleFileSelect(pendingFileRef.current);
    } else if (imageUrl.trim()) {
      insertImage(imageUrl.trim(), imageAlt);
    }
    setShowImageDialog(false);
    setImageUrl("");
    setImageAlt("");
  };

  if (!editor) return null;

  const ToolBtn = ({
    onClick,
    active,
    disabled,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", active && "bg-muted")}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("overflow-visible rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-2 py-1.5">
        <p className="hidden text-xs text-muted-foreground sm:block">
          {mode === "visual"
            ? "Visual editor — format with the toolbar below"
            : "Code editor — edit the full post HTML"}
        </p>
        <div
          className="ml-auto flex rounded-md border border-border bg-background p-0.5"
          role="tablist"
          aria-label="Editor mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "visual"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "visual"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => {
              if (mode !== "visual") switchToVisual();
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            Visual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "code"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "code"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => {
              if (mode !== "code") switchToCode();
            }}
          >
            <Code2 className="h-3.5 w-3.5" />
            Code
          </button>
        </div>
      </div>

      {mode === "visual" ? (
        <div className="relative flex flex-wrap items-center gap-0.5 overflow-visible border-b bg-muted/20 p-1">
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <s className="text-xs font-bold">S</s>
          </ToolBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <Select
            value={activeBlockFormat}
            onValueChange={(value) => applyBlockFormat(editor, value as BlockFormat)}
          >
            <SelectTrigger
              className="h-8 w-[132px] shrink-0 border-0 bg-transparent px-2 text-xs shadow-none focus:ring-0 [&>span]:truncate"
              title="Block format"
            >
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeFontSize || "default"}
            onValueChange={(value) => {
              const size = value === "default" ? "" : value;
              editor.chain().focus().setBlogFontSize(size).run();
            }}
          >
            <SelectTrigger
              className="h-8 w-[112px] shrink-0 border-0 bg-transparent px-2 text-xs shadow-none focus:ring-0 [&>span]:truncate"
              title="Font size"
            >
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {BLOG_FONT_SIZES.map((option) => (
                <SelectItem
                  key={option.value || "default"}
                  value={option.value || "default"}
                  className="text-xs"
                >
                  {option.label === "Default" ? "Default" : `${option.label}px`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <EditorColorPicker
            value={activeTextColor}
            onChange={(color) => {
              editor.chain().focus().setBlogTextColor(color).run();
            }}
          />
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Block quote (⌘⇧B) — type > at line start"
          >
            <TextQuote className="h-4 w-4" />
          </ToolBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolBtn
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              setLinkUrl(prev ?? "https://");
              setLinkText(
                editor.state.doc.textBetween(
                  editor.state.selection.from,
                  editor.state.selection.to,
                ),
              );
              setShowLinkDialog(true);
            }}
            active={editor.isActive("link")}
            title="Insert link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive("link")}
            title="Remove link"
          >
            <Unlink className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload image"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
          </ToolBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolBtn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolBtn>
        </div>
      ) : null}

      {mode === "visual" ? (
        <EditorContent editor={editor} />
      ) : (
        <Textarea
          value={codeHtml}
          onChange={(e) => {
            const normalized = normalizeBlogParagraphSpacing(e.target.value);
            setCodeHtml(normalized);
            onChange(normalized);
          }}
          spellCheck={false}
          rows={18}
          placeholder="<p>Write or paste HTML for the full post body…</p>"
          className="min-h-[280px] resize-y rounded-none border-0 font-mono text-xs leading-relaxed shadow-none focus-visible:ring-0"
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          pendingFileRef.current = file;
          setImageAlt(file.name.replace(/\.[^.]+$/, ""));
          setImageUrl("");
          setShowImageDialog(true);
        }}
      />

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>URL</Label>
              <Input
                className="mt-1"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <Label>Text (optional)</Label>
              <Input
                className="mt-1"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                let href = linkUrl.trim();
                if (href && !/^https?:\/\//i.test(href)) href = `https://${href}`;
                if (linkText.trim()) {
                  editor
                    .chain()
                    .focus()
                    .insertContent(`<a href="${href}">${linkText}</a>`)
                    .run();
                } else {
                  editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
                }
                setShowLinkDialog(false);
              }}
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Alt text (for SEO & accessibility)</Label>
              <Input
                className="mt-1"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Describe the image"
              />
            </div>
            {!pendingFileRef.current ? (
              <div>
                <Label>Or paste image URL</Label>
                <Input
                  className="mt-1"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Uploading: {pendingFileRef.current.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImageDialog(false);
                pendingFileRef.current = null;
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void confirmImageDialog()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
