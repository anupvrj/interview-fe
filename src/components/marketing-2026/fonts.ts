import { Caveat, Geist, Geist_Mono } from "next/font/google";

export const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
export const hand = Caveat({ subsets: ["latin"], weight: ["600"], variable: "--font-hand" });
