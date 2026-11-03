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
import { ensureResumeSharedStyles } from "@/lib/resume-fonts";

import React from "react";
import { ResumeTemplate, ExtendedResumeTemplate, TemplateStyleConfig } from "../configs/resume-templates/template-types";
import {
  applyConfigOverrides,
  applyCssOverrides,
  type PublishedTemplateOverrides,
  type ResumeTemplateOverrides,
} from "./resume-template-overrides";

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
  "confident-grid",
  "saffron-line",
  "condensed-rule",
  "royal-indigo",
  "meridian",
  "amber-edge",
  "navy-frame",
  "cobalt-stream",
  "ember-timeline",
] as const;

export type TemplateId = (typeof TEMPLATE_MANIFEST)[number];

/**
 * CSS Registry
 * Tracks loaded CSS files to prevent duplicate loading
 */
class CSSRegistry {
  private loadedStyles = new Set<string>();
  private styleElements = new Map<string, HTMLStyleElement>();
  private activeTemplateId: string | null = null;

  /** Stylesheets as fetched, so a new set of edits doesn't refetch them. */
  private rawCss = new Map<string, string>();
  /** Latest load per template: an older load that finishes later must not overwrite it. */
  private loadSeq = new Map<string, number>();

  private async fetchRawCss(templateId: string): Promise<string> {
    const cached = this.rawCss.get(templateId);
    if (cached !== undefined) return cached;
    const origin = window.location.origin;
    const response = await fetch(
      `${origin}/resume-templates/${templateId}/style.css`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(`Template CSS not found (${response.status})`);
    }

    let css = await response.text();

    css += `\n/* Template parity: page gutters from config.style.padding (ResumeRenderer inline mm) */\n.${templateId}-template { box-sizing: border-box; }\n`;

    if (templateId === "mercury") {
      try {
        const overrides = await fetch(
          `${origin}/resume-templates/mercury/mercury-overrides.css`,
          { cache: "no-store" },
        );
        if (overrides.ok) {
          css += `\n${await overrides.text()}`;
        }
      } catch {
        /* optional */
      }
    }
    this.rawCss.set(templateId, css);
    return css;
  }

  /**
   * Load CSS for a specific template via public URL so it can be removed on switch.
   * Super Admin's published edits (colours, font) are applied; pass `overrides` to show
   * other edits instead (the admin preview). Returns true if CSS was (re)loaded.
   */
  async loadTemplateCSS(
    templateId: string,
    options?: { overrides?: ResumeTemplateOverrides | null },
  ): Promise<boolean> {
    if (typeof window === "undefined") {
      return false;
    }
    ensureResumeSharedStyles();

    const seq = (this.loadSeq.get(templateId) ?? 0) + 1;
    this.loadSeq.set(templateId, seq);
    const stale = () => this.loadSeq.get(templateId) !== seq;

    const explicit = options?.overrides !== undefined;
    const overrides = explicit ? options?.overrides ?? null : await publishedTemplateOverrides(templateId);
    if (stale()) return false;
    const editsKey = explicit
      ? `draft:${JSON.stringify(overrides)}`
      : `rev:${(overrides as PublishedTemplateOverrides | null)?.revision ?? 0}`;
    const existing = this.styleElements.get(templateId);
    const sameEdits = existing?.getAttribute("data-edits") === editsKey;

    if (this.activeTemplateId === templateId && this.loadedStyles.has(templateId) && sameEdits) {
      return false;
    }

    if (this.activeTemplateId && this.activeTemplateId !== templateId) {
      this.unloadTemplateCSS(this.activeTemplateId);
    }

    if (existing && sameEdits) {
      this.activeTemplateId = templateId;
      this.loadedStyles.add(templateId);
      return false;
    }

    try {
      const raw = await this.fetchRawCss(templateId);
      const baseFont = overrides?.fontFamily ? (await TemplateLoader.loadCodeTemplate(templateId)).extended.style?.fontFamily : undefined;
      if (stale()) return false;
      const css = applyCssOverrides(raw, overrides, baseFont);

      const styleElement = this.styleElements.get(templateId) ?? document.createElement("style");
      styleElement.setAttribute("data-template", templateId);
      styleElement.setAttribute("data-edits", editsKey);
      styleElement.textContent = css;
      if (!styleElement.isConnected) document.head.appendChild(styleElement);

      this.styleElements.set(templateId, styleElement);
      this.loadedStyles.add(templateId);
      this.activeTemplateId = templateId;
      return true;
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[templates] CSS not loaded for "${templateId}". Run: npm run copy-template-css`,
        );
      }
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
      if (this.activeTemplateId === templateId) {
        this.activeTemplateId = null;
      }
      return true;
    }
    if (this.loadedStyles.has(templateId)) {
      this.loadedStyles.delete(templateId);
      if (this.activeTemplateId === templateId) {
        this.activeTemplateId = null;
      }
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

// Global template cache (with Super Admin's edits applied)
const templateCache = new TemplateCache();
/** Template configs exactly as the template files export them. */
const codeCache = new Map<string, TemplateConfig>();
/** Edit revision each cached config was built with. */
const cachedRevision = new Map<string, number>();

/**
 * Super Admin's published edits for one template. Waits at most a moment for the API; the
 * template then renders as coded rather than holding up the page.
 */
export async function publishedTemplateOverrides(templateId: string): Promise<PublishedTemplateOverrides | null> {
  if (typeof window === "undefined") return null;
  try {
    const { fetchResumeTemplateAvailability } = await import("./resume-template-availability");
    const settings = await Promise.race([
      fetchResumeTemplateAvailability(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    return settings?.overrides?.[templateId] ?? null;
  } catch {
    return null;
  }
}

/**
 * Template Loader Class
 * Handles template discovery, loading, and caching
 */
export class TemplateLoader {
  /**
   * Load a single template by ID
   * Includes CSS loading and caching
   */
  static async loadTemplate(
    templateId: string,
    options?: { loadCSS?: boolean },
  ): Promise<TemplateConfig> {
    const overrides = await publishedTemplateOverrides(templateId);
    const revision = overrides?.revision ?? 0;

    // Check cache first
    if (templateCache.has(templateId) && cachedRevision.get(templateId) === revision) {
      return templateCache.get(templateId)!;
    }

    try {
      const code = await this.loadCodeTemplate(templateId);
      const config = applyConfigOverrides(code, overrides);

      // Cache the template
      templateCache.set(templateId, config);
      cachedRevision.set(templateId, revision);

      // Load CSS on demand (browser only) — skip during bulk registry warmup
      if (typeof window !== "undefined" && options?.loadCSS !== false) {
        await cssRegistry.loadTemplateCSS(templateId);
      }

      return config;
    } catch (error) {
      console.error(`Failed to load template ${templateId}:`, error);
      throw new Error(`Template ${templateId} not found or failed to load`);
    }
  }

  /** The template as its files export it, before Super Admin's edits. */
  static async loadCodeTemplate(templateId: string): Promise<TemplateConfig> {
    const cached = codeCache.get(templateId);
    if (cached) return cached;
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
    codeCache.set(templateId, config);
    return config;
  }

  /** Already-loaded config (with edits) for the renderer's synchronous lookups. */
  static peek(templateId: string): TemplateConfig | undefined {
    return templateCache.get(templateId);
  }

  /** Already-loaded code config (no edits). */
  static peekCode(templateId: string): TemplateConfig | undefined {
    return codeCache.get(templateId);
  }

  /**
   * Load all available templates
   * Returns array of base template objects (without extended config)
   */
  static async loadAllTemplates(): Promise<ResumeTemplate[]> {
    // Manifest order, whichever import finishes first.
    const loaded = await Promise.all(
      TEMPLATE_MANIFEST.map(async (templateId) => {
        try {
          const config = await this.loadTemplate(templateId);
          return config.template;
        } catch (error) {
          console.error(`Failed to load template ${templateId}:`, error);
          return null;
        }
      })
    );

    return loaded.filter((template): template is ResumeTemplate => template !== null);
  }

  /**
   * Load all template configs (with extended configuration)
   * Returns map of templateId -> TemplateConfig
   */
  static async loadAllTemplateConfigs(): Promise<
    Map<string, TemplateConfig>
  > {
    await Promise.all(
      TEMPLATE_MANIFEST.map((templateId) =>
        this.loadTemplate(templateId, { loadCSS: false }),
      ),
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
    cachedRevision.clear();
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

