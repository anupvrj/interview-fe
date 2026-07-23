export const ABOUT_US_FAQ = [
  {
    question: "What is Interview Trix?",
    answer:
      "Interview Trix is an AI-powered career platform that helps job seekers get shortlisted and hired. It combines ATS-optimized resume building, AI mock interviews, coding and system design practice, and peer interview sessions in one place—designed for how modern hiring actually works.",
  },
  {
    question: "How is Interview Trix different from traditional interview prep?",
    answer:
      "Traditional prep scatters your effort across disconnected tools: LeetCode for coding, YouTube for behavioral tips, generic resume templates, and expensive one-off mock interviews. Interview Trix unifies the full hiring journey—from getting past ATS filters to rehearsing company-specific rounds—so every step reinforces the next.",
  },
  {
    question: "Who is Interview Trix built for?",
    answer:
      "Interview Trix serves students, early-career professionals, and experienced engineers preparing for tech and non-tech roles—especially candidates navigating India's competitive job market. Plans start affordably, with free tiers to explore core features.",
  },
  {
    question: "Does Interview Trix help with ATS and resume screening?",
    answer:
      "Yes. Resume building starts with ATS compatibility in mind—parser-friendly templates, keyword alignment, and a Smart ATS Score so you know your resume clears automated screening before a recruiter ever sees it.",
  },
  {
    question: "Can I practice interviews in multiple languages?",
    answer:
      "Yes. AI Interview Practice supports multiple languages including English and Hindi, so you can rehearse the way you'll actually communicate in real interviews—especially valuable for candidates interviewing in India.",
  },
  {
    question: "What are peer interviews on Interview Trix?",
    answer:
      "Peer interviews connect you with verified engineers for live mock sessions when you want human feedback beyond AI. It's optional reinforcement in the same platform where you build your resume and run AI practice—no juggling separate services.",
  },
] as const;

export const OLD_VS_NEW_ROWS = [
  {
    old: "Scattered tools—coding sites, resume templates, random YouTube prep",
    next: "One platform for resume, practice, and peer mock interviews",
  },
  {
    old: "Resume rejected by ATS before a human reads it",
    next: "ATS-first resume builder with live scoring and JD alignment",
  },
  {
    old: "Generic mock questions that don't match target companies",
    next: "Company-specific interview paths and realistic AI follow-ups",
  },
  {
    old: "Expensive, hard-to-schedule mock interviews",
    next: "AI practice on demand, plus affordable peer sessions when needed",
  },
  {
    old: "No feedback loop—you guess what to improve",
    next: "Scorecards, progress tracking, and actionable session reports",
  },
  {
    old: "Coding, system design, and behavioral prep on separate sites",
    next: "Integrated practice across technical and non-technical rounds",
  },
] as const;

export const PREP_LOOP_STEPS = [
  {
    step: "01",
    title: "Build an ATS-ready resume",
    description:
      "Start where most hiring funnels begin—automated screening. Create a parser-friendly resume with AI suggestions and a Smart ATS Score.",
    href: "/ai-resume-builder",
    cta: "Resume Builder",
  },
  {
    step: "02",
    title: "Rehearse with AI interviews",
    description:
      "Practice behavioral, technical, and coding rounds with AI that asks follow-ups on your actual answers—mirroring real interview pressure.",
    href: "/ai-interview-coach",
    cta: "AI Interview Practice",
  },
  {
    step: "03",
    title: "Sharpen coding & system design",
    description:
      "Run timed coding drills and system design sessions with structured feedback—so whiteboard rounds don't catch you off guard.",
    href: "/ai-coding-practice",
    cta: "Coding Practice",
  },
  {
    step: "04",
    title: "Validate with peer engineers",
    description:
      "Book live mock sessions with verified interviewers when you want human reassurance before the real thing.",
    href: "/dashboard/peer-interviews",
    cta: "Peer Interviews",
  },
] as const;

export const DIFFERENTIATORS = [
  {
    title: "Built for AI-filtered hiring",
    description:
      "Recruiters and ATS systems evaluate you before the first conversation. We design every feature—resume parsing, keyword fit, interview scoring—for that reality.",
  },
  {
    title: "End-to-end, not point solutions",
    description:
      "Your resume, practice history, and session scorecards live in one place. Improvements in one area—like stronger STAR answers—directly lift the next.",
  },
  {
    title: "India-first, globally capable",
    description:
      "Multi-language practice, pricing in INR, and prep paths tuned for companies candidates actually target—from service firms to product startups.",
  },
  {
    title: "Measurable progress",
    description:
      "Every session produces a scorecard. Track communication, technical depth, and consistency over time instead of guessing if you're ready.",
  },
] as const;

export const MILESTONES = [
  {
    year: "2023",
    label: "The insight",
    description:
      "We saw candidates lose opportunities to ATS black holes and fragmented prep long before interview day. Interview Trix was founded to fix the full funnel—not just one round.",
  },
  {
    year: "2024",
    label: "Launch & traction",
    description:
      "We launched the platform and crossed our first 1,000 users—validating demand for affordable, AI-native interview preparation in India.",
  },
  {
    year: "2025",
    label: "The complete platform",
    description:
      "Today we serve thousands of candidates with resume building, AI interviews, coding practice, and peer sessions—one loop, one partner.",
  },
] as const;

export const FEATURED_TESTIMONIALS = [
  {
    initials: "AS",
    name: "Anjali Singh",
    role: "Product Manager at Infosys",
    quote:
      "AI Interview Practice feels incredibly realistic. I practiced for my Infosys interview and felt so much more confident. The behavioral analysis helped me identify areas I didn't even know needed improvement.",
    gradient: "from-purple-400 to-purple-600",
  },
  {
    initials: "RK",
    name: "Rajesh Kumar",
    role: "Software Engineer at TCS",
    quote:
      "Interview Trix is one of the first apps our team insisted on installing on our new laptops. We use it every day to prepare for interviews and improve our communication skills.",
    gradient: "from-primary/80 to-primary",
  },
  {
    initials: "SM",
    name: "Sneha Mehta",
    role: "Frontend Developer at Razorpay",
    quote:
      "The resume builder is fantastic. I created an ATS-optimized resume that got me multiple interview calls. The AI feedback helped me highlight my strengths better.",
    gradient: "from-red-400 to-red-600",
  },
] as const;

export const IMPACT_STATS = [
  { value: "3,000+", label: "Active users preparing smarter" },
  { value: "10,000+", label: "Resumes built and optimized" },
  { value: "25,000+", label: "AI interview sessions completed" },
] as const;
