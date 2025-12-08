"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
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
} from "lucide-react";
import { contentApi } from "@/lib/api";

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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
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

  // Update editor content when value prop changes (but avoid infinite loops)
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    const newContent = value || "";

    // Only update if content actually changed
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
      `,
        }}
      />
    </div>
  );
}
