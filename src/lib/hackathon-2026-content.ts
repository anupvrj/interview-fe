import { formatChallengeWindow } from "./hackathon-schedule";

export const HACKATHON_2026_PATH = "/hiring-games-hackathon-2026";

/** Single source of truth for the event window (IST). Display strings, countdown and JSON-LD derive from this. */
/** Challenge window fallback. The landing page prefers the published startsAt/endsAt. */
export const HACKATHON_CHALLENGE = {
  startISO: "2026-10-20T05:00:00+05:30",
  endISO: "2026-10-28T23:59:00+05:30",
  dateLabel: "20–28 Oct 2026",
  publicRangeLabel: "20th-28th Oct 2026",
  timeLabel: "Starts 20 Oct, 5 AM IST · submit by 28 Oct, 11:59 PM IST",
} as const;

const HACKATHON_CHALLENGE_WINDOW = formatChallengeWindow(
  HACKATHON_CHALLENGE.startISO,
  HACKATHON_CHALLENGE.endISO,
);

/** Live launch. Winners are announced here. The joining link is a later email. */
export const HACKATHON_LAUNCH = {
  startISO: "2026-10-31T19:00:00+05:30",
  endISO: "2026-10-31T20:00:00+05:30",
  dateLabel: "Sat 31 Oct 2026",
  timeLabel: "7 PM IST",
  /** Short hero / promo line (online launch + winners). */
  summaryLabel: "Live launch & winners",
  formatLabel: "Live online event",
} as const;

/** @deprecated Use HACKATHON_LAUNCH. Kept so older imports still point at the launch. */
export const HACKATHON_EVENT = HACKATHON_LAUNCH;

/** 31 Oct live launch RSVP modal (Learn from Industry Leaders). */
export const LAUNCH_EVENT_FORM = {
  title: "Learn from Industry Leaders",
  /** Welcome step heading — always two lines (mobile + desktop). */
  titleLines: ["Learn from", "Industry Leaders"] as const,
  subtitle: `Free online session · ${HACKATHON_LAUNCH.dateLabel}, ${HACKATHON_LAUNCH.timeLabel}`,
  teaserTitle: "Join the live launch",
  teaserBody: "Winners, product updates, and career advice from experts — online on 31 Oct.",
  /** Welcome step primary action (modal). */
  welcomeCta: "Let Me In",
  submitLabel: "Reserve My Spot",
  successTitle: "You're registered for the live event",
  successBody: "We'll share the joining link by email. Updates and the live link go to our WhatsApp community first.",
  successLoadingMessage: "Saving your spot…",
  whatsappCta: "Join WhatsApp community",
  qAttended: "Have you attended an AI interview recently?",
  qReady: "Ready to take on an AI interview and build your confidence?",
  attendedOptions: [
    { value: "yes" as const, label: "Yes, I have" },
    { value: "no" as const, label: "Not yet" },
  ],
  readyOptions: [
    { value: "yes" as const, label: "Yes, bring it on" },
    { value: "nervous" as const, label: "A little nervous" },
  ],
  professionOptions: [
    { value: "student" as const, label: "Student" },
    { value: "self_employed" as const, label: "Self employed" },
    { value: "working_professional" as const, label: "Working professional" },
  ],
  whyAttendOptions: [
    { value: "stay_relevant" as const, label: "Stay relevant as AI changes hiring and work" },
    { value: "expert_advice" as const, label: "Get expert advice on interviews and careers in the AI era" },
    { value: "practical_solutions" as const, label: "Learn practical ways to stand out to employers" },
    { value: "community_launch" as const, label: "Join the live launch and winner announcement" },
  ],
  fields: {
    name: "Full name",
    phone: "Phone number",
    email: "Email",
    profession: "Profession",
    whyAttend: "Why do you want to attend?",
  },
} as const;

export const HACKATHON_2026_META = {
  title: "InterviewTrix: The Hiring Games — Free Hiring Hackathon & Product Launch",
  description:
    "AI is changing hiring, jobs and work. Join InterviewTrix: The Hiring Games, a free self-paced hackathon (submit by 28 Oct 2026), then learn from leading software industry experts at our online launch on 31 Oct. ₹20,000 prize pool.",
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
  { href: "#launch", label: "Live event" },
  { href: "#who", label: "Who can Participate" },
  { href: "#faq", label: "FAQ" },
] as const;

/** Set invite URLs before go-live (or use NEXT_PUBLIC_HACKATHON_WHATSAPP_* env vars). */
export const HACKATHON_WHATSAPP_LINKS = {
  channelUrl: "",
  communityUrl: "https://chat.whatsapp.com/LqLXz0JUcdkDPYNNle50JZ",
  /** Official invite QR (with the WhatsApp logo) for communityUrl. */
  communityQrSrc: "/brand/whatsapp-qr.png",
} as const;

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
  // Fixed "7-day": the challenge runs 20–26 Oct (7 calendar days).
  copy: "AI is reshaping hiring. Challenge AI in our 7-day hackathon, win exciting prizes, and learn from industry experts how to land your next job.",
  registerLabel: "Register Now for Free",
  startChallengeLabel: "Start the Challenge",
  seatNote: "Limited seats left. Register for live event and learn from industry leaders.",
  floatCards: [
    { title: "Beat the ATS", subtitle: "Score 80+ to unlock interviews", icon: "FileText", tone: "blue" },
    { title: "Face an AI interviewer", subtitle: "Get instant feedback", icon: "Mic", tone: "rose" },
    { title: "Get rewarded", subtitle: "Top 3 performers rewarded", icon: "Trophy", tone: "cyan" },
  ],
  noteTop: ["Are you Ready", "for this?"],
  noteSide: ["Your next interviewer", "might be an AI."],
  marquee: [
    "AI Interviewer",
    "Get Interview Tricks from Experts",
    "Live Scoring Reports",
    "₹20,000",
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
    title: "Score Maximum on the AI Interview",
    body: "Take a full 15-minute AI interview (you get 3 tries) and score your maximum to win the hackathon.",
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
    { date: "20 Oct 2026", title: "Registrations", body: "Sign up and lock in your spot." },
    { date: "20–28 Oct 2026", title: "Complete Round 1 & 2", body: "Submit your resume and finish your mock interview." },
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

const HACKATHON_PRIZE_AMOUNT = "INR 20,000/-";
const HACKATHON_PRIZE_TERMS_MARK = "**";

export const HACKATHON_PRIZES = {
  poolLead: "Total Prize Pool Worth",
  poolAmount: 20000,
  /** Dashboard / promo copy — amount + T&C asterisks (not an icon). */
  prizeAmount: HACKATHON_PRIZE_AMOUNT,
  prizeTermsMark: HACKATHON_PRIZE_TERMS_MARK,
  prizeAmountWithTerms: `${HACKATHON_PRIZE_AMOUNT} ${HACKATHON_PRIZE_TERMS_MARK}`,
  poolLine: "Total Prize Pool Worth ₹20,000 INR",
  registerPitchLead: "Challenge Our AI Interviewer and win prize worth upto",
  /** Full pitch; must match dashboard `message` for layout tweaks. */
  registerPitch: `Challenge Our AI Interviewer and win prize worth upto ${HACKATHON_PRIZE_AMOUNT} ${HACKATHON_PRIZE_TERMS_MARK}`,
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
  prizeAmount: string;
  prizeTermsMark: string;
  prizeAmountWithTerms: string;
  poolLine: string;
  registerPitchLead: string;
  registerPitch: string;
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
  lead: "90 Minutes. Three Industry Leaders. One New Era of Interview Preparation.",
  copy: "Join our live virtual launch as we introduce Interview Trix, discuss how AI is reshaping careers, and reveal the hackathon winners.",
  guestsNote: ["Learn from", "Industry Leaders"],
  slots: [
    {
      title: "Product Launch",
      icon: "PlayCircle",
      tone: "cyan",
    },
    {
      title: "Live discussion on Industry trends and AI use in current hiring markets",
      icon: "Users",
      tone: "blue",
    },
    {
      title: "Hackathon Winner Announcements !!",
      icon: "Trophy",
      tone: "amber",
    },
    {
      title: "Audience — Q & A",
      icon: "UsersRound",
      tone: "indigo",
    },
  ],
  guests: [
    {
      name: "Azharuddin",
      topic: "Director of Engineering · AI Technology Consultant, OneOrigin",
      subtitle: "Ex-TechMahindra",
      image: "/guests-pic/azharuddin.webp" as string | null,
    },
    {
      name: "Sourav Debnath",
      topic: "HR Partner · Data-Driven Strategies and Recruitment",
      subtitle: "Ex-Reliance, Myntra, Blackbuck",
      image: "/guests-pic/sourav-debnath.webp" as string | null,
    },
    {
      name: "Akshay Manjunath",
      topic: "Innovation Consultant · AI Researcher",
      subtitle: "Walmart, Ex-Ford, Design Lab",
      image: "/guests-pic/akshay-manjunath.webp" as string | null,
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
      "Every complete final submission gets a Final Score = 30% resume ATS score + 70% your mock interview score. Submissions are ranked by Final Score, and if two scores tie, whoever submitted first ranks higher. The top entries are verified, and the top 3 win.",
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
    `Hackathon ${HACKATHON_CHALLENGE_WINDOW.submissionExtendedLabel}`,
    "Exciting prizes await",
    "Live launch & winners",
  ],
} as const;
