import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppGoogleAnalytics } from "@/components/AppGoogleAnalytics";
import { UserProvider } from "@/components/UserProvider";
import { TemplateRegistryInitializer } from "@/components/TemplateRegistryInitializer";
import { getGaMeasurementId } from "@/config/google-analytics";
import { getClarityProjectId } from "@/config/microsoft-clarity";
import { AppMicrosoftClarity } from "@/components/AppMicrosoftClarity";
import { Toaster } from "sonner";
import {
  StructuredData,
  organizationSchema,
  webApplicationSchema,
} from "@/components/StructuredData";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://interviewtrix.com",
  ),
  title: {
    default:
      "Interview Trix - World Fastest AI Resume Builder | AI Interview Practice | Job Search",
    template: "%s | Interview Trix",
  },
  description:
    "From ATS-optimized resumes to AI Interview Practice and detailed performance reports — everything you need to get shortlisted and hired.",
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
      "Interview Trix - World Fastest AI Resume Builder | AI Interview Practice | Job Search",
    description:
      "From ATS-optimized resumes to AI Interview Practice and detailed performance reports — everything you need to get shortlisted and hired.",
    siteName: "Interview Trix",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Interview Trix - World Fastest AI Resume Builder | AI Interview Practice | Job Search",
    description:
      "From ATS-optimized resumes to AI Interview Practice and detailed performance reports — everything you need to get shortlisted and hired.",
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
  icons: {
    icon: [{ url: "/brand/interviewtrix-icon.png", type: "image/png" }],
    apple: [{ url: "/brand/interviewtrix-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = getGaMeasurementId();
  const clarityProjectId = getClarityProjectId();

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <StructuredData data={organizationSchema} />
          <StructuredData data={webApplicationSchema} />
        </head>
        <body className={publicSans.className} suppressHydrationWarning>
          <AppGoogleAnalytics gaId={gaMeasurementId} />
          <AppMicrosoftClarity projectId={clarityProjectId} />
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
