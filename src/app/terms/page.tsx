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
  FileText,
  Shield,
  Users,
  AlertCircle,
  Lock,
  Scale,
  Mail,
} from "lucide-react";
import { NavigationMenu } from "@/components/NavigationMenu";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function TermsOfServicePage() {
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Terms of <span className="text-blue-600">Service</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Last updated: February 3, 2026
            </p>
          </div>

          {/* Terms Content */}
          <div className="space-y-6">
            {/* Introduction */}
            <Card className="border-2 border-blue-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Account Terms */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  Account Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Service Usage */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-green-600" />
                  Acceptable Use
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Scale className="w-6 h-6 text-blue-600" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Lock className="w-6 h-6 text-purple-600" />
                  Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
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
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Governing Law
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  These Terms shall be governed by and construed in accordance
                  with the laws of India, without regard to its conflict of law
                  provisions. Any disputes arising from these Terms or the
                  Services shall be subject to the exclusive jurisdiction of the
                  courts located in India.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                  Questions About Terms?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us:
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

      <MarketingFooter />
    </div>
  );
}
