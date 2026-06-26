import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Voice Interview Coach — Free Mock Interview Practice',
  description:
    'Practice realistic, voice-based mock interviews with an AI interview coach. Get company-specific questions, role and experience tailoring, English & Hindi support, and instant reports scoring your technical, behavioral, communication, and confidence skills.',
  keywords:
    'AI interview coach, AI voice interview, mock interview practice, AI mock interview, company-specific interview prep, interview preparation, real-time interview feedback, interview report and scores, behavioral interview practice, English Hindi interview practice',
  alternates: {
    canonical: 'https://interviewtrix.com/ai-interview-coach',
  },
  openGraph: {
    title: 'AI Voice Interview Coach — Free Mock Interview Practice | Interview Trix',
    description:
      'Realistic voice-based mock interviews with company-specific questions, instant AI feedback, and detailed performance reports.',
    type: 'website',
    url: 'https://interviewtrix.com/ai-interview-coach',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Voice Interview Coach — Free Mock Interview Practice | Interview Trix',
    description:
      'Realistic voice-based mock interviews with company-specific questions, instant AI feedback, and detailed performance reports.',
  },
};

export default function InterviewCoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
