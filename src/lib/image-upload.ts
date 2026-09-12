const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Browsers sometimes omit `File.type` (e.g. macOS picker) — infer from extension. */
export function inferImageContentType(file: Pick<File, "name" | "type">): string {
  const type = file.type?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (type && type !== "application/octet-stream") return type;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "image/jpeg";
}
