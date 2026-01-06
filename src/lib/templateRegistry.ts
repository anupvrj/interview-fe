/**
 * Template Registry
 * 
 * Central registry for all resume templates.
 * Imports extended configurations from individual template folders.
 * 
 * @see TEMPLATE_DEVELOPMENT_GUIDE.md for adding new templates
 */

import { ExtendedResumeTemplate } from "./templateRenderer";

// Import template configurations from individual folders
import { atlanticblueConfig } from "../configs/resume-templates/atlantic-blue/config";
import { cleanslateConfig } from "../configs/resume-templates/clean-slate/config";
import { executiveConfig } from "../configs/resume-templates/executive/config";
import { classicConfig } from "../configs/resume-templates/classic/config";
import { corporateConfig } from "../configs/resume-templates/corporate/config";
import { harvardConfig } from "../configs/resume-templates/harvard/config";
import { trueblueConfig } from "../configs/resume-templates/true-blue/config";
import { mercuryConfig } from "../configs/resume-templates/mercury/config";

/**
 * Template Registry
 * Maps template IDs to their extended configurations
 * 
 * To add a new template:
 * 1. Create template folder in configs/resume-templates/
 * 2. Add config.ts and dummy-content.ts files
 * 3. Import the config here
 * 4. Add to TEMPLATE_REGISTRY object
 * 5. Add to templates-catalog.ts for marketing
 */
export const TEMPLATE_REGISTRY: Record<
  string,
  Partial<ExtendedResumeTemplate>
> = {
  "atlantic-blue": atlanticblueConfig.extended as Partial<ExtendedResumeTemplate>,
  "clean-slate": cleanslateConfig.extended as Partial<ExtendedResumeTemplate>,
  executive: executiveConfig.extended as Partial<ExtendedResumeTemplate>,
  classic: classicConfig.extended as Partial<ExtendedResumeTemplate>,
  corporate: corporateConfig.extended as Partial<ExtendedResumeTemplate>,
  harvard: harvardConfig.extended as Partial<ExtendedResumeTemplate>,
  "true-blue": trueblueConfig.extended as Partial<ExtendedResumeTemplate>,
  mercury: mercuryConfig.extended as Partial<ExtendedResumeTemplate>,
};

/**
 * Get Extended Template Configuration
 * Merges base template with extended configuration from registry
 * 
 * @param baseTemplate - Base template object with id
 * @returns Extended template with style and rendering configuration
 */
export function getExtendedTemplate(baseTemplate: any): ExtendedResumeTemplate {
  const config = TEMPLATE_REGISTRY[baseTemplate.id] || {};

  return {
    ...baseTemplate,
    style: config.style,
    rendering: config.rendering,
    defaultSectionOrder: config.defaultSectionOrder,
  };
}

/**
 * Get Available Template IDs
 * Returns array of all registered template IDs
 * 
 * @returns Array of template IDs
 */
export function getAvailableTemplateIds(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

/**
 * Check if Template ID is Valid
 * Verifies if a template ID exists in the registry
 * 
 * @param templateId - Template ID to check
 * @returns True if template exists
 */
export function isValidTemplateId(templateId: string): boolean {
  return templateId in TEMPLATE_REGISTRY;
}

/**
 * Get Available Templates
 * Returns all template configurations
 * 
 * @returns Record of all templates
 */
export function getAvailableTemplates(): Record<
  string,
  Partial<ExtendedResumeTemplate>
> {
  return TEMPLATE_REGISTRY;
}

/**
 * Get Template By ID
 * Returns specific template configuration by ID
 * 
 * @param templateId - Template ID
 * @returns Template configuration or null
 */
export function getTemplateById(
  templateId: string
): Partial<ExtendedResumeTemplate> | null {
  return TEMPLATE_REGISTRY[templateId] || null;
}

/**
 * Check if Template Has Feature
 * Checks if a template has a specific rendering feature enabled
 * 
 * @param templateId - Template ID
 * @param feature - Feature name
 * @returns True if feature is enabled
 */
export function hasFeature(templateId: string, feature: string): boolean {
  const config = TEMPLATE_REGISTRY[templateId];
  return (
    config?.rendering?.features?.[
      feature as keyof typeof config.rendering.features
    ] === true
  );
}

/**
 * Get Template Style Configuration
 * Returns the style configuration for a template
 * 
 * @param templateId - Template ID
 * @returns Style configuration or null
 */
export function getTemplateStyleConfig(templateId: string) {
  const config = TEMPLATE_REGISTRY[templateId];
  return config?.style || null;
}

