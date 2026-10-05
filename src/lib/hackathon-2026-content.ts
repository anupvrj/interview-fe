export const HACKATHON_2026_PATH = "/hackathon-2026";

/** Single source of truth for the event window (IST). Display strings, countdown and JSON-LD derive from this. */
export const HACKATHON_EVENT = {
  startISO: "2026-10-10T16:00:00+05:30",
  endISO: "2026-10-10T17:30:00+05:30",
  dateLabel: "Sat, 10 Oct 2026",
  timeLabel: "4:00 PM – 5:30 PM IST",
  formatLabel: "Live Virtual Event",
} as const;

export const HACKATHON_2026_META = {
  title: "Navigating Careers in 2027 — InterviewTrix Hackathon & Product Launch",
  description:
    "Join the Interview Trix Product Launch and Hackathon on 10 Oct 2026. Register, design a 75%+ ATS resume, score 70%+ on two mock interviews, and compete for a ₹20,000 prize pool.",
  keywords: [
    "Interview Trix hackathon",
    "career hackathon 2026",
    "AI mock interview challenge",
    "ATS resume challenge",
    "InterviewTrix product launch",
    "Navigating Careers in 2027",
  ],
};

export const HACKATHON_ABOUT = { href: "/about-us", label: "About" } as const;

export const HACKATHON_NAV = [
  { href: "#participate", label: "How to Participate" },
  { href: "#prizes", label: "Prizes" },
  { href: "#agenda", label: "Agenda" },
  { href: "#faq", label: "FAQ" },
] as const;

export const HACKATHON_SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/interview-trix/", icon: "linkedin" },
  { label: "X", href: "https://x.com/InterviewTrix", icon: "x" },
  { label: "Instagram", href: "https://www.instagram.com/interviewtrix_official/", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com/@interviewtrix_official", icon: "youtube" },
] as const;

export const HACKATHON_HERO = {
  badgeLeft: "Hackathon",
  badgeRight: "Product Launch",
  headlineLead: "Navigating",
  headlineAccent: "Careers in 2027",
  copy: "AI is changing how we learn, work and get hired. Join the Interview Trix Product Launch & Hackathon to experience the future of interview preparation — and build your edge for what’s next.",
  registerLabel: "Register Now — It’s Free",
  startChallengeLabel: "Start the Challenge",
  checks: ["AI Mock Interviews", "ATS Resume Builder", "Win Exciting Prizes"],
  floatCards: [
    { title: "Get seen", subtitle: "by recruiters", icon: "FileText", tone: "blue" },
    { title: "Be ready", subtitle: "on interview day", icon: "Mic", tone: "rose" },
    { title: "Get rewarded", subtitle: "₹20,000 prize pool", icon: "Trophy", tone: "cyan" },
  ],
  noteTop: ["Practice Today.", "Perform Tomorrow."],
  noteSide: ["Same candidate.", "Verified by AI."],
  marquee: [
    "AI Mock Interviews",
    "ATS Resume Builder",
    "Live Scoring Reports",
    "₹20,000 Prize Pool",
    "Product Launch",
    "Industry Leaders",
  ],
} as const;

export const HACKATHON_STEPS = [
  {
    num: "1",
    title: "Register for the Hackathon",
    body: "Sign up for the Interview Trix Product Launch & Hackathon. Registration is free.",
    icon: "UserPlus",
    accent: "blue",
  },
  {
    num: "2",
    title: "Design a ATS Ready Resume",
    body: "Design a resume using the AI Resume Builder and reach an ATS score of at least 75%.",
    icon: "FileText",
    accent: "teal",
  },
  {
    num: "3",
    title: "Score 70%+ on 2 Mock Interviews",
    body: "Attempt two full 15-minute mock interviews and score at least 70% on each.",
    icon: "MessageSquareText",
    accent: "amber",
  },
  {
    num: "4",
    title: "Share on Instagram & LinkedIn",
    body: "Share your experience on Instagram and LinkedIn, tagging the Interview Trix official page.",
    icon: "Share2",
    accent: "rose",
  },
] as const;

export type HackathonRewardKind = "claude" | "voucher" | "credit";

export const HACKATHON_PRIZES = {
  poolLead: "Total Prize Pool Worth",
  poolAmount: 20000,
  ranks: [
    {
      rank: "#1",
      title: "Top 1 Performer",
      tier: "gold",
      icon: "/hackathon-2026/prize-gold.webp",
      rewards: [
        { kind: "claude", label: "Claude Max Plan – 1 Month" },
        { kind: "voucher", label: "₹2,000 Amazon Gift Voucher" },
        { kind: "credit", label: "₹1,000 Interview Trix Credit", note: "Valid for 3 Months" },
      ],
    },
    {
      rank: "#2",
      title: "Top 2 Performer",
      tier: "silver",
      icon: "/hackathon-2026/prize-silver.webp",
      rewards: [
        { kind: "claude", label: "Claude Pro Plan – 1 Month" },
        { kind: "voucher", label: "₹2,000 Amazon Gift Voucher" },
        { kind: "credit", label: "₹1,000 Interview Trix Credit", note: "Valid for 3 Months" },
      ],
    },
    {
      rank: "#3",
      title: "Top 3 Performer",
      tier: "bronze",
      icon: "/hackathon-2026/prize-bronze.webp",
      rewards: [
        { kind: "claude", label: "Claude Pro Plan – 1 Month" },
        { kind: "voucher", label: "₹2,000 Amazon Gift Voucher" },
        { kind: "credit", label: "₹1,000 Interview Trix Credit", note: "Valid for 3 Months" },
      ],
    },
  ],
  premium: {
    title: "What’s Included in Interview Trix Premium?",
    benefits: [
      "Unlimited AI mock interviews",
      "Advanced ATS resume tools",
      "Personalized interview feedback",
      "Detailed performance insights",
      "Access to upcoming premium features",
    ],
  },
} as const satisfies {
  poolLead: string;
  poolAmount: number;
  ranks: ReadonlyArray<{
    rank: string;
    title: string;
    tier: "gold" | "silver" | "bronze";
    rewards: ReadonlyArray<{ kind: HackathonRewardKind; label: string; note?: string }>;
  }>;
  premium: { title: string; benefits: readonly string[] };
};

export const HACKATHON_AGENDA = {
  titleLead: "Live Launch Event",
  titleAccent: "Agenda",
  lead: "90 Minutes. Two Industry Leaders. One New Era of Interview Preparation.",
  copy: "Join our live virtual launch as we introduce Interview Trix, discuss how AI is reshaping careers, and reveal the hackathon winners.",
  guestsNote: ["Learn from", "Industry Leaders"],
  slots: [
    {
      time: "4:00 – 4:10 PM",
      title: "Welcome & Opening",
      body: "Event kickoff and Interview Trix introduction",
      icon: "Rocket",
      tone: "blue",
    },
    {
      time: "4:10 – 4:30 PM",
      title: "Chief Guest 1",
      body: "The Future of Careers in the AI Era",
      icon: "Users",
      tone: "rose",
    },
    {
      time: "4:30 – 4:50 PM",
      title: "Chief Guest 2",
      body: "Skills, Opportunities and How to Prepare",
      icon: "UsersRound",
      tone: "indigo",
    },
    {
      time: "4:50 – 5:15 PM",
      title: "Interview Trix Product Launch",
      body: "Live demo, new features and what’s next",
      icon: "PlayCircle",
      tone: "cyan",
    },
    {
      time: "5:15 – 5:30 PM",
      title: "Hackathon Winners + Q&A",
      body: "Winners, recognition and closing",
      icon: "Trophy",
      tone: "amber",
    },
  ],
  guests: [
    {
      name: "Chief Guest 1",
      topic: "The Future of Careers in the AI Era",
      image: "/hackathon-2026/chief-guest-1.webp" as string | null,
    },
    {
      name: "Chief Guest 2",
      topic: "Skills, Opportunities and How to Prepare",
      image: "/hackathon-2026/chief-guest-2.webp" as string | null,
    },
  ],
} as const;

export const HACKATHON_FAQ = [
  {
    question: "Who can participate?",
    answer:
      "The challenge is designed for students, developers, job seekers and professionals preparing for interviews.",
  },
  {
    question: "Do I need to pay to register?",
    answer: "No. Registration for the event and hackathon challenge is free.",
  },
  {
    question: "How are the top performers selected?",
    answer:
      "Participants complete the required challenge activities; the final scoring criteria will be published with the official challenge rules.",
  },
  {
    question: "Where is the live launch happening?",
    answer:
      "The launch is a live virtual event. Registered participants receive the joining details.",
  },
] as const;

export const HACKATHON_FINAL_CTA = {
  titleLead: "Ready to navigate",
  titleAccent: "your career",
  titleTail: "in",
  titleYear: "2027?",
  copy: "Join the Interview Trix Product Launch & Hackathon and take the next step towards your dream career.",
  points: ["Free Registration", "Live Virtual Event", "Open to All"],
} as const;

export const HACKATHON_PROFESSIONS = [
  { value: "student", label: "Student" },
  { value: "developer", label: "Developer" },
  { value: "job_seeker", label: "Job seeker" },
  { value: "professional", label: "Professional" },
] as const;

export type HackathonProfession = (typeof HACKATHON_PROFESSIONS)[number]["value"];
