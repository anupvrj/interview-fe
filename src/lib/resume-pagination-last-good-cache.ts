import type { PackedPage } from "@/lib/resume-pagination/packUnitsIntoPages";

const lastGoodPagesByResumeId = new Map<string, PackedPage[]>();

export function getLastGoodPagesForResume(resumeId: string): PackedPage[] | undefined {
  const rows = lastGoodPagesByResumeId.get(resumeId);
  if (!rows?.length) return undefined;
  return rows.map((p) => ({ ...p }));
}

export function setLastGoodPagesForResume(
  resumeId: string,
  pages: PackedPage[],
): void {
  if (pages.length === 0) {
    return;
  }
  lastGoodPagesByResumeId.set(
    resumeId,
    pages.map((p) => ({ ...p })),
  );
}

export function clearLastGoodPagesForResume(resumeId: string): void {
  lastGoodPagesByResumeId.delete(resumeId);
}

export function clearAllLastGoodPages(): void {
  lastGoodPagesByResumeId.clear();
}
