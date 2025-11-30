import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { UserProvider } from "@/components/UserProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hello Interview - AI Mock Interview Platform",
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
          <UserProvider>{children}</UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
