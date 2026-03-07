/**
 * Template Loader - Auto-Discovery System
 * 
 * Automatically discovers and loads resume templates from the templates directory.
 * Provides dynamic CSS loading to prevent style conflicts.
 * 
 * Architecture:
 * - Templates are stored in /configs/resume-templates/[template-id]/
 * - Each template must export a default TemplateConfig object
 * - CSS files are loaded dynamically per template
 * - No manual registry updates needed
 */

"use client";

import React from "react";
import { ResumeTemplate, ExtendedResumeTemplate, TemplateStyleConfig } from "../configs/resume-templates/template-types";

export interface TemplateConfig {
  template: ResumeTemplate;
  extended: Partial<ExtendedResumeTemplate>;
  cssPath?: string; // Optional path to CSS file
}

/**
 * Template Manifest
 * Update this list when adding a new template
 */
const TEMPLATE_MANIFEST = [
  "atlantic-blue",
  "clean-slate",
  "classic",
  "corporate",
  "executive",
  "harvard",
  "mercury",
  "true-blue",
  "precision-ai",
  "minimalist-bar",
  "hawk",
  "falcon",
  "rhino",
  "berlin",
] as const;

export type TemplateId = (typeof TEMPLATE_MANIFEST)[number];

/**
 * CSS Registry
 * Tracks loaded CSS files to prevent duplicate loading
 */
class CSSRegistry {
  private loadedStyles = new Set<string>();
  private styleElements = new Map<string, HTMLStyleElement>();

  /**
   * Load CSS for a specific template
   * Returns true if CSS was loaded, false if already loaded
   */
  async loadTemplateCSS(templateId: string): Promise<boolean> {
    if (this.loadedStyles.has(templateId)) {
      return false; // Already loaded
    }

    try {
      // Dynamically import CSS file
      const cssModule = await import(
        `../configs/resume-templates/${templateId}/style.css`
      );

      this.loadedStyles.add(templateId);
      return true;
    } catch (error) {
      // CSS file might not exist for this template (optional)
      console.warn(`No CSS file found for template: ${templateId}`);
      return false;
    }
  }

  /**
   * Load inline CSS content
   * Useful for templates that need dynamic CSS
   */
  loadInlineCSS(templateId: string, cssContent: string): void {
    // Remove existing style element if present
    this.unloadTemplateCSS(templateId);

    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-template", templateId);
    styleElement.textContent = cssContent;
    document.head.appendChild(styleElement);

    this.styleElements.set(templateId, styleElement);
    this.loadedStyles.add(templateId);
  }

  /**
   * Unload CSS for a specific template
   */
  unloadTemplateCSS(templateId: string): boolean {
    const styleElement = this.styleElements.get(templateId);
    if (styleElement) {
      styleElement.remove();
      this.styleElements.delete(templateId);
      this.loadedStyles.delete(templateId);
      return true;
    }
    return false;
  }

  /**
   * Check if CSS is loaded for a template
   */
  isLoaded(templateId: string): boolean {
    return this.loadedStyles.has(templateId);
  }

  /**
   * Get all loaded template IDs
   */
  getLoadedTemplates(): string[] {
    return Array.from(this.loadedStyles);
  }
}

// Global CSS registry instance
export const cssRegistry = new CSSRegistry();

/**
 * Template Cache
 * Caches loaded template configurations
 */
class TemplateCache {
  private cache = new Map<string, TemplateConfig>();

  set(templateId: string, config: TemplateConfig): void {
    this.cache.set(templateId, config);
  }

  get(templateId: string): TemplateConfig | undefined {
    return this.cache.get(templateId);
  }

  has(templateId: string): boolean {
    return this.cache.has(templateId);
  }

  clear(): void {
    this.cache.clear();
  }

  getAll(): Map<string, TemplateConfig> {
    return this.cache;
  }
}

// Global template cache
const templateCache = new TemplateCache();

/**
 * Template Loader Class
 * Handles template discovery, loading, and caching
 */
export class TemplateLoader {
  /**
   * Load a single template by ID
   * Includes CSS loading and caching
   */
  static async loadTemplate(templateId: string): Promise<TemplateConfig> {
    // Check cache first
    if (templateCache.has(templateId)) {
      return templateCache.get(templateId)!;
    }

    try {
      // Dynamically import template config
      const configModule = await import(
        `../configs/resume-templates/${templateId}/config`
      );

      // Get the config object (handle different export formats)
      const config =
        configModule.default ||
        configModule[`${templateId.replace(/-/g, "")}Config`] ||
        configModule[`${templateId}Config`];

      if (!config) {
        throw new Error(
          `Template config not found for ${templateId}. Please ensure the template exports a config object.`
        );
      }

      // Cache the template
      templateCache.set(templateId, config);

      // Load CSS (browser only)
      if (typeof window !== "undefined") {
        await cssRegistry.loadTemplateCSS(templateId);
      }

      return config;
    } catch (error) {
      console.error(`Failed to load template ${templateId}:`, error);
      throw new Error(`Template ${templateId} not found or failed to load`);
    }
  }

  /**
   * Load all available templates
   * Returns array of base template objects (without extended config)
   */
  static async loadAllTemplates(): Promise<ResumeTemplate[]> {
    const templates: ResumeTemplate[] = [];

    await Promise.all(
      TEMPLATE_MANIFEST.map(async (templateId) => {
        try {
          const config = await this.loadTemplate(templateId);
          templates.push(config.template);
        } catch (error) {
          console.error(`Failed to load template ${templateId}:`, error);
        }
      })
    );

    return templates;
  }

  /**
   * Load all template configs (with extended configuration)
   * Returns map of templateId -> TemplateConfig
   */
  static async loadAllTemplateConfigs(): Promise<
    Map<string, TemplateConfig>
  > {
    await Promise.all(
      TEMPLATE_MANIFEST.map((templateId) => this.loadTemplate(templateId))
    );

    return templateCache.getAll();
  }

  /**
   * Get extended template configuration
   * Combines base template with extended config and CSS
   */
  static async getExtendedTemplate(
    templateId: string
  ): Promise<ExtendedResumeTemplate> {
    const config = await this.loadTemplate(templateId);

    return {
      ...config.template,
      ...config.extended,
    } as ExtendedResumeTemplate;
  }

  /**
   * Preload template CSS for better performance
   * Useful for template preview/selection pages
   */
  static async preloadTemplateCSS(
    templateIds: string[]
  ): Promise<void> {
    await Promise.all(
      templateIds.map((id) => cssRegistry.loadTemplateCSS(id))
    );
  }

  /**
   * Get template style configuration
   */
  static async getTemplateStyle(
    templateId: string
  ): Promise<TemplateStyleConfig | undefined> {
    const config = await this.loadTemplate(templateId);
    return config.extended.style;
  }

  /**
   * Check if template exists
   */
  static hasTemplate(templateId: string): boolean {
    return TEMPLATE_MANIFEST.includes(templateId as TemplateId);
  }

  /**
   * Get list of all available template IDs
   */
  static getAvailableTemplateIds(): string[] {
    return Array.from(TEMPLATE_MANIFEST);
  }

  /**
   * Validate template ID
   */
  static isValidTemplateId(templateId: string): boolean {
    return TEMPLATE_MANIFEST.includes(templateId as TemplateId);
  }

  /**
   * Clear template cache
   * Useful for development/testing
   */
  static clearCache(): void {
    templateCache.clear();
  }

  /**
   * Load dummy content for a template
   */
  static async loadDummyContent(templateId: string): Promise<any> {
    try {
      const dummyModule = await import(
        `../configs/resume-templates/${templateId}/dummy-content`
      );
      return dummyModule.default || dummyModule.dummyContent;
    } catch (error) {
      console.warn(`No dummy content found for template: ${templateId}`);
      return null;
    }
  }
}

/**
 * React Hook for template loading
 * Handles CSS loading and cleanup
 */
export function useTemplateLoader(templateId: string | null) {
  const [config, setConfig] = React.useState<TemplateConfig | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!templateId) {
      setConfig(null);
      return;
    }

    setLoading(true);
    setError(null);

    TemplateLoader.loadTemplate(templateId)
      .then((loadedConfig) => {
        setConfig(loadedConfig);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [templateId]);

  return { config, loading, error };
}

