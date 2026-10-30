import type { LegalSection } from "../legal";

/** Refund Policy text, moved over verbatim from the legacy page; only the layout around it is new. */
export const REFUND_UPDATED = "February 3, 2026";

export const REFUND_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
                <p>
                  At Interview Trix, we strive to provide the best service
                  possible. We understand that sometimes things don't work out
                  as planned, and we're here to help. This refund policy
                  outlines the terms and conditions for requesting refunds for
                  our services.
                </p>
              
      </>
    ),
  },
  {
    id: "refund-eligibility",
    title: "Refund Eligibility",
    body: (
      <>
                <p className="font-semibold">
                  You may be eligible for a refund if:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    You experience technical issues that prevent you from using
                    our services
                  </li>
                  <li>
                    You request a refund within 7 days of purchase for
                    subscription plans
                  </li>
                  <li>
                    The service did not meet the description provided at the
                    time of purchase
                  </li>
                  <li>
                    You were charged incorrectly or multiple times for the same
                    service
                  </li>
                </ul>
              
      </>
    ),
  },
  {
    id: "non-refundable-items",
    title: "Non-Refundable Items",
    body: (
      <>
                <p className="font-semibold">
                  Refunds will not be provided for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Credits that have already been used or consumed</li>
                  <li>Subscription renewals after the 7-day refund period</li>
                  <li>Services that have been fully delivered and utilized</li>
                  <li>
                    Refund requests made after 30 days from the date of purchase
                  </li>
                  <li>
                    Change of mind or buyer's remorse after using the service
                  </li>
                </ul>
              
      </>
    ),
  },
  {
    id: "refund-process",
    title: "Refund Process",
    body: (
      <>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      How to Request a Refund:
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>
                        Send an email to{" "}
                        <a
                          href="mailto:info@interviewtrix.com"
                          className="text-primary hover:text-primary font-medium"
                        >
                          info@interviewtrix.com
                        </a>
                      </li>
                      <li>
                        Include your account details and order information
                      </li>
                      <li>Provide a detailed reason for your refund request</li>
                      <li>
                        Our team will review your request within 48-72 hours
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      Processing Time:
                    </h4>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Refund requests are reviewed within 48-72 hours</li>
                      <li>
                        Approved refunds are processed within 5-10 business days
                      </li>
                      <li>Refunds are issued to the original payment method</li>
                      <li>
                        Bank processing times may vary (typically 3-7 business
                        days)
                      </li>
                    </ul>
                  </div>
                </div>
              
      </>
    ),
  },
  {
    id: "subscription-cancellation",
    title: "Subscription Cancellation",
    body: (
      <>
                <p>
                  You can cancel your subscription at any time from your account
                  dashboard. Upon cancellation:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    You will retain access to paid features until the end of
                    your current billing period
                  </li>
                  <li>
                    No further charges will be made after the current period
                    ends
                  </li>
                  <li>
                    Partial refunds for unused time are not provided unless
                    within the 7-day refund window
                  </li>
                </ul>
              
      </>
    ),
  },
  {
    id: "need-help",
    title: "Need Help?",
    body: (
      <>
                <p className="mb-4">
                  If you have any questions about our refund policy or need
                  assistance with a refund request, please contact us:
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
