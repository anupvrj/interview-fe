// Share captions for the InterviewTrix challenge dashboard (Task 3).
// Product-focused and safe for employed professionals: no "job hunt" wording.
// Plain-text emojis that render on both LinkedIn and Instagram.

export const SHARE_CAPTIONS: string[] = [
  `Tried InterviewTrix today 🚀

It runs a live voice interview with an AI that asks real follow-up questions and scores every answer. The feedback on clarity and structure was genuinely useful.

Really impressive to see how far AI has come in this space.

👉 https://interviewtrix.com/

#interviewtrix #AI #AIInterview #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Explored how AI interviewers actually work 🎯

I expected scripted questions. Instead, InterviewTrix listened to my answers, probed deeper and challenged my reasoning, just like a real conversation.

A great reality check on how well I explain my thinking out loud.

👉 https://interviewtrix.com/

#interviewtrix #AIInterview #Learning #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Practised a system design discussion with an AI 💡

InterviewTrix pushed me on requirements, trade-offs and scale, then showed exactly where my explanation could be sharper.

A great way to keep technical communication skills strong.

👉 https://interviewtrix.com/

#interviewtrix #SystemDesign #SoftwareEngineering #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Working on my communication skills ✅

InterviewTrix tracks pacing, filler words and how clearly you structure your answers. Seeing it turn by turn, with audio playback, was eye-opening.

Small habits make a big difference in how we come across.

👉 https://interviewtrix.com/

#interviewtrix #Communication #PersonalGrowth #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Curious how AI is changing hiring 🤔

So I tried the InterviewTrix AI interviewer myself. It adapts its questions, scores technical and behavioural answers separately, and suggests better ways to answer.

A fascinating look at where things are heading.

👉 https://interviewtrix.com/

#interviewtrix #FutureOfWork #AI #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Checked my resume's ATS score 📄

InterviewTrix showed how an AI reads a profile, which keywords and skills it picks up, and what was missing.

Useful to understand how automated systems see us today.

👉 https://interviewtrix.com/

#interviewtrix #ATS #AI #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Tested an AI that remembers where you stumbled 🧠

InterviewTrix keeps track of your weak spots and makes each next session a little harder. It feels more like a coach than a tool.

A clever approach to continuous improvement.

👉 https://interviewtrix.com/

#interviewtrix #AI #ContinuousLearning #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Spent 15 minutes with an AI interviewer today ⏱️

Real-time questions, natural follow-ups and a detailed scorecard at the end, all in one place on InterviewTrix.

Surprisingly useful for sharpening how I present ideas.

👉 https://interviewtrix.com/

#interviewtrix #AIInterview #SkillBuilding #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Loved the feedback report from InterviewTrix 📊

A benchmark score, a breakdown of strengths, and an ideal answer playbook that rewrites weak answers so you can learn from them.

Practical learning, not just generic tips.

👉 https://interviewtrix.com/

#interviewtrix #Feedback #Learning #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,

  `Coding problems are easy in silence. Explaining them out loud is not 🗣️

InterviewTrix lets you talk through your approach with an AI that asks why, just like a real discussion.

A great way to build confidence in technical conversations.

👉 https://interviewtrix.com/

#interviewtrix #Coding #TechCommunication #resume #jobinterview #jobsearch #mockinterviews #hiring
@interviewtrix_official @interviewtrix`,
];

export const INTERVIEWTRIX_HOME_SHARE_URL = "https://interviewtrix.com/";

/** Any InterviewTrix link on the arrow line, including the hackathon path. */
const SITE_LINK_PATTERN = /👉\s*https?:\/\/(?:www\.)?interviewtrix\.com[^\s]*/gi;

/** Keep the shared link on the homepage. Older captions pointed at the hackathon page. */
export function formatHackathonShareCaption(caption: string): string {
  const homepageLine = `👉 ${INTERVIEWTRIX_HOME_SHARE_URL}`;
  if (SITE_LINK_PATTERN.test(caption)) {
    SITE_LINK_PATTERN.lastIndex = 0;
    return caption.replace(SITE_LINK_PATTERN, homepageLine);
  }
  return `${caption.trim()}\n\n${homepageLine}`;
}

export function randomShareCaption(exclude?: string): string {
  if (SHARE_CAPTIONS.length === 0) return "";
  if (SHARE_CAPTIONS.length === 1) return SHARE_CAPTIONS[0];
  let next = SHARE_CAPTIONS[0];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    next = SHARE_CAPTIONS[Math.floor(Math.random() * SHARE_CAPTIONS.length)];
    if (exclude === undefined || next !== exclude) break;
  }
  return next;
}
