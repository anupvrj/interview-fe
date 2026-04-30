import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans - Choose Your Perfect Plan | Interview Trix',
  description: 'Flexible pricing plans for every career stage. Get access to AI resume builder, AI Interview Practice, job search, and more. Start free or choose a plan that fits your needs.',
  keywords: 'pricing, plans, subscription, career tools pricing, interview preparation cost, resume builder pricing',
  openGraph: {
    title: 'Pricing Plans - Choose Your Perfect Plan | Interview Trix',
    description: 'Flexible pricing plans for every career stage. Start free or choose a plan that fits your needs.',
    type: 'website',
    url: 'https://interviewtrix.com/pricing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing Plans - Choose Your Perfect Plan | Interview Trix',
    description: 'Flexible pricing plans for every career stage. Start free or choose a plan that fits your needs.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
