import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { UserProvider } from "@/components/UserProvider";
import { TemplateRegistryInitializer } from "@/components/TemplateRegistryInitializer";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview Trix - AI Mock Interview Platform",
  description:
    "Ace your next interview with AI-powered mock interviews. Get personalized feedback, behavioral analysis, and continuous learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
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
