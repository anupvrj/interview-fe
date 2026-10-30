import { capSentence, FALLBACK_ROUNDS, type PeerRound } from "./peer-rounds";

/** Shared by the visible FAQ and the FAQPage JSON-LD, so the two never drift apart. Caps come from the backend. */
export const pxFaq = (rounds: PeerRound[]): [string, string][] => [
  ["What is a peer interview?", "A live mock interview with a verified working engineer or manager, on Google Meet. You pick the round, the interviewer runs it like a real one, and you get a peer report and the recording afterwards."],
  ["How do I choose an interviewer?", "Search the directory and filter by round type, industry, role and years of experience, then sort by rating or price. Open a profile to see their rounds, price and open slots."],
  ["When do I pay?", "Only after the interviewer accepts your request. Until then nothing is charged, and you can request a different slot or interviewer."],
  ["How much does a round cost?", `Interviewers set their own price, never above the cap for the round: up to ${capSentence(rounds)}. Tech Pro includes 2 peer interviews.`],
  ["Who are the interviewers?", "Working professionals who apply with their work email and corporate ID and are reviewed before they're listed. Each profile shows their role, experience, rounds and rating from past candidates."],
  ["What do I get after the session?", "A peer report with ratings and the interviewer's own notes, plus the recording, both saved in your bookings. If you opt in, peer rounds count toward your iX Score."],
  ["Should I do AI mocks or peer interviews?", "Both, for different jobs. AI mock interviews give you as many scored rounds as you want, any time. A peer round is the dress rehearsal with a person before the loop that matters."],
];

export const PX_FAQ = pxFaq(FALLBACK_ROUNDS);
