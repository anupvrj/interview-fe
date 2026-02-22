import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Resume Builder - Create ATS-Optimized Resumes in Minutes | Interview Trix',
  description: 'Build professional, ATS-friendly resumes with AI assistance. Choose from multiple templates, get instant feedback, and land your dream job faster with Interview Trix AI Resume Builder.',
  keywords: 'AI resume builder, ATS resume, professional resume, resume templates, CV builder, job application, career tools',
  openGraph: {
    title: 'AI Resume Builder - Create ATS-Optimized Resumes | Interview Trix',
    description: 'Build professional, ATS-friendly resumes with AI assistance. Choose from multiple templates and land your dream job faster.',
    type: 'website',
    url: 'https://interviewtrix.com/ai-resume-builder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Resume Builder - Create ATS-Optimized Resumes | Interview Trix',
    description: 'Build professional, ATS-friendly resumes with AI assistance. Choose from multiple templates and land your dream job faster.',
  },
};

export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
