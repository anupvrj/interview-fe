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
  Mic,
  TrendingUp,
  Award,
  Brain,
  Clock,
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Star,
  Users,
  Zap,
  FileText,
  Video,
  MessageSquare,
  Check,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { PlansSection } from "@/components/PlansSection";
import { ScrollSection } from "@/components/ScrollSection";
import { NavigationMenu } from "@/components/NavigationMenu";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Easy Interview
              </span>
            </Link>
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Navigation Menu */}
              <NavigationMenu />
              <SignedOut>
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-4"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all text-xs sm:text-sm px-2 sm:px-4"
                  >
                    Get Started
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="hidden md:block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-4"
                  >
                    Dashboard
                  </Button>
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10",
                    },
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full text-purple-700 font-semibold text-xs sm:text-sm border border-purple-200 shadow-sm">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-purple-600 text-purple-600" />
            <span>India's #1 AI Interview Coach</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
            Ace Your Next{" "}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
              Interview
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            Realistic AI-powered voice mock interviews with behavioral analysis,
            personalized feedback, and continuous learning. Built for Indian
            students targeting TCS, Infosys, Wipro, and more.
          </p>
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-4">
            <Link href="/sign-up" className="w-auto">
              <Button
                variant="gradient"
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-3.5"
              >
                Start Free Interview
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5" />
              </Button>
            </Link>
            <Link href="#features" className="w-auto">
              <Button
                variant="outline"
                size="sm"
                className="border-2 text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-3.5"
              >
                See How It Works
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-gray-600 px-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span>Hindi + English support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span>5,000+ students</span>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Builder Section */}
      <ScrollSection
        id="build-resume"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 scroll-mt-20"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Section - Marketing Content */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full text-blue-700 font-semibold text-xs sm:text-sm border border-blue-200 shadow-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span>Best AI-Powered Resume Builder</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Create{" "}
                <span className="text-blue-600">Professional</span> Resumes in{" "}
                <span className="text-blue-600">Minutes</span>
              </h2>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Land your dream job with AI-powered resume builder. Choose from
                25+ ATS-optimized templates and get hired faster.
              </p>

              {/* AI-Powered Features */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      <span className="text-blue-600">25+ ATS-Optimized</span>{" "}
                      Templates
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Professional designs that pass applicant tracking systems
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      <span className="text-cyan-600">AI-Powered</span> ATS
                      Scoring
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Get instant feedback on your resume's ATS compatibility
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trophy className="w-3 h-3 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      <span className="text-indigo-600">Ready in 2</span>{" "}
                      Minutes
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      No credit card required. Start building your resume instantly
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      <span className="text-blue-600">Smart</span> Content
                      Suggestions
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      AI helps you write compelling bullet points and descriptions
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-row gap-2 sm:gap-3 pt-4 justify-center">
                <Link href="/dashboard/resumes/new" className="w-auto">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-3.5"
                  >
                    Try Builder Free
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/dashboard/resumes" className="w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-3.5"
                  >
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Section - Resume Preview */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative rounded-lg shadow-2xl overflow-hidden bg-white max-w-[280px] sm:max-w-[320px] lg:max-w-[400px]">
                <Image
                  src="/resume-template-images/clean-slate-form-template-design.webp"
                  alt="Resume Template Preview"
                  width={400}
                  height={500}
                  className="w-full h-auto object-contain"
                  priority
                />
                {/* ATS Score Badge Overlay */}
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-green-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-lg flex items-center gap-1 animate-bounce" style={{ animationDuration: '2s', animationDelay: '0s' }}>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-white text-green-600 rounded-full flex items-center justify-center font-bold text-[8px] sm:text-[9px] lg:text-[10px] animate-pulse">
                    98
                  </div>
                  <div className="text-[8px] sm:text-[9px] lg:text-[10px] leading-tight hidden sm:block">
                    <div className="font-semibold">ATS Score</div>
                    <div className="text-green-100 text-[7px] sm:text-[8px] lg:text-[9px]">Excellent</div>
                  </div>
                </div>
                {/* Templates Badge */}
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-blue-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-lg text-[8px] sm:text-[9px] lg:text-[10px] font-semibold animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <span className="hidden sm:inline">25+ Templates Available</span>
                  <span className="sm:hidden">25+ Templates</span>
                </div>
                {/* AI-Powered Button */}
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '1s' }}>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-6 px-1.5 sm:h-7 sm:px-2 text-[8px] sm:text-[9px] lg:text-[10px] hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="hidden sm:inline">AI-Powered</span>
                    <span className="sm:hidden">AI</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Mock Interview Hero Section */}
      <ScrollSection
        id="start-interview"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 scroll-mt-20"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Section - Marketing Content */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-purple-700 font-semibold text-xs sm:text-sm border border-purple-200 shadow-sm">
                <Video className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                <span>AI-Powered Mock Interview Platform</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Ace Your Next{" "}
                <span className="text-purple-600">Interview</span> with{" "}
                <span className="text-purple-600">AI Coach</span>
              </h2>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Practice with realistic AI-powered voice interviews. Get
                instant feedback, behavioral analysis, and personalized
                recommendations to land your dream job.
              </p>

              {/* AI-Powered Features */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      <span className="text-purple-600">AI-Powered</span> Voice
                      Interviews
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Realistic 10-20 minute interviews with adaptive AI
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      <span className="text-blue-600">Instant</span> Behavioral
                      Analysis
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Get detailed insights on confidence, fluency, and tone
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      <span className="text-pink-600">Personalized</span>{" "}
                      Feedback
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Track progress and improve with actionable recommendations
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-3 h-3 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      <span className="text-cyan-600">Multi-Language</span>{" "}
                      Support
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Practice in English, Hindi, or code-switch naturally
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-row gap-2 sm:gap-3 pt-4 justify-center">
                <Link href="/sign-up" className="w-auto">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-3.5"
                  >
                    Start Free Interview
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link href="#features" className="w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-3.5"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>5,000+ students trained</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>85% success rate</span>
                </div>
              </div>
            </div>

            {/* Right Section - Interview Preview */}
            <div className="relative flex justify-center lg:justify-start">
              <div className="relative rounded-lg shadow-2xl overflow-hidden bg-white max-w-[700px] border-4 border-purple-100">
                <Image
                  src="/mock-interview-previewiew.png"
                  alt="Mock Interview Interface - AI-Powered Interview Platform"
                  width={700}
                  height={560}
                  className="w-full h-auto object-contain"
                  priority
                />
                {/* Overlay Badges */}
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5 animate-bounce" style={{ animationDuration: '2s' }}>
                  <div className="w-6 h-6 bg-white text-green-600 rounded-full flex items-center justify-center font-bold text-[10px] animate-pulse">
                    AI
                  </div>
                  <div className="text-[10px] leading-tight">
                    <div className="font-semibold">Live</div>
                    <div className="text-green-100 text-[9px]">Interview</div>
                  </div>
                </div>
                <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-md shadow-lg text-[10px] font-semibold animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  Real-time Feedback
                </div>
                <div className="absolute bottom-2 right-2">
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg h-7 px-2 text-[10px] animate-bounce" 
                    style={{ animationDuration: '2.2s', animationDelay: '1s' }}
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    Start Answer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Features Section */}
      <ScrollSection
        id="why-us"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 scroll-mt-20"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Why Choose Easy Interview?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to ace technical and behavioral interviews
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl">
                  Voice Mock Interviews
                </CardTitle>
                <CardDescription className="text-sm">
                  Realistic 10-20 minute voice interviews with adaptive AI that
                  adjusts difficulty based on your answers
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl">
                  Behavioral Analysis
                </CardTitle>
                <CardDescription className="text-sm">
                  Get detailed insights on confidence, fluency, filler words,
                  and tone. Know exactly what to improve
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-pink-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl">
                  Progress Tracking
                </CardTitle>
                <CardDescription className="text-sm">
                  Watch your scores improve over time with detailed analytics
                  and personalized recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-cyan-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl">
                  Company-Specific Prep
                </CardTitle>
                <CardDescription className="text-sm">
                  Practice with questions tailored for TCS, Infosys, Wipro,
                  Amazon, and other top Indian companies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-orange-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl">
                  Multi-Language Support
                </CardTitle>
                <CardDescription className="text-sm">
                  Conduct interviews in English, Hindi, or code-switch between
                  languages naturally
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-green-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg lg:text-xl">
                  Instant Feedback
                </CardTitle>
                <CardDescription className="text-sm">
                  Get comprehensive feedback within minutes. See transcripts,
                  scores, and improvement suggestions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </ScrollSection>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-purple-100 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mb-2" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">
                5,000+
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Students Trained
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-100 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mb-2" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                1,000+
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Questions Bank
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-gradient-to-br from-pink-50 to-white rounded-xl border-2 border-pink-100 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600 mb-2" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-600 mb-1 sm:mb-2">
                85%
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Success Rate
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-gradient-to-br from-cyan-50 to-white rounded-xl border-2 border-cyan-100 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-600 mb-2" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-600 mb-1 sm:mb-2">
                ₹299
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Starting Price
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <PlansSection />

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2 border-purple-200 shadow-xl bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100">
            <CardContent className="p-8 sm:p-10 lg:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                Ready to Ace Your Interview?
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Join 5,000+ students who have improved their interview skills
                with Easy Interview
              </p>
              <Link href="/sign-up">
                <Button
                  variant="gradient"
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-3.5"
                >
                  Start Your Free Interview
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            © 2025 Easy Interview.
          </p>
        </div>
      </footer>
    </div>
  );
}
