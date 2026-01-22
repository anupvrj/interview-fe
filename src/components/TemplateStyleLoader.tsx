/**
 * Template Style Loader Component
 * 
 * Dynamically loads and injects CSS for resume templates.
 * Ensures only the active template's styles are loaded to prevent conflicts.
 * 
 * Usage:
 * ```tsx
 * <TemplateStyleLoader templateId="classic" />
 * ```
 */

"use client";

import React, { useEffect, useState } from "react";
import { cssRegistry } from "@/lib/templateLoader";

interface TemplateStyleLoaderProps {
  templateId: string | null;
}

/**
 * TemplateStyleLoader Component
 * Loads CSS file for the specified template
 */
export function TemplateStyleLoader({ templateId }: TemplateStyleLoaderProps) {
  useEffect(() => {
    if (!templateId) return;

    // Load CSS for the current template
    let mounted = true;

    cssRegistry.loadTemplateCSS(templateId).then((loaded) => {
      if (mounted && loaded) {
        console.log(`✓ Loaded CSS for template: ${templateId}`);
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      // Note: We don't unload CSS on unmount to avoid flickering
      // CSS is scoped by template class names, so multiple templates can coexist
    };
  }, [templateId]);

  return null; // This is a utility component with no visual output
}

/**
 * React Hook for Template Style Loading
 * 
 * Usage:
 * ```tsx
 * const { loaded, error } = useTemplateStyle('classic');
 * ```
 */
export function useTemplateStyle(templateId: string | null) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!templateId) {
      setLoaded(false);
      return;
    }

    // Check if already loaded
    if (cssRegistry.isLoaded(templateId)) {
      setLoaded(true);
      return;
    }

    // Load CSS
    cssRegistry
      .loadTemplateCSS(templateId)
      .then(() => {
        setLoaded(true);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setLoaded(false);
      });
  }, [templateId]);

  return { loaded, error };
}

/**
 * Higher-Order Component for Template Style Loading
 * 
 * Usage:
 * ```tsx
 * const ResumeEditorWithStyles = withTemplateStyles(ResumeEditor);
 * <ResumeEditorWithStyles templateId="classic" />
 * ```
 */
export function withTemplateStyles<P extends { templateId?: string }>(
  Component: React.ComponentType<P>
) {
  return function TemplateStyledComponent(props: P) {
    const templateId = props.templateId || null;

    return (
      <>
        <TemplateStyleLoader templateId={templateId} />
        <Component {...props} />
      </>
    );
  };
}

