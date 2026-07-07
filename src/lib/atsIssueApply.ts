import type { Resume } from "@/lib/api";

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceTextInField(
  value: string,
  original: string,
  improved: string,
): { next: string; replaced: boolean } {
  if (!original.trim()) {
    return { next: value, replaced: false };
  }

  if (value.includes(original)) {
    return { next: value.replace(original, improved), replaced: true };
  }

  const plainValue = stripHtml(value);
  const plainOriginal = stripHtml(original);
  if (!plainOriginal || !plainValue.includes(plainOriginal)) {
    return { next: value, replaced: false };
  }

  if (!value.includes("<")) {
    return {
      next: plainValue.replace(plainOriginal, improved),
      replaced: true,
    };
  }

  const words = plainOriginal.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const pattern = words
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("[\\s\\u00A0]+");
    const regex = new RegExp(pattern, "i");
    const match = plainValue.match(regex);
    if (match && match.index !== undefined) {
      const before = plainValue.slice(0, match.index);
      const after = plainValue.slice(match.index + match[0].length);
      return {
        next: before + improved + after,
        replaced: true,
      };
    }
  }

  return {
    next: plainValue.replace(plainOriginal, improved),
    replaced: true,
  };
}

function replaceInUnknown(
  value: unknown,
  original: string,
  improved: string,
): { value: unknown; replaced: boolean } {
  if (typeof value === "string") {
    const result = replaceTextInField(value, original, improved);
    return { value: result.next, replaced: result.replaced };
  }

  if (Array.isArray(value)) {
    let replaced = false;
    const next = value.map((item) => {
      const result = replaceInUnknown(item, original, improved);
      if (result.replaced) replaced = true;
      return result.value;
    });
    return { value: next, replaced };
  }

  if (value && typeof value === "object") {
    let replaced = false;
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      const result = replaceInUnknown(nested, original, improved);
      if (result.replaced) replaced = true;
      next[key] = result.value;
    }
    return { value: next, replaced };
  }

  return { value, replaced: false };
}

export function applyAtsIssueFixToResume(
  resume: Resume,
  original: string,
  improved: string,
): Resume | null {
  const { value, replaced } = replaceInUnknown(
    resume.content,
    original,
    improved,
  );
  if (!replaced) return null;
  return {
    ...resume,
    content: value as Resume["content"],
  };
}
