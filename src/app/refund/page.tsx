"use client";

import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
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
import { NavigationMenu } from "@/components/NavigationMenu";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white scroll-smooth selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50">
        <div
          className="sm:hidden h-1"
          style={{
            backgroundColor: "rgb(37 99 235 / var(--tw-bg-opacity, 1))",
          }}
        ></div>

        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-4">
                <div className="sm:hidden">
                  <NavigationMenu />
                </div>

                <Link
                  href="/"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity mx-auto sm:mx-0"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        i<span className="text-sm sm:text-base">X</span>
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                      Interview{" "}
                      <span className="text-blue-600">
                        Tri
                        <span className="text-xl sm:text-2xl lg:text-3xl">
                          X
                        </span>
                      </span>
                    </span>
                  </div>
                </Link>

                <div className="sm:hidden w-8"></div>
              </div>

              <div className="hidden sm:flex items-center gap-6 lg:gap-8">
                <Link
                  href="/ai-resume-builder"
                  className="text-sm lg:text-base text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Resume Builder
                </Link>
                <Link
                  href="/ai-interview-coach"
                  className="text-sm lg:text-base text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  AI Interview Coach
                </Link>
                <Link
                  href="/about-us"
                  className="text-sm lg:text-base text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  About us
                </Link>

                <SignedOut>
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      className="text-sm lg:text-base font-medium"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all text-sm lg:text-base">
                      Start Interview
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all text-sm lg:text-base">
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-lg">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Refund <span className="text-blue-600">Policy</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Last updated: February 3, 2026
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-6">
            {/* Overview */}
            <Card className="border-2 border-blue-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
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
                  <Clock className="w-6 h-6 text-blue-600" />
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
                          className="text-blue-600 hover:text-blue-700 font-medium"
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
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  If you have any questions about our refund policy or need
                  assistance with a refund request, please contact us:
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-slate-900 mb-2">Email:</p>
                  <a
                    href="mailto:info@interviewtrix.com"
                    className="text-blue-600 hover:text-blue-700 font-medium text-lg"
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

      {/* Footer Section */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">
                  i<span className="text-sm">X</span>
                </span>
              </div>
              <span className="text-xl font-bold text-white">
                Interview{" "}
                <span className="text-blue-400">
                  Tri<span className="text-2xl">X</span>
                </span>
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6">
              <Link
                href="/about-us"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                About us
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/refund"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Refund policy
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Contact us
              </Link>
            </nav>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              © 2026 Interview Trix. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
