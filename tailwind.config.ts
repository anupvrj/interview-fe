import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          muted: "hsl(var(--primary-muted))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          border: "hsl(var(--sidebar-border))",
          foreground: "hsl(var(--sidebar-foreground))",
          active: "hsl(var(--sidebar-active))",
        },
        header: "hsl(var(--header))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          muted: "hsl(var(--success-muted))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          muted: "hsl(var(--warning-muted))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          muted: "hsl(var(--info-muted))",
        },
        // Landing page inspired blue palette
        "landing-blue": {
          50: "#F5F8FF",
          100: "#E8EEFF",
          200: "#D5E3FF",
          300: "#C5D5F7",
          400: "#A8BFFF",
          500: "#8BA3FF",
          600: "#6B8AFF",
          700: "#5B7FFF",
          800: "#4A6FEE",
          900: "#3A5FDD",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(47, 43, 61, 0.08)",
        header: "0 4px 18px 0 rgba(47, 43, 61, 0.1)",
        nav: "0 2px 6px 0 rgba(115, 103, 240, 0.45)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        /** Active speaker ring — “beep” / pulse while AI audio plays */
        "ai-avatar-ring": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.45" },
          "50%": { transform: "scale(1.12)", opacity: "0.95" },
        },
        "ai-avatar-inner": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        /** Continuous highlight sweep across progress fill */
        "progress-shimmer": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(320%)" },
        },
        /** Soft pulse on progress fill (combined with shimmer for “alive” bars) */
        "progress-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.88" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.8s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "ai-avatar-ring": "ai-avatar-ring 1.05s ease-in-out infinite",
        "ai-avatar-ring-delayed":
          "ai-avatar-ring 1.05s ease-in-out 0.35s infinite",
        "ai-avatar-inner": "ai-avatar-inner 1.05s ease-in-out infinite",
        "progress-shimmer": "progress-shimmer 2.4s ease-in-out infinite",
        "progress-pulse": "progress-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
