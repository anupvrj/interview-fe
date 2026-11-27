import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Resume Free | Interview Trix",
  robots: { index: false, follow: true },
};

export default function ResumeBuilderStartLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
