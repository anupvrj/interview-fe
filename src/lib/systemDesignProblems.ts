/**
 * Client-side title fallback when session only stores problemId.
 * Full catalog comes from GET /system-design/problems.
 */
const TITLES: Record<string, string> = {
  "url-shortener": "Design a URL Shortener",
  whatsapp: "Design a Messaging App",
  "chat-system": "Design a Messaging App",
  "news-feed": "Design a News Feed",
  "social-feed": "Design a News Feed",
  youtube: "Design a Video Streaming Platform",
  "video-streaming": "Design a Video Streaming Platform",
  uber: "Design a Ride Sharing Service",
  "ride-sharing": "Design a Ride Sharing Service",
  stripe: "Design a Payment System",
  "payment-system": "Design a Payment System",
  "notification-system": "Design a Notification System",
  "notification-service": "Design a Notification System",
  "distributed-cache": "Design a Distributed Cache",
  "post-search": "Design Post Search",
  "search-engine": "Design Post Search",
  robinhood: "Design a Stock Trading Platform",
  "stock-exchange": "Design a Stock Trading Platform",
};

export interface SystemDesignProblemFull {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  scenario: string;
  coreRequirements: string[];
  scaleRequirements: string[];
  considerations: string[];
}

export function getProblemById(id: string): SystemDesignProblemFull | undefined {
  const title = TITLES[id];
  if (!title) return undefined;
  return {
    id,
    title,
    difficulty: "medium",
    category: "General",
    scenario: "",
    coreRequirements: [],
    scaleRequirements: [],
    considerations: [],
  };
}
