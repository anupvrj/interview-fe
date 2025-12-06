/**
 * Resume Templates Helper
 * Provides access to template configurations
 */

import { ResumeTemplate } from "./api";

// This will be populated from the API
let templatesCache: ResumeTemplate[] | null = null;

export function getTemplateById(templateId: string): ResumeTemplate | null {
  // For now, return null - templates will be loaded from API
  // This is a placeholder that will be enhanced
  return null;
}

export async function loadTemplates(): Promise<ResumeTemplate[]> {
  if (templatesCache) {
    return templatesCache;
  }
  // Templates should be loaded from API
  return [];
}
