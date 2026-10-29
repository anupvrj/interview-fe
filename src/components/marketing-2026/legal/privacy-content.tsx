import Link from "next/link";
import type { LegalSection } from "../legal";

/** Privacy Policy text, moved over verbatim from the legacy page; only the layout around it is new. */
export const PRIVACY_UPDATED = "September 15, 2026";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    body: (
      <>
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

      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: (
      <>
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
        <li>Job postings you capture with the Chrome extension, and job-match scores</li>
        <li>Peer interview booking and scheduling data</li>
        <li>Payment and subscription status (via Razorpay)</li>
      </ul>
      <p className="font-semibold mt-4">Technical information</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>Device type, browser, and approximate usage logs</li>
        <li>IP address and session identifiers for security</li>
      </ul>

      </>
    ),
  },
  {
    id: "how-we-use-your-information",
    title: "How We Use Your Information",
    body: (
      <>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>Provide and improve the Interview Trix platform</li>
        <li>Deliver AI mock interviews, reports, and resume tools</li>
        <li>Score a job match and help you apply from the Chrome extension when you ask</li>
        <li>Process payments and manage subscriptions</li>
        <li>Send transactional emails (account, billing, bookings)</li>
        <li>Respond to support requests and contact form submissions</li>
        <li>Monitor security, prevent abuse, and comply with law</li>
      </ul>

      </>
    ),
  },
  {
    id: "email-communications",
    title: "Email Communications",
    body: (
      <>
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

      </>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    body: (
      <>
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

      </>
    ),
  },
  {
    id: "cookies-local-storage",
    title: "Cookies & Local Storage",
    body: (
      <>
      <p>
        We use cookies and similar technologies to keep you signed
        in, remember preferences, and understand how the Services are
        used. You can control cookies through your browser settings,
        though some features may not work if cookies are disabled.
      </p>
      <p>
        The Chrome extension also stores data in your browser with{" "}
        <code>chrome.storage.local</code> (captured job text, a
        connect token, a cached profile copy, and the compiled resume
        PDF). That storage is on your device, not in third-party
        cookies.
      </p>

      </>
    ),
  },
  {
    id: "chrome-extension",
    title: "Chrome extension",
    body: (
      <>
      <p>
        The InterviewTrix Chrome extension reads the job posting in
        your current browser tab only when you click{" "}
        <strong>Fetch Job</strong> or{" "}
        <strong>Use selected text</strong>. It does not scan other
        sites in the background.
      </p>
      <p>
        Captured role, company, location, source URL, and job
        description stay in your browser (
        <code>chrome.storage.local</code>) so the sidebar can show
        them and hand them to InterviewTrix.{" "}
        <strong>Tailor Resume</strong> and{" "}
        <strong>Practice Interview</strong> open InterviewTrix in
        your existing signed-in session and use that text to create a
        new resume copy or start a practice interview. Your original
        resume is never overwritten.
      </p>
      <p>
        After you connect the extension on InterviewTrix, it stores a
        session token on your device and can call the InterviewTrix
        API to score a job match. That request sends the captured job
        description and the resume you selected. When you click{" "}
        <strong>Apply Job</strong>, Chrome asks for access to that
        site only (the first time). The extension then loads profile
        fields you saved (name, phone, role, CTC, and experience),
        fills matching visible form fields, and attaches the resume
        PDF you compiled. It does not submit the application for you.
      </p>
      <p>
        We use this data only to provide those features. We do not
        sell it, use it for advertising, or use it to determine
        creditworthiness. No remote code is loaded into the
        extension. You can clear local extension data by
        disconnecting it on InterviewTrix or by removing the
        extension in Chrome.
      </p>

      </>
    ),
  },
  {
    id: "ai-connectors-chatgpt-claude-cursor",
    title: "AI connectors (ChatGPT, Claude, Cursor)",
    body: (
      <>
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

      </>
    ),
  },
  {
    id: "data-retention-your-rights",
    title: "Data Retention & Your Rights",
    body: (
      <>
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

      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    body: (
      <>
      <p>
        This Privacy Policy is governed by the laws of India. Any
        disputes shall be subject to the exclusive jurisdiction of the
        courts located in India.
      </p>

      </>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    body: (
      <>
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

      </>
    ),
  },
];
