"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  AlertCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary rounded-2xl mb-6 shadow-lg">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Refund <span className="text-primary">Policy</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Last updated: February 3, 2026
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-6">
            {/* Overview */}
            <Card className="border-2 border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-primary" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  At Interview Trix, we strive to provide the best service
                  possible. We understand that sometimes things don't work out
                  as planned, and we're here to help. This refund policy
                  outlines the terms and conditions for requesting refunds for
                  our services.
                </p>
              </CardContent>
            </Card>

            {/* Refund Eligibility */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Refund Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Non-Refundable Items */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                  Non-Refundable Items
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Refund Process */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  Refund Process
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Subscription Cancellation */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Subscription Cancellation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-2 border-border bg-gradient-to-br from-card to-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
