"use client";

import { useEffect } from "react";
import { initializeTemplateRegistry } from "@/lib/templateRegistry";

/**
 * Initializes the template registry on app load
 * This ensures templates are preloaded for better performance
 */
export function TemplateRegistryInitializer() {
  useEffect(() => {
    const initRegistry = async () => {
      try {
        await initializeTemplateRegistry();
        console.log("✅ Template registry initialized");
      } catch (error) {
        console.error("❌ Failed to initialize template registry:", error);
      }
    };

    initRegistry();
  }, []);

  return null; // This component doesn't render anything
}

