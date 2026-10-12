export const HACKATHON_2026_PATH = "/hiring-games-hackathon-2026";

/** Single source of truth for the event window (IST). Display strings, countdown and JSON-LD derive from this. */
/** Challenge window fallback. The landing page prefers the published startsAt/endsAt. */
export const HACKATHON_CHALLENGE = {
  startISO: "2026-10-17T00:00:00+05:30",
  endISO: "2026-10-26T23:59:00+05:30",
  dateLabel: "17–26 Oct 2026",
  publicRangeLabel: "17th-26th Oct 2026",
  timeLabel: "Submit by 26 Oct, 11:59 PM IST",
} as const;

/** Live launch. Winners are announced here. The joining link is a later email. */
export const HACKATHON_LAUNCH = {
  startISO: "2026-10-31T18:30:00+05:30",
  endISO: "2026-10-31T20:00:00+05:30",
  dateLabel: "Sat, 31 Oct 2026",
  timeLabel: "6:30 PM IST",
  formatLabel: "Live Virtual Event",
} as const;

/** @deprecated Use HACKATHON_LAUNCH. Kept so older imports still point at the launch. */
export const HACKATHON_EVENT = HACKATHON_LAUNCH;

export const HACKATHON_2026_META = {
  title: "InterviewTrix: The Hiring Games — Free Hiring Hackathon & Product Launch",
  description:
    "AI is changing hiring, jobs and work. Join InterviewTrix: The Hiring Games, a free self-paced hackathon (17–26 Oct 2026), then learn from leading software industry experts at our online launch on 31 Oct. ₹20,000 prize pool.",
  keywords: [
    "Interview Trix hackathon",
    "career hackathon 2026",
    "AI mock interview challenge",
    "ATS resume challenge",
    "InterviewTrix product launch",
    "InterviewTrix The Hiring Games",
    "hiring hackathon 2026",
  ],
};

export const HACKATHON_ABOUT = { href: "/about-us", label: "About" } as const;

export const HACKATHON_NAV = [
  { href: "#prizes", label: "Prizes" },
  { href: "#participate", label: "How to Participate" },
  { href: "#timeline", label: "Timeline" },
  { href: "#agenda", label: "Agenda" },
  { href: "#who", label: "Who can Participate" },
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
  headlineLead: "InterviewTrix:",
  headlineAccent: "The Hiring Games",
  copy: "AI is reshaping hiring. Challenge AI in our 7-day hackathon, win exciting prizes, and learn from industry experts how to land your next job.",
  registerLabel: "Register Now for Free",
  startChallengeLabel: "Start the Challenge",
  offerWas: "₹799",
  offerNow: "FREE",
  offerEndsLabel: "Offer ends in",
  seatNoteLead: "Limited seats left.",
  seatNote: "Register before this offer ends.",
  floatCards: [
    { title: "Beat the ATS", subtitle: "Score 80+ to unlock interviews", icon: "FileText", tone: "blue" },
    { title: "Face an AI interviewer", subtitle: "Get instant feedback", icon: "Mic", tone: "rose" },
    { title: "Get rewarded", subtitle: "Top 3 performers rewarded", icon: "Trophy", tone: "cyan" },
  ],
  noteTop: ["Are you Ready", "for this?"],
  noteSide: ["Your next interviewer", "might be an AI."],
  marquee: [
    "Face AI Interviewer",
    "Get Interview Tricks from Experts",
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
    title: "Score Maximum on 2 AI Interviews",
    body: "Attempt two full 15-minute AI interviews and score your maximum to win the hackathon.",
    icon: "MessageSquareText",
    accent: "amber",
  },
  {
    num: "4",
    title: "Share Your Journey",
    body: "Post about your Hiring Games experience on social media and tag the InterviewTrix official page.",
    icon: "Share2",
    accent: "rose",
  },
] as const;

export const HACKATHON_TIMELINE = {
  titleLead: "Challenge",
  titleAccent: "Timeline",
  copy: "Key dates for your journey from registration to the final round.",
  items: [
    { date: "17 Oct 2026", title: "Registrations", body: "Sign up and lock in your spot." },
    { date: "17–26 Oct 2026", title: "Complete Round 1 & 2", body: "Submit your resume and finish both mock interviews." },
    { date: "27–30 Oct 2026", title: "Review & Shortlisting", body: "We review submissions and shortlist the top performers." },
    { date: "31 Oct 2026", title: "Winner Announcement", body: "Join the live launch as winners are announced." },
  ],
} as const;

export const HACKATHON_WHO = {
  titleLead: "Who can",
  titleAccent: "Participate",
  copy: "Open to anyone eager to participate or showcase their skills.",
  groups: [
    {
      title: "Students",
      body: "Currently studying in any degree program.",
      icon: "GraduationCap",
    },
    {
      title: "Recent Graduates",
      body: "0–2 years of work experience.",
      icon: "Briefcase",
    },
    {
      title: "All Professionals",
      body: "Any professional looking for a job change.",
      icon: "Users",
    },
  ],
} as const;

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
      approxValue: 14999,
      rewards: [
        { kind: "claude", label: "Claude Max Plan – 1 Month", priceInr: 11999 },
        { kind: "voucher", label: "₹2,000 Amazon Gift Voucher", priceInr: 2000 },
        { kind: "credit", label: "1,000 Interview Trix Credit", note: "Valid for 3 Months", priceInr: 1000 },
      ],
    },
    {
      rank: "#2",
      title: "Top 2 Performer",
      tier: "silver",
      icon: "/hackathon-2026/prize-silver.webp",
      approxValue: 5399,
      rewards: [
        { kind: "claude", label: "Claude Pro Plan – 1 Month", priceInr: 2399 },
        { kind: "voucher", label: "₹2,000 Amazon Gift Voucher", priceInr: 2000 },
        { kind: "credit", label: "1,000 Interview Trix Credit", note: "Valid for 3 Months", priceInr: 1000 },
      ],
    },
    {
      rank: "#3",
      title: "Top 3 Performer",
      tier: "bronze",
      icon: "/hackathon-2026/prize-bronze.webp",
      approxValue: 5399,
      rewards: [
        { kind: "claude", label: "Claude Pro Plan – 1 Month", priceInr: 2399 },
        { kind: "voucher", label: "₹2,000 Amazon Gift Voucher", priceInr: 2000 },
        { kind: "credit", label: "1,000 Interview Trix Credit", note: "Valid for 3 Months", priceInr: 1000 },
      ],
    },
  ],
  credits: {
    title: "What comes with InterviewTrix credits?",
    lead: "Credits worth ₹1,000 include:",
    items: [
      { icon: "interview", value: "5", label: "Mock interviews" },
      { icon: "ats", value: "10", label: "ATS match checks" },
      { icon: "premium", label: "Premium practice features & guided feedback" },
    ],
  },
} as const satisfies {
  poolLead: string;
  poolAmount: number;
  ranks: ReadonlyArray<{
    rank: string;
    title: string;
    tier: "gold" | "silver" | "bronze";
    icon: string;
    approxValue: number;
    rewards: ReadonlyArray<{ kind: HackathonRewardKind; label: string; note?: string; priceInr?: number }>;
  }>;
  credits: {
    title: string;
    lead: string;
    items: ReadonlyArray<{ icon: "interview" | "ats" | "premium"; value?: string; label: string }>;
  };
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
      image: null as string | null,
    },
    {
      name: "Chief Guest 2",
      topic: "Skills, Opportunities and How to Prepare",
      image: null as string | null,
    },
    {
      name: "Chief Guest 3",
      topic: "Leading Engineering Teams in the AI Era",
      image: null as string | null,
    },
  ],
} as const;

export const HACKATHON_FAQ = [
  {
    question: "Why should I attend?",
    answer:
      "AI is changing how companies hire, what jobs look like and how work gets done, and freshers feel it first. At the online event, our three chief guests, leading experts from the software industry, share what companies now look for and how to start and grow your career in an AI-driven world. Before that, the hackathon lets you practise a real hiring journey with an ATS-ready resume and AI mock interviews, and the top 3 share a prize pool worth ₹20,000.",
  },
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
      "Every complete final submission gets a Final Score = 30% resume ATS score + 70% average of your two mock interview scores. Submissions are ranked by Final Score, and if two scores tie, whoever submitted first ranks higher. The top entries are verified, and the top 3 win.",
  },
  {
    question: "Where is the live launch happening?",
    answer:
      "The launch is a live virtual event. Registered participants receive the joining details.",
  },
] as const;

export const HACKATHON_FINAL_CTA = {
  title: "Ready to take the challenge?",
  copy: "Submit your resume, unlock the interview round, and compete for the live final.",
  points: [
    `Hackathon - ${HACKATHON_CHALLENGE.publicRangeLabel}`,
    "Exciting prizes await",
    "Winner Announcement",
  ],
} as const;
