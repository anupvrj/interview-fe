import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AppGoogleAnalytics } from "@/components/AppGoogleAnalytics";
import { UserProvider } from "@/components/UserProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { TemplateRegistryInitializer } from "@/components/TemplateRegistryInitializer";
import { getGaMeasurementId } from "@/config/google-analytics";
import { getClarityProjectId } from "@/config/microsoft-clarity";
import { AppMicrosoftClarity } from "@/components/AppMicrosoftClarity";
import { AppToaster } from "@/components/AppToaster";
import {
  StructuredData,
  organizationSchema,
  webApplicationSchema,
} from "@/components/StructuredData";
import { getSearchRobots } from "@/lib/seo/site-url";
import "./globals.css";

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
  robots: getSearchRobots(),
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
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@100..900&display=swap"
            rel="stylesheet"
          />
          <StructuredData data={organizationSchema} />
          <StructuredData data={webApplicationSchema} />
        </head>
        <body className="font-sans antialiased" suppressHydrationWarning>
          <AppGoogleAnalytics gaId={gaMeasurementId} />
          <AppMicrosoftClarity projectId={clarityProjectId} />
          <TemplateRegistryInitializer />
          <QueryProvider>
            <UserProvider>{children}</UserProvider>
          </QueryProvider>
          <AppToaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
