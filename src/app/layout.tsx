import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppGoogleAnalytics } from "@/components/AppGoogleAnalytics";
import { UserProvider } from "@/components/UserProvider";
import { TemplateRegistryInitializer } from "@/components/TemplateRegistryInitializer";
import { getGaMeasurementId } from "@/config/google-analytics";
import { Toaster } from "sonner";
import {
  StructuredData,
  organizationSchema,
  webApplicationSchema,
} from "@/components/StructuredData";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com",
  ),
  title: {
    default:
      "Interview Trix - World Fastest AI Resume Builder | Mock Interview | Job Search",
    template: "%s | Interview Trix",
  },
  description:
    "From ATS-optimized resumes to live AI mock interviews and detailed performance reports — everything you need to get shortlisted and hired.",
  keywords: [
    "resume builder",
    "ATS checker",
    "AI resume",
    "professional resume",
    "resume templates",
    "job application",
    "career tools",
    "resume optimization",
    "free resume builder",
    "ATS-friendly resume",
  ],
  authors: [{ name: "Interview Trix" }],
  creator: "Interview Trix",
  publisher: "Interview Trix",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com",
    title:
      "Interview Trix - World Fastest AI Resume Builder | Mock Interview | Job Search",
    description:
      "From ATS-optimized resumes to live AI mock interviews and detailed performance reports — everything you need to get shortlisted and hired.",
    siteName: "Interview Trix",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Interview Trix - World Fastest AI Resume Builder | Mock Interview | Job Search",
    description:
      "From ATS-optimized resumes to live AI mock interviews and detailed performance reports — everything you need to get shortlisted and hired.",
    creator: "@interviewtrix",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual code from Google Search Console
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = getGaMeasurementId();

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <StructuredData data={organizationSchema} />
          <StructuredData data={webApplicationSchema} />
        </head>
        <body className={inter.className}>
          <AppGoogleAnalytics gaId={gaMeasurementId} />
          <TemplateRegistryInitializer />
          <UserProvider>{children}</UserProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "white",
                color: "#1f2937",
                border: "1px solid #e5e7eb",
                padding: "16px",
                borderRadius: "12px",
                boxShadow:
                  "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              },
              className: "sonner-toast",
            }}
            richColors
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
