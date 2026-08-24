import { Extension, type Editor } from "@tiptap/core";
import { Color } from "@tiptap/extension-text-style";

export const BLOG_TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Black", value: "#000000" },
  { label: "Dark gray", value: "#374151" },
  { label: "Gray", value: "#6b7280" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#d97706" },
  { label: "Green", value: "#16a34a" },
  { label: "Teal", value: "#0d9488" },
  { label: "Blue", value: "#2563eb" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Purple", value: "#7367F0" },
  { label: "Pink", value: "#db2777" },
] as const;

const BLOCK_TYPES = new Set(["paragraph", "heading"]);

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blogTextColor: {
      setBlogTextColor: (color: string) => ReturnType;
      unsetBlogTextColor: () => ReturnType;
    };
  }
}

/** Applies text color to a selection (span) or whole paragraph/heading block. */
export const BlogTextColorCommands = Extension.create({
  name: "blogTextColorCommands",

  addCommands() {
    return {
      setBlogTextColor:
        (color: string) =>
        ({ chain, state }) => {
          const { empty, from, to } = state.selection;

          if (!empty) {
            if (!color) {
              return chain().focus().unsetColor().run();
            }
            return chain().focus().setColor(color).run();
          }

          const $from = state.selection.$from;
          const block = $from.parent;
          if (!BLOCK_TYPES.has(block.type.name)) {
            if (!color) {
              return chain().focus().unsetColor().run();
            }
            return chain().focus().setColor(color).run();
          }

          const blockPos = $from.before($from.depth);
          const nextAttrs = { ...block.attrs };
          if (color) {
            nextAttrs.color = color;
          } else {
            delete nextAttrs.color;
          }

          return chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup(blockPos, undefined, nextAttrs);
              return true;
            })
            .run();
        },

      unsetBlogTextColor:
        () =>
        ({ commands }) =>
          commands.setBlogTextColor(""),
    };
  },
});

export function getActiveBlogTextColor(editor: Editor): string {
  const markColor = editor.getAttributes("textStyle").color as string | undefined;
  if (markColor) return markColor;

  const { $from } = editor.state.selection;
  const blockColor = $from.parent.attrs.color as string | undefined;
  if (blockColor) return blockColor;

  return "";
}

export const blogColorExtensions = [
  Color.configure({
    types: ["textStyle", "paragraph", "heading"],
  }),
  BlogTextColorCommands,
];
