import type { LegalSection } from "../legal";

/** Terms of Service text, moved over verbatim from the legacy page; only the layout around it is new. */
export const TERMS_UPDATED = "February 3, 2026";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    body: (
      <>
                <p>
                  Welcome to Interview Trix. These Terms of Service ("Terms")
                  govern your access to and use of our website, services, and
                  applications (collectively, the "Services"). By accessing or
                  using our Services, you agree to be bound by these Terms.
                </p>
                <p>
                  If you do not agree to these Terms, please do not use our
                  Services. We reserve the right to modify these Terms at any
                  time, and your continued use of the Services constitutes
                  acceptance of any changes.
                </p>
              
      </>
    ),
  },
  {
    id: "account-terms",
    title: "Account Terms",
    body: (
      <>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You must be at least 18 years old to use our Services</li>
                  <li>
                    You are responsible for maintaining the security of your
                    account and password
                  </li>
                  <li>
                    You are responsible for all activities that occur under your
                    account
                  </li>
                  <li>
                    You must provide accurate and complete information when
                    creating an account
                  </li>
                  <li>
                    You may not use the Services for any illegal or unauthorized
                    purpose
                  </li>
                  <li>
                    You must not transmit any malicious code or interfere with
                    the Services
                  </li>
                  <li>
                    One person or legal entity may maintain no more than one
                    free account
                  </li>
                </ul>
              
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    body: (
      <>
                <p className="font-semibold">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Use the Services in any way that violates any applicable law
                    or regulation
                  </li>
                  <li>
                    Impersonate any person or entity or misrepresent your
                    affiliation
                  </li>
                  <li>
                    Interfere with or disrupt the Services or servers or
                    networks connected to the Services
                  </li>
                  <li>
                    Attempt to gain unauthorized access to any portion of the
                    Services
                  </li>
                  <li>
                    Use any automated system to access the Services in a manner
                    that sends more requests than a human can reasonably produce
                  </li>
                  <li>
                    Collect or harvest any personally identifiable information
                    from the Services
                  </li>
                  <li>
                    Share your account credentials with others or allow others
                    to access your account
                  </li>
                </ul>
              
      </>
    ),
  },
  {
    id: "payment-terms",
    title: "Payment Terms",
    body: (
      <>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    All fees are exclusive of applicable taxes unless otherwise
                    stated
                  </li>
                  <li>
                    Payment is due immediately upon purchase of credits or
                    subscription plans
                  </li>
                  <li>
                    Subscription plans automatically renew unless cancelled
                    before the renewal date
                  </li>
                  <li>Credits are non-transferable and have no cash value</li>
                  <li>
                    We reserve the right to change our pricing at any time
                  </li>
                  <li>Refunds are subject to our Refund Policy</li>
                  <li>
                    Failure to pay may result in suspension or termination of
                    your account
                  </li>
                </ul>
              
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    body: (
      <>
                <p>
                  The Services and all content, features, and functionality are
                  owned by Interview Trix and are protected by international
                  copyright, trademark, patent, trade secret, and other
                  intellectual property laws.
                </p>
                <p className="font-semibold mt-4">Your Content:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    You retain all rights to the content you create using our
                    Services
                  </li>
                  <li>
                    You grant us a license to use, store, and process your
                    content to provide the Services
                  </li>
                  <li>
                    You are responsible for ensuring you have the right to use
                    any content you upload
                  </li>
                  <li>
                    We may use aggregated, anonymized data for analytics and
                    service improvement
                  </li>
                </ul>
              
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    body: (
      <>
                <p>
                  To the maximum extent permitted by law, Interview Trix shall
                  not be liable for any indirect, incidental, special,
                  consequential, or punitive damages, or any loss of profits or
                  revenues, whether incurred directly or indirectly, or any loss
                  of data, use, goodwill, or other intangible losses.
                </p>
                <p>
                  The Services are provided "as is" and "as available" without
                  warranties of any kind, either express or implied. We do not
                  guarantee that the Services will be uninterrupted, secure, or
                  error-free.
                </p>
              
      </>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <>
                <p>
                  We may terminate or suspend your account and access to the
                  Services immediately, without prior notice or liability, for
                  any reason, including if you breach these Terms.
                </p>
                <p>
                  Upon termination, your right to use the Services will
                  immediately cease. All provisions of these Terms that by their
                  nature should survive termination shall survive, including
                  ownership provisions, warranty disclaimers, and limitations of
                  liability.
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
                  These Terms shall be governed by and construed in accordance
                  with the laws of India, without regard to its conflict of law
                  provisions. Any disputes arising from these Terms or the
                  Services shall be subject to the exclusive jurisdiction of the
                  courts located in India.
                </p>
              
      </>
    ),
  },
  {
    id: "questions-about-terms",
    title: "Questions About Terms?",
    body: (
      <>
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="bg-white rounded-lg p-4 border border-border">
                  <p className="font-semibold text-slate-900 mb-2">Email:</p>
                  <a
                    href="mailto:info@interviewtrix.com"
                    className="text-primary hover:text-primary font-medium text-lg"
                  >
                    info@interviewtrix.com
                  </a>
                  <p className="text-sm text-gray-600 mt-3">
                    We operate Monday to Saturday and respond within 48-72 hours
                  </p>
                </div>
              
      </>
    ),
  },
];
