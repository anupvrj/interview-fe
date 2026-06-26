import type { Resume } from "@/lib/api";

/** Fast fingerprint so pagination remeasures when resume body text changes. */
export function buildResumeContentMeasureKey(resume: Resume): string {
  const content = resume.content;
  const payload = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (Math.imul(31, hash) + payload.charCodeAt(i)) | 0;
  }
  return `${resume.resumeId}:${payload.length}:${hash}`;
}
