import { Extension, type Editor } from "@tiptap/core";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-text-style";

export const BLOG_FONT_SIZES = [
  { label: "Default", value: "" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "36", value: "36px" },
  { label: "42", value: "42px" },
  { label: "48", value: "48px" },
] as const;

const BLOCK_TYPES = new Set(["paragraph", "heading"]);

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blogFontSize: {
      setBlogFontSize: (fontSize: string) => ReturnType;
      unsetBlogFontSize: () => ReturnType;
    };
  }
}

/** Applies font size to a text selection (span) or whole paragraph/heading block. */
export const BlogFontSizeCommands = Extension.create({
  name: "blogFontSizeCommands",

  addCommands() {
    return {
      setBlogFontSize:
        (fontSize: string) =>
        ({ chain, state }) => {
          const { empty, from, to } = state.selection;

          if (!empty) {
            if (!fontSize) {
              return chain().focus().unsetFontSize().run();
            }
            return chain().focus().setFontSize(fontSize).run();
          }

          const $from = state.selection.$from;
          const block = $from.parent;
          if (!BLOCK_TYPES.has(block.type.name)) {
            if (!fontSize) {
              return chain().focus().unsetFontSize().run();
            }
            return chain().focus().setFontSize(fontSize).run();
          }

          const blockPos = $from.before($from.depth);
          const nextAttrs = { ...block.attrs };
          if (fontSize) {
            nextAttrs.fontSize = fontSize;
          } else {
            delete nextAttrs.fontSize;
          }

          return chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup(blockPos, undefined, nextAttrs);
              return true;
            })
            .run();
        },

      unsetBlogFontSize:
        () =>
        ({ commands }) =>
          commands.setBlogFontSize(""),
    };
  },
});

export function getActiveBlogFontSize(editor: Editor): string {
  const markSize = editor.getAttributes("textStyle").fontSize as string | undefined;
  if (markSize) return markSize;

  const { $from } = editor.state.selection;
  const block = $from.parent;
  const blockSize = block.attrs.fontSize as string | undefined;
  if (blockSize) return blockSize;

  return "";
}

export const blogFontSizeExtensions = [
  TextStyle,
  FontSize.configure({
    types: ["textStyle", "paragraph", "heading"],
  }),
  BlogFontSizeCommands,
];
