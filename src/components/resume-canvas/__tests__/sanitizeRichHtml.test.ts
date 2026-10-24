// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { sanitizeRichHtml } from "../canvasOps";

describe("sanitizeRichHtml keeps the text styles the editor offers", () => {
  it("bold, italic, underline, numbered list and web links survive a save", () => {
    const html =
      '<ol><li><b>Led</b> a <i>small</i> <u>team</u> on <a href="https://github.com/x/y" target="_blank" style="color:red">the app</a></li></ol>';
    expect(sanitizeRichHtml(html)).toBe('<ol><li><b>Led</b> a <i>small</i> <u>team</u> on <a href="https://github.com/x/y">the app</a></li></ol>');
  });

  it("strong / em and email links are kept; unsafe links lose their href", () => {
    expect(sanitizeRichHtml('<p><strong>A</strong> <em>B</em> <a href="mailto:a@b.co">mail</a></p>')).toBe(
      '<p><strong>A</strong> <em>B</em> <a href="mailto:a@b.co">mail</a></p>',
    );
    expect(sanitizeRichHtml('<p><a href="javascript:alert(1)">x</a></p>')).toBe("<p><a>x</a></p>");
  });

  it("other markup is unwrapped to its text", () => {
    expect(sanitizeRichHtml('<p><font color="red">Hi</font> <img src="x"></p>')).toBe("<p>Hi </p>");
  });

  it("keeps alignment from the toolbar, and only alignment", () => {
    expect(sanitizeRichHtml('<p style="text-align: center; color: red">Hi</p>')).toBe('<p style="text-align: center">Hi</p>');
    expect(sanitizeRichHtml('<ul><li style="text-align:right">A</li></ul>')).toBe('<ul><li style="text-align: right">A</li></ul>');
    expect(sanitizeRichHtml('<div style="text-align: justify">Wrapped line</div>')).toBe('<p style="text-align: justify">Wrapped line</p>');
    // left is the default: nothing to store
    expect(sanitizeRichHtml('<p style="text-align: left">L</p>')).toBe("<p>L</p>");
    expect(sanitizeRichHtml('<b style="text-align: center">B</b>')).toBe("<b>B</b>");
  });
});
