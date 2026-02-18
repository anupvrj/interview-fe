import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Job Search - Find Your Perfect Job Match | Interview Trix',
  description: 'Discover your ideal job opportunities with AI-powered job search. Get personalized job recommendations, smart matching, and real-time alerts for positions that fit your profile.',
  keywords: 'AI job search, job finder, career opportunities, job matching, job recommendations, job alerts, career search',
  openGraph: {
    title: 'AI Job Search - Find Your Perfect Job Match | Interview Trix',
    description: 'Discover your ideal job opportunities with AI-powered job search. Get personalized recommendations and smart matching.',
    type: 'website',
    url: 'https://interviewtrix.com/ai-job-search',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Job Search - Find Your Perfect Job Match | Interview Trix',
    description: 'Discover your ideal job opportunities with AI-powered job search. Get personalized recommendations and smart matching.',
  },
};

export default function JobSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
