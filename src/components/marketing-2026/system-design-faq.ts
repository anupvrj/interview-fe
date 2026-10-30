/** Shared by the visible FAQ and the FAQPage JSON-LD, so the two never drift apart. */
export const SD_FAQ: [string, string][] = [
  ["How does the AI system design interview work?", "Pick a system and your level. You get a real Excalidraw whiteboard and a voice interviewer. Clarify the requirements, sketch the design, then defend it while the interviewer reads your board and follows a topic agenda: requirements, high-level design, a deep dive at scale, then trade-offs."],
  ["Does the AI actually read my diagram?", "Yes. The interviewer looks at what you've drawn, not just what you say, so it can ask about the cache you put in front of the store or the queue with no consumer. Your board is the answer, and it gets read like one."],
  ["How is the round scored?", "On four weighted dimensions: scope and requirements (15%), architecture (25%), the scaling deep-dive (40%) and trade-offs and communication (20%). The report quotes what you did well, marks what you missed and names the next system to drill."],
  ["Which systems can I practise?", "Real systems from real loops: URL shortener, rate limiter, WhatsApp, Instagram feed, YouTube, Uber, Dropbox, Stripe payments, Google Docs, a distributed cache, ChatGPT, LeetCode and more, and the set keeps growing. Each comes with the follow-ups senior panels actually push on."],
  ["Is the interviewer a video avatar?", "No. It's a voice interviewer with a name and a waveform, so your attention stays on the board. Your camera is on during the round for integrity checks."],
  ["Is it free?", "You can start free. New accounts get a 14-day trial with 200 credits and no card. Paid plans start at ₹699 a month, billed in rupees through UPI or card."],
  ["Does it count toward my iX Score?", "Yes, if you opt in. System design is one of four categories in your iX Score, alongside screening, coding and peer interviews, and every round updates your Skills Graph."],
];
