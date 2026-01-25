/**
 * Template Registry (Legacy Compatibility Layer)
 *
 * This file provides backward compatibility with existing code.
 * Uses the new TemplateLoader system under the hood.
 *
 * @deprecated Use TemplateLoader from templateLoader.ts directly for new code
 */

"use client";

import { ExtendedResumeTemplate } from "./templateRenderer";
import { TemplateLoader } from "./templateLoader";

/**
 * Template Registry (Lazy-loaded)
 * Maps template IDs to their extended configurations
 *
 * Note: This is now a dynamic registry powered by TemplateLoader
 */
let cachedRegistry: Record<string, Partial<ExtendedResumeTemplate>> | null =
  null;

export const TEMPLATE_REGISTRY: Record<
  string,
  Partial<ExtendedResumeTemplate>
> = new Proxy({} as Record<string, Partial<ExtendedResumeTemplate>>, {
  get(target, prop: string) {
    if (cachedRegistry && cachedRegistry[prop]) {
      return cachedRegistry[prop];
    }

    // This is a synchronous access to an async operation
    // In practice, templates should be preloaded
    console.warn(
      `Template ${prop} accessed synchronously. Consider using TemplateLoader.loadTemplate() instead.`
    );
    return {};
  },
});

/**
 * Initialize the registry cache
 * Should be called during app initialization
 */
export async function initializeTemplateRegistry(): Promise<void> {
  if (cachedRegistry) return;

  const configs = await TemplateLoader.loadAllTemplateConfigs();
  cachedRegistry = {};

  configs.forEach((config, id) => {
    cachedRegistry![id] = config.extended;
  });
}

/**
 * Get Extended Template Configuration
 * Merges base template with extended configuration from registry
 *
 * @param baseTemplate - Base template object with id
 * @returns Extended template with style and rendering configuration
 */
export function getExtendedTemplate(baseTemplate: any): ExtendedResumeTemplate {
  // Try to get from cache first
  let config = cachedRegistry?.[baseTemplate.id];

  // If not in cache, try to load synchronously
  if (!config) {
    console.warn(
      `Template ${baseTemplate.id} not in cache, attempting synchronous load`
    );
    try {
      // Import all known configs directly
      const knownConfigs: Record<string, any> = {
        mercury: require("@/configs/resume-templates/mercury/config"),
        classic: require("@/configs/resume-templates/classic/config"),
        "clean-slate": require("@/configs/resume-templates/clean-slate/config"),
        "atlantic-blue": require("@/configs/resume-templates/atlantic-blue/config"),
        corporate: require("@/configs/resume-templates/corporate/config"),
        executive: require("@/configs/resume-templates/executive/config"),
        "true-blue": require("@/configs/resume-templates/true-blue/config"),
        harvard: require("@/configs/resume-templates/harvard/config"),
        "professional-classic":require("@/configs/resume-templates/professional-classic/config")
      };

      const configModule = knownConfigs[baseTemplate.id];
      if (configModule) {
        // Try to get config from various possible structures
        config =
          configModule.default?.extended ||
          configModule[`${baseTemplate.id}ExtendedConfig`] ||
          configModule.extended ||
          configModule.default ||
          {};


        // Cache it for future use
        if (cachedRegistry && config) {
          cachedRegistry[baseTemplate.id] = config;
        }
      } else {
        console.warn(`No known config for template: ${baseTemplate.id}`);
        config = {};
      }
    } catch (error) {
      console.error(`Failed to load config for ${baseTemplate.id}:`, error);
      config = {};
    }
  }

  const result = {
    ...baseTemplate,
    style: config?.style,
    rendering: config?.rendering,
    defaultSectionOrder: config?.defaultSectionOrder,
  };

  return result;
}

/**
 * Async version of getExtendedTemplate
 * Recommended for new code
 */
export async function getExtendedTemplateAsync(
  templateId: string
): Promise<ExtendedResumeTemplate> {
  return TemplateLoader.getExtendedTemplate(templateId);
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
