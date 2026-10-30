import { capSentence, countWord, FALLBACK_ROUNDS, roundProse, type PeerRound } from "./peer-rounds";

/** Shared by the visible FAQ and the FAQPage JSON-LD, so the two never drift apart. Caps come from the backend. */
export const piFaq = (rounds: PeerRound[]): [string, string][] => [
  ["Who can become a peer interviewer?", "Working professionals who have interviewed, or been interviewed, for the roles they want to run rounds for. You apply with your work email, corporate ID and the round types you're strongest at, and the team reviews every application before you're listed."],
  ["How long does verification take?", "Applications are usually reviewed within 24 to 48 hours. You'll hear back by email, and once approved your profile can go live in the directory."],
  ["Which rounds can I run?", `${countWord(rounds.length)} types: ${rounds.map((r) => roundProse(r.k)).join(", ")}. Pick only the ones you're strongest at; you can change them later.`],
  ["How much can I charge?", `You set your own price for each round, up to the platform cap for that round: ${capSentence(rounds)}.`],
  ["When do candidates pay?", "When you accept their booking request. The payment is held until the session is done, so you never have to chase anyone afterwards."],
  ["Do I need any tools?", "No. Each session gets its own Google Meet link, it's recorded, and a peer report is drafted from the recording for you to review, add your notes to and submit."],
  ["Can I choose when I interview?", "Yes. Publish 30 to 60 minute slots on your calendar, accept or decline each request, and switch to Away or Offline whenever you need a break."],
];

export const PI_FAQ = piFaq(FALLBACK_ROUNDS);
