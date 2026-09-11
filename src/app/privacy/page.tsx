"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Mail,
  Database,
  Cookie,
  Share2,
  Lock,
  Bell,
  Trash2,
  Puzzle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />

      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary rounded-2xl mb-6 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Privacy <span className="text-primary">Policy</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Last updated: August 30, 2026
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Interview Trix (&quot;we&quot;, &quot;us&quot;, or
                  &quot;our&quot;) operates{" "}
                  <Link href="/" className="text-primary hover:underline">
                    interviewtrix.com
                  </Link>{" "}
                  and related services (collectively, the
                  &quot;Services&quot;). This Privacy Policy explains what
                  information we collect, how we use it, and the choices you
                  have.
                </p>
                <p>
                  By using our Services, you agree to the collection and use of
                  information in accordance with this policy. If you do not
                  agree, please do not use the Services.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Database className="w-6 h-6 text-primary" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p className="font-semibold">Account information</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name and email address (via Clerk authentication)</li>
                  <li>Profile details you provide (role, experience, skills)</li>
                  <li>Phone number if you choose to add it</li>
                </ul>
                <p className="font-semibold mt-4">Usage information</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mock interview sessions, scores, and feedback</li>
                  <li>Resume content you create or upload</li>
                  <li>Peer interview booking and scheduling data</li>
                  <li>Payment and subscription status (via Razorpay)</li>
                </ul>
                <p className="font-semibold mt-4">Technical information</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Device type, browser, and approximate usage logs</li>
                  <li>IP address and session identifiers for security</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-green-600" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and improve the Interview Trix platform</li>
                  <li>Deliver AI mock interviews, reports, and resume tools</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send transactional emails (account, billing, bookings)</li>
                  <li>Respond to support requests and contact form submissions</li>
                  <li>Monitor security, prevent abuse, and comply with law</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Bell className="w-6 h-6 text-primary" />
                  Email Communications
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  We send <strong>transactional email only</strong> — for
                  example welcome messages, payment confirmations, trial or
                  subscription reminders, and peer interview booking updates.
                  We do not sell email lists or send unsolicited marketing
                  campaigns.
                </p>
                <p>
                  Every email explains why you received it. You can contact us
                  at{" "}
                  <a
                    href="mailto:info@interviewtrix.com"
                    className="text-primary hover:underline"
                  >
                    info@interviewtrix.com
                  </a>{" "}
                  or delete your account to stop future communications.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Lock className="w-6 h-6 text-purple-600" />
                  Third-Party Services
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>We use trusted providers to operate the Services:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Clerk</strong> — authentication and account
                    management
                  </li>
                  <li>
                    <strong>Razorpay</strong> — payment processing
                  </li>
                  <li>
                    <strong>Amazon Web Services</strong> — hosting, storage, and
                    transactional email (SES)
                  </li>
                  <li>
                    <strong>Google Workspace / Google Cloud</strong> — calendar
                    and meeting integrations where enabled
                  </li>
                </ul>
                <p>
                  These providers process data only as needed to deliver their
                  services to us and are bound by their own privacy policies.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Cookie className="w-6 h-6 text-amber-600" />
                  Cookies &amp; Local Storage
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  We use cookies and similar technologies to keep you signed
                  in, remember preferences, and understand how the Services are
                  used. You can control cookies through your browser settings,
                  though some features may not work if cookies are disabled.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Puzzle className="w-6 h-6 text-primary" />
                  Chrome extension
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  The InterviewTrix Chrome extension reads the job posting in
                  your current browser tab only when you click{" "}
                  <strong>Fetch Job</strong> or{" "}
                  <strong>Use selected text</strong>. It does not scan pages in
                  the background.
                </p>
                <p>
                  The extension stores the role, company, location, source URL,
                  and job description in your browser (
                  <code>chrome.storage.local</code>) so you can reopen the
                  popup or hand the job off to InterviewTrix. When you choose{" "}
                  <strong>Tailor Resume</strong> or{" "}
                  <strong>Practice Interview</strong>, InterviewTrix opens in
                  your existing signed-in session and uses that captured text
                  to create a new resume copy or start a practice interview.
                </p>
                <p>
                  The extension does not call the InterviewTrix API itself, does
                  not sell captured job text, and does not use it for
                  advertising. You can clear it by dismissing the capture in
                  the web app or by removing the extension.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-primary" />
                  AI connectors (ChatGPT, Claude, Cursor)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  If you connect Interview Trix from ChatGPT, Claude, Cursor, or
                  another AI client, that client can call Interview Trix on your
                  behalf using a token you mint or an OAuth Connect you approve.
                </p>
                <p>
                  Depending on the tools you allow, the client may read your
                  plan and credits, list or import resumes (including contact
                  details already stored on those resumes), issue a short-lived
                  download link for a resume PDF you already generated, run ATS
                  scoring, create mock interviews, and fetch interview reports.
                  Interviews themselves still run on Interview Trix, not inside
                  the AI chat.
                </p>
                <p>
                  You can revoke connector tokens at any time from{" "}
                  <Link
                    href="/dashboard/profile/connectors"
                    className="text-primary hover:underline"
                  >
                    Profile → AI connectors
                  </Link>
                  . Disconnecting the plugin in ChatGPT does not delete your
                  Interview Trix account or past interviews.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Trash2 className="w-6 h-6 text-red-600" />
                  Data Retention &amp; Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  We retain your data while your account is active and as
                  needed to provide the Services, comply with legal obligations,
                  or resolve disputes.
                </p>
                <p>You may request to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access or update your profile information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
                <p>
                  Contact{" "}
                  <a
                    href="mailto:info@interviewtrix.com"
                    className="text-primary hover:underline"
                  >
                    info@interviewtrix.com
                  </a>{" "}
                  for privacy-related requests. We respond within 48–72 business
                  hours.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Governing Law
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p>
                  This Privacy Policy is governed by the laws of India. Any
                  disputes shall be subject to the exclusive jurisdiction of the
                  courts located in India.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border bg-gradient-to-br from-card to-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Questions about this Privacy Policy? Reach us at:
                </p>
                <div className="bg-white rounded-lg p-4 border border-border">
                  <p className="font-semibold text-slate-900 mb-2">Email:</p>
                  <a
                    href="mailto:info@interviewtrix.com"
                    className="text-primary hover:text-primary font-medium text-lg"
                  >
                    info@interviewtrix.com
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
