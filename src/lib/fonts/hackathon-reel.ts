import { Geist, Geist_Mono, Michroma } from "next/font/google";

/** Reel-style type for the hackathon page: Michroma headings, Geist body, Geist Mono labels / counters. */
export const hackathonDisplay = Michroma({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hk-display",
  display: "swap",
});

export const hackathonSans = Geist({
  subsets: ["latin"],
  variable: "--font-hk-sans",
  display: "swap",
});

export const hackathonMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-hk-mono",
  display: "swap",
});

/** All three reel font variables, for elements rendered outside the hackathon layout (dialogs portal to <body>). */
export const hackathonReelFontVars = `${hackathonDisplay.variable} ${hackathonSans.variable} ${hackathonMono.variable}`;
