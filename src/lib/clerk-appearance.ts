import type { Appearance } from "@clerk/types";

const sharedVariables: Appearance["variables"] = {
  colorPrimary: "#2563EB",
  colorText: "#2F3349",
  colorTextSecondary: "#6D6B77",
  colorBackground: "#FFFFFF",
  colorInputBackground: "#FFFFFF",
  colorInputText: "#2F3349",
  colorNeutral: "#DBDADE",
  borderRadius: "0.625rem",
  fontFamily: "inherit",
  spacingUnit: "1rem",
};

/** Dashboard / marketing UserButton popovers */
export const clerkAppearance: Appearance = {
  variables: sharedVariables,
  elements: {
    rootBox: "w-full",
    card: "shadow-none border-0 bg-transparent p-0 w-full",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "border border-border bg-card text-foreground shadow-sm hover:bg-muted",
    formButtonPrimary:
      "bg-primary text-primary-foreground shadow-sm hover:bg-slate-900 normal-case",
    formFieldInput:
      "h-11 w-full rounded-[0.625rem] border border-input bg-card px-4 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20",
    formFieldLabel: "text-sm font-medium text-foreground",
    footerActionLink: "text-primary hover:text-primary/80",
    identityPreviewEditButton: "text-primary",
    userButtonPopoverCard: "border border-border shadow-header",
    userButtonAvatarBox: "ring-2 ring-primary/20",
  },
};

/** Sign-in / sign-up — flat inside AuthCardLayout, modern controls */
export const clerkAuthAppearance: Appearance = {
  variables: {
    ...sharedVariables,
    borderRadius: "0.625rem",
  },
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
    showOptionalFields: false,
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full gap-0 border-0 bg-transparent p-0 shadow-none",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    logoBox: "hidden",
    logoImage: "hidden",
    main: "flex w-full flex-col items-stretch gap-5 px-0 py-0 text-left",
    form: "flex w-full flex-col items-stretch gap-5 text-left",
    formFieldRow: "mb-0 flex w-full flex-col items-stretch gap-2 text-left",
    formFieldLabelRow: "mb-0 flex w-full justify-start text-left",
    formFieldLabel:
      "block w-full text-left text-sm font-medium leading-snug text-[#2F3349] dark:text-[#E8E8EA]",
    formFieldInput:
      "h-11 w-full rounded-[0.625rem] border border-input bg-card px-4 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
    formFieldInputShowPasswordButton:
      "text-muted-foreground hover:text-foreground",
    formButtonPrimary:
      "h-11 w-full rounded-[0.625rem] bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-slate-900 hover:shadow-md normal-case",
    formButtonReset:
      "h-11 w-full rounded-[0.625rem] text-sm font-medium normal-case",
    dividerRow: "my-1 gap-3",
    dividerLine: "bg-border",
    dividerText: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
    socialButtons: "flex w-full flex-col gap-3",
    socialButtonsBlockButton:
      "relative h-11 w-full overflow-visible rounded-[0.625rem] border border-border bg-card pr-3 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-muted/50",
    socialButtonsBlockButtonText: "text-left text-sm font-medium",
    socialButtonsProviderIcon: "h-5 w-5",
    footer: "hidden",
    footerAction: "hidden",
    footerActionLink: "text-sm font-medium text-primary hover:text-primary/80",
    identityPreview: "rounded-[0.625rem] border border-border bg-muted/30",
    identityPreviewText: "text-sm text-foreground",
    identityPreviewEditButton: "text-sm font-medium text-primary",
    otpCodeFieldInput:
      "h-11 rounded-[0.625rem] border border-input text-sm",
    formResendCodeLink: "text-sm font-medium text-primary hover:underline",
    formFieldAction: "text-sm font-medium text-primary hover:underline",
    alternativeMethodsBlockButton:
      "h-11 rounded-[0.625rem] border border-border text-sm font-medium",
    backLink: "text-sm font-medium text-muted-foreground hover:text-primary",
    badge:
      "whitespace-nowrap rounded-md bg-info-muted px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-primary",
  },
};
