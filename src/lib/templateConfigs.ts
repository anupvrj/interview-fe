/**
 * Template Configurations (Legacy Compatibility)
 * 
 * This file maintains backward compatibility with existing code.
 * It re-exports from the new templateRegistry.ts which imports from individual template folders.
 * 
 * @deprecated Use templateRegistry.ts directly for new code
 * @see TEMPLATE_DEVELOPMENT_GUIDE.md for the new structure
 */

import {
  TEMPLATE_REGISTRY,
  getExtendedTemplate,
  hasFeature,
  getTemplateStyleConfig,
  getAvailableTemplateIds,
  isValidTemplateId,
  getAvailableTemplates,
  getTemplateById,
} from "./templateRegistry";

/**
 * Template configuration registry
 * Re-exported from templateRegistry for backward compatibility
 */
export const TEMPLATE_CONFIGS = TEMPLATE_REGISTRY;

/**
 * Get extended template configuration
 * Re-exported from templateRegistry for backward compatibility
 */
export { getExtendedTemplate };

/**
 * Check if template has a specific feature
 * Re-exported from templateRegistry for backward compatibility
 */
export { hasFeature };

/**
 * Get template style configuration
 * Re-exported from templateRegistry for backward compatibility
 */
export { getTemplateStyleConfig };

/**
 * Additional utility functions
 */
export {
  getAvailableTemplateIds,
  isValidTemplateId,
  getAvailableTemplates,
  getTemplateById,
};
