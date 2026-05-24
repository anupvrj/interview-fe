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
  Mail,
  Clock,
  Calendar,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function ContactPage() {
  const faqs = [
    {
      question: "What are your operating hours?",
      answer:
        "We operate Monday to Saturday. Our team is available to assist you during business hours.",
      icon: Calendar,
    },
    {
      question: "How long does it take to resolve issues?",
      answer:
        "Your issue will be resolved within 48 to 72 hours. We prioritize all support requests and aim to provide timely solutions.",
      icon: Clock,
    },
    {
      question: "How do I request a refund?",
      answer:
        "You can write an email to us regarding refunds at info@interviewtrix.com. Our team will reach out to you within 48-72 hours to process your request.",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              From resumes and ATS checks to AI Interview Practice, peers, or job search—reach
              out anytime. Our team replies within 48–72 hours.
            </p>
          </div>

          {/* Contact Card */}
          <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
            <Card className="border-2 border-border shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-muted/30">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Email Us
                </CardTitle>
                <CardDescription className="text-base sm:text-lg text-gray-600 mt-2">
                  Send us your questions, feedback, or support requests
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <a
                  href="mailto:info@interviewtrix.com"
                  className="inline-flex items-center gap-3 text-xl sm:text-2xl font-semibold text-primary hover:text-primary transition-colors group"
                >
                  <Mail className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  info@interviewtrix.com
                </a>
                <p className="text-sm text-gray-500 mt-4">
                  We typically respond within 48-72 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-8 sm:mb-12">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>

            <div className="grid gap-6 sm:gap-8">
              {faqs.map((faq, index) => {
                const IconComponent = faq.icon;
                return (
                  <Card
                    key={index}
                    className="border border-gray-200 hover:border-border hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 mb-3">
                            {faq.question}
                          </CardTitle>
                          <CardDescription className="text-base text-gray-600 leading-relaxed">
                            {faq.answer}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Additional Help Section */}
          <div className="mt-12 sm:mt-16 text-center">
            <Card className="border-2 border-border bg-gradient-to-br from-card to-card shadow-lg">
              <CardContent className="py-8 sm:py-12">
                <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                  Need More Help?
                </h3>
                <p className="text-base text-gray-600 mb-6 max-w-xl mx-auto">
                  Check out our comprehensive documentation and guides, or reach
                  out directly for personalized support.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/pricing">
                    <Button className="bg-gradient-to-r from-primary to-primary text-white hover:bg-slate-900 shadow-md hover:shadow-lg transition-all">
                      View Pricing Plans
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
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
