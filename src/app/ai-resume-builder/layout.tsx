import type { Metadata } from "next";
import { resumeBuilderDemoVideo } from "@/lib/seo/marketing-video-content";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title:
    "AI Resume Builder - Create ATS-Optimized Resumes in Minutes | Interview Trix",
  description:
    "Build professional, ATS-friendly resumes with AI assistance. Choose from multiple templates, get instant feedback, and land your dream job faster with Interview Trix AI Resume Builder.",
  keywords:
    "AI resume builder, ATS resume, professional resume, resume templates, CV builder, job application, career tools",
  openGraph: {
    title: "AI Resume Builder - Create ATS-Optimized Resumes | Interview Trix",
    description:
      "Build professional, ATS-friendly resumes with AI assistance. Choose from multiple templates and land your dream job faster.",
    type: "website",
    url: `${siteUrl}/ai-resume-builder`,
    videos: [
      {
        url: resumeBuilderDemoVideo.videoUrl,
        width: 1280,
        height: 720,
        type: "video/mp4",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Builder - Create ATS-Optimized Resumes | Interview Trix",
    description:
      "Build professional, ATS-friendly resumes with AI assistance. Choose from multiple templates and land your dream job faster.",
  },
  alternates: {
    canonical: `${siteUrl}/ai-resume-builder`,
  },
};

export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
