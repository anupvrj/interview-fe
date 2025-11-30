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
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Hello Interview
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <SignedOut>
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    variant="gradient"
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Get Started
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    Dashboard
                  </Button>
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9 lg:w-10 lg:h-10",
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                variant="gradient"
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all text-base sm:text-lg px-6 sm:px-8 py-6 sm:py-7"
              >
                Start Free Interview
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 text-base sm:text-lg px-6 sm:px-8 py-6 sm:py-7"
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

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Why Choose Hello Interview?
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
      </section>

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
                with Hello Interview
              </p>
              <Link href="/sign-up">
                <Button
                  variant="gradient"
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all text-base sm:text-lg px-6 sm:px-8 py-6 sm:py-7"
                >
                  Start Your Free Interview
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
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
            © 2025 Hello Interview. Built with ❤️ for Indian students.
          </p>
        </div>
      </footer>
    </div>
  );
}
