/**
 * Empty TipTap/ProseMirror paragraphs serialize as `<p></p>` and collapse in
 * preview (zero height + margin collapse). Mark intentional blank lines as
 * spacers with a fixed height so multiple Enter presses add visible gap.
 */

const EMPTY_PARAGRAPH =
  /<p(\s[^>]*)?>(?:\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>/gi;

const SPACER_CLASS = "blog-paragraph-gap";

function mergeSpacerClass(attrs: string): string {
  const classMatch = attrs.match(/\sclass="([^"]*)"/i);
  if (classMatch) {
    const merged = [...new Set([...classMatch[1].split(/\s+/).filter(Boolean), SPACER_CLASS])].join(
      " ",
    );
    return attrs.replace(/\sclass="[^"]*"/i, ` class="${merged}"`);
  }
  return `${attrs} class="${SPACER_CLASS}"`;
}

export function normalizeBlogParagraphSpacing(html: string): string {
  if (!html?.trim()) return html;

  return html.replace(EMPTY_PARAGRAPH, (_match, rawAttrs = "") => {
    const attrs = mergeSpacerClass(rawAttrs);
    return `<p${attrs}><br></p>`;
  });
}
