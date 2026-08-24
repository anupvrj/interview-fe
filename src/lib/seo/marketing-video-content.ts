import { getSiteUrl } from "./site-url";
import type { VideoObjectSchemaInput } from "./video-object-schema";
import { secondsToIso8601Duration } from "./video-duration";
import { getPublicVideoUrl } from "./video-cdn";

export type MarketingVideoContent = VideoObjectSchemaInput & {
  keyTakeaways: string[];
  /** Page path where the video is embedded (for video sitemap) */
  pagePath: string;
  durationSeconds: number;
};

export const aiInterviewDemoVideo: MarketingVideoContent = {
  id: "ai-interview-demo",
  name: "Interview Trix AI Mock Interview Demo",
  description:
    "Watch a live AI mock interview on Interview Trix: voice-first practice, real-time feedback, adaptive follow-up questions, and a recruiter-style experience built to help candidates get shortlisted.",
  thumbnailUrl: "/ai_interview_thumbnail.png",
  uploadDate: "2026-06-27T19:18:46+00:00",
  videoUrl: getPublicVideoUrl("ai_interview_demo_interview_trix.mp4"),
  embedUrl: getSiteUrl(),
  pagePath: "/",
  durationSeconds: 10,
  duration: secondsToIso8601Duration(10),
  captionsUrl: "/captions/ai-interview-demo.vtt",
  transcript:
    "Welcome to Interview Trix — live AI mock interview practice. The candidate joins a voice-first session while the AI interviewer asks realistic questions. Real-time feedback highlights clarity, structure, and delivery on every answer. Practice company-specific scenarios and build interview confidence before the real call.",
  keyTakeaways: [
    "Practice realistic voice-first AI mock interviews with adaptive follow-up questions.",
    "Get real-time feedback on answers, delivery, and interview structure.",
    "Simulate recruiter-style pressure in a safe environment before your actual interview.",
    "Build confidence for technical, behavioral, and company-specific interview rounds.",
  ],
};

export const resumeBuilderDemoVideo: MarketingVideoContent = {
  id: "resume-builder-demo",
  name: "Interview Trix AI Resume Builder Demo",
  description:
    "See how Interview Trix turns a blank page into an ATS-ready resume: AI writing assistance, live ATS scoring, professional templates, and export-ready PDF output in minutes.",
  thumbnailUrl: "/resume-template-images/atlantic-blue-template-design.webp",
  uploadDate: "2026-06-28T00:21:19+00:00",
  videoUrl: getPublicVideoUrl("Best_AI_Resume_Builder_InterviewTrix.mp4"),
  embedUrl: `${getSiteUrl()}/ai-resume-builder`,
  pagePath: "/ai-resume-builder",
  durationSeconds: 81,
  duration: secondsToIso8601Duration(81),
  captionsUrl: "/captions/resume-builder-demo.vtt",
  transcript:
    "Welcome to the Interview Trix AI Resume Builder — start from a clean, ATS-friendly editor. Choose a professional template designed for applicant tracking systems and recruiter readability. Add experience, projects, skills, and education in structured sections that parse cleanly. Use AI writing assistance to rewrite bullets with stronger verbs and measurable impact. Target role keywords are woven in so your resume aligns with the job description. Live ATS scoring updates as you edit, surfacing missing skills and formatting issues. Fix weak sections instantly instead of guessing what recruiters and bots will reject. Preview layout, spacing, and section hierarchy before you export. Polish headline, summary, and bullet points until the score reflects a shortlist-ready profile. Switch templates without losing content — iterate until the design matches your target role. Export an ATS-ready resume in minutes — from blank page to interview-ready.",
  keyTakeaways: [
    "Build an ATS-ready resume from professional templates optimized for parsing.",
    "Use AI to rewrite bullets with quantified impact and role-specific keywords.",
    "Track live ATS score improvements while editing each resume section.",
    "Export a polished resume quickly instead of starting from a blank document.",
  ],
};

export const atsCheckerDemoVideo: MarketingVideoContent = {
  id: "ats-checker-demo",
  name: "Interview Trix AI Resume ATS Optimizer Demo",
  description:
    "Watch Interview Trix scan a resume across 27 ATS checks, surface parse-rate and keyword gaps, and optimize content with live Smart ATS Score feedback before you apply.",
  thumbnailUrl: "/resume-template-images/atlantic-blue-template-design.webp",
  uploadDate: "2026-06-28T07:03:18+00:00",
  videoUrl: getPublicVideoUrl("ai_resume_ats_optimizer_interviewtrix.mp4"),
  embedUrl: `${getSiteUrl()}/ats-checker`,
  pagePath: "/ats-checker",
  durationSeconds: 118,
  duration: secondsToIso8601Duration(118),
  captionsUrl: "/captions/ats-checker-demo.vtt",
  transcript:
    "Upload your resume PDF to Interview Trix ATS Checker and optionally paste a target job description. The system parses your document and measures ATS parse rate across sections and formatting. Your Smart ATS Score appears with a breakdown across content, sections, and essentials. Content checks flag weak bullets, missing metrics, grammar issues, and repetition. Section analysis verifies contact details, essential headings, and recruiter-friendly order. ATS essentials catch file format risks, design problems, and header link issues. HR red flags and seniority signals highlight credibility gaps and level-fit concerns. Tailoring checks compare hard skills, soft skills, and title match against the job description. Each issue includes clear guidance so you know exactly what to fix before applying. Jump into the AI resume builder to rewrite flagged sections with stronger keywords. Live scoring updates as you edit — watch your ATS score climb in real time. Export an optimized, shortlist-ready resume built to pass bots and impress recruiters.",
  keyTakeaways: [
    "Get an instant Smart ATS Score across 27 checks before you submit applications.",
    "See parse-rate, content, section, and tailoring issues with actionable fixes.",
    "Optimize flagged bullets and keywords with integrated AI resume tools.",
    "Track score improvements in real time until your resume is shortlist-ready.",
  ],
};

export const aiInterviewCoachDemoVideo: MarketingVideoContent = {
  ...aiInterviewDemoVideo,
  id: "ai-interview-coach-demo",
  name: "Interview Trix AI Mock Interview Demo",
  description:
    "Watch an AI mock interview on Interview Trix: realistic mock interview practice, real-time feedback, company-specific questions, and a detailed scorecard.",
  embedUrl: `${getSiteUrl()}/ai-interview-coach`,
  pagePath: "/ai-interview-coach",
};

export const peerInterviewBookingDemoVideo: MarketingVideoContent = {
  id: "peer-interview-booking-demo",
  name: "Interview Trix Peer Interview Booking Demo",
  description:
    "See how candidates browse verified peer interviewers, pick an open slot on your calendar, and pay only after you accept the booking request.",
  thumbnailUrl: "/marketing/image-person-2.png",
  uploadDate: "2026-07-12T00:00:00+00:00",
  videoUrl: getPublicVideoUrl("Interview-trix-peer-interview-booking-demo.mp4"),
  embedUrl: `${getSiteUrl()}/become-peer-interviewer`,
  pagePath: "/become-peer-interviewer",
  durationSeconds: 60,
  duration: secondsToIso8601Duration(60),
  transcript:
    "Candidates open the peer interview directory on Interview Trix and browse verified interviewers by role, company, and interview type. They view your profile, available slots, and pricing before sending a booking request. You receive the request in your interviewer dashboard and accept or decline at your pace. Payment is collected only after you accept — then the session is confirmed on both calendars with video meeting details.",
  keyTakeaways: [
    "Candidates discover your profile in the peer interviewer directory.",
    "They choose an open slot and submit a booking request — no payment yet.",
    "You accept requests you want; candidates pay only after acceptance.",
    "Confirmed sessions appear on both dashboards with meeting details ready.",
  ],
};

export const hireIxTalentDemoVideo: MarketingVideoContent = {
  id: "hire-ix-talent-demo",
  name: "Interview Trix Hire iX Talent Demo",
  description:
    "See how recruiters search verified iX Talent on Interview Trix: filter by role, industry, skills, and iX Score, then review full interview reports before shortlisting.",
  thumbnailUrl: "/marketing/ix-talent-image-person-2.png",
  uploadDate: "2026-07-12T08:27:15+00:00",
  videoUrl: getPublicVideoUrl("Interview-trix-ix-talent-hiring-demo.mp4"),
  embedUrl: `${getSiteUrl()}/hire-ix-talent`,
  pagePath: "/hire-ix-talent",
  durationSeconds: 60,
  duration: secondsToIso8601Duration(60),
  transcript:
    "Recruiters on Interview Trix search verified iX Talent who have completed AI mock interviews. Filter candidates by role, industry, skills, and minimum iX Score. Open full iX Reports with category breakdowns, transcripts, and interview context before your first outreach. Shortlist top profiles and move the right people through your hiring pipeline from search to shortlist.",
  keyTakeaways: [
    "Search iX Talent by role, industry, skills, and verified iX Score.",
    "Review full iX Reports and interview performance before shortlisting.",
    "Track candidates from search through shortlisted, interviewing, and hired.",
  ],
};

export const aiCodingRoundDemoVideo: MarketingVideoContent = {
  id: "ai-coding-round-demo",
  name: "Interview Trix AI Coding Round Demo",
  description:
    "Watch a full AI coding round on Interview Trix: solve interview-style problems in the editor, run hidden tests, and get scored feedback before your next technical screen.",
  thumbnailUrl: "/ai_interview_thumbnail.png",
  uploadDate: "2026-07-13T00:00:00+00:00",
  videoUrl:
    "https://interview-trix-public.s3.ap-south-1.amazonaws.com/videos/Interview+Trix+AI+Coding+Round.mp4",
  embedUrl: `${getSiteUrl()}/ai-coding-practice`,
  pagePath: "/ai-coding-practice",
  durationSeconds: 90,
  duration: secondsToIso8601Duration(90),
  transcript:
    "Candidates open an AI coding round on Interview Trix and work through interview-style problems in a live code editor. They write solutions, run tests, and iterate until hidden test cases pass. The AI discussion round follows with feedback on approach, complexity, and communication — ending with a scored report recruiters can trust.",
  keyTakeaways: [
    "Practice real interview-style coding problems in a live editor.",
    "Run tests and pass hidden cases before your technical screen.",
    "Get AI discussion feedback and a scored coding round report.",
  ],
};

/** All public marketing videos — used by video sitemap and JSON-LD registries. */
export const marketingVideos: MarketingVideoContent[] = [
  aiInterviewDemoVideo,
  aiInterviewCoachDemoVideo,
  resumeBuilderDemoVideo,
  atsCheckerDemoVideo,
  hireIxTalentDemoVideo,
  peerInterviewBookingDemoVideo,
  aiCodingRoundDemoVideo,
];
