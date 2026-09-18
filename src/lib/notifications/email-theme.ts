/** Mirrors backend EmailThemeSettings for Notification Hub UI. */
export interface EmailThemeSettings {
  desktopMaxWidth: number;
  mobileBreakpoint: number;
  contentPadding: number;
  mobileContentPadding: number;
  fontFamily: string;
  bodyFontSize: number;
  lineHeight: number;
  h1FontSize: number;
  h2FontSize: number;
  h3FontSize: number;
  eyebrowFontSize: number;
  footerFontSize: number;
  taglineFontSize: number;
  copyrightFontSize: number;
  brandColor: string;
  brandLightColor: string;
  bodyTextColor: string;
  mutedTextColor: string;
  backgroundColor: string;
  scaleTypographyOnMobile: boolean;
  stackButtonsOnMobile: boolean;
}

export const DEFAULT_EMAIL_THEME: EmailThemeSettings = {
  desktopMaxWidth: 600,
  mobileBreakpoint: 480,
  contentPadding: 32,
  mobileContentPadding: 18,
  fontFamily:
    "system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  bodyFontSize: 15,
  lineHeight: 1.65,
  h1FontSize: 24,
  h2FontSize: 20,
  h3FontSize: 18,
  eyebrowFontSize: 11,
  footerFontSize: 12,
  taglineFontSize: 20,
  copyrightFontSize: 11,
  brandColor: "#7367F0",
  brandLightColor: "#9E95F5",
  bodyTextColor: "#4b4b57",
  mutedTextColor: "#8a8a96",
  backgroundColor: "#f0eef8",
  scaleTypographyOnMobile: true,
  stackButtonsOnMobile: true,
};

export function mergeEmailTheme(
  globalTheme?: Partial<EmailThemeSettings> | null,
  override?: Partial<EmailThemeSettings> | null,
): EmailThemeSettings {
  return {
    ...DEFAULT_EMAIL_THEME,
    ...(globalTheme || {}),
    ...(override || {}),
  };
}

export type PreviewViewport = "desktop" | "mobile";

export const PREVIEW_VIEWPORTS: Record<
  PreviewViewport,
  { label: string; width: number }
> = {
  desktop: { label: "Desktop", width: 640 },
  mobile: { label: "Mobile", width: 390 },
};
