import type { PageBand } from "@/lib/resume-pagination-engine";

const lastGoodPagesByResumeId = new Map<string, PageBand[]>();

export function getLastGoodPagesForResume(resumeId: string): PageBand[] | undefined {
  const rows = lastGoodPagesByResumeId.get(resumeId);
  if (!rows?.length) return undefined;
  return rows.map((p) => ({ ...p }));
}

export function setLastGoodPagesForResume(
  resumeId: string,
  pages: PageBand[],
): void {
  if (pages.length === 0) {
    return;
  }
  lastGoodPagesByResumeId.set(
    resumeId,
    pages.map((p) => ({ ...p })),
  );
}
