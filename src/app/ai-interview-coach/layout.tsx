import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Interview Coach - AI Interview Practice | Interview Trix',
  description:
    'Master your interview skills with AI Interview Practice. Get real-time feedback, detailed performance reports, and personalized coaching to ace your next interview.',
  keywords:
    'AI interview coach, AI Interview Practice, interview practice, interview preparation, AI feedback, career coaching, job interview tips',
  openGraph: {
    title: 'AI Interview Coach - AI Interview Practice | Interview Trix',
    description:
      'Master your interview skills with AI Interview Practice. Get real-time feedback and personalized coaching.',
    type: 'website',
    url: 'https://interviewtrix.com/ai-interview-coach',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Interview Coach - AI Interview Practice | Interview Trix',
    description:
      'Master your interview skills with AI Interview Practice. Get real-time feedback and personalized coaching.',
  },
};

export default function InterviewCoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
