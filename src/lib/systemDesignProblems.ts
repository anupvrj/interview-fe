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

const PROBLEMS: SystemDesignProblemFull[] = [
  {
    id: "stock-exchange",
    title: "Design a Stock Exchange",
    difficulty: "hard",
    category: "Financial Systems",
    scenario:
      "Design the core matching engine for a stock exchange like NASDAQ or NYSE. The system must accept buy and sell orders for various stocks and match them in real-time with sub-millisecond latency.",
    coreRequirements: [
      "Accept buy and sell orders for various stocks",
      "Support different order types (Market, Limit, Stop)",
      "Match buy and sell orders based on price-time priority",
      "Maintain an order book for each stock",
      "Publish a real-time data feed of executed trades",
    ],
    scaleRequirements: [
      "Handle millions of orders per second",
      "Sub-millisecond latency for order matching",
      "Extremely high availability and fault tolerance (no data loss)",
    ],
    considerations: [
      "How would you design the matching engine for extreme low-latency performance?",
      "How would you ensure fairness and determinism in order matching?",
      "How would you ensure the system is resilient to failures?",
      "How would you handle market data dissemination to a large number of clients?",
    ],
  },
  {
    id: "notification-service",
    title: "Design a Scalable Notification Service",
    difficulty: "medium",
    category: "Messaging",
    scenario:
      "Design a notification service that can send push notifications, emails, and SMS to millions of users with delivery guarantees.",
    coreRequirements: [
      "Send notifications via multiple channels (push, email, SMS)",
      "Support user notification preferences and opt-out",
      "Guarantee at-least-once delivery",
      "Support scheduled and triggered notifications",
      "Provide delivery status tracking",
    ],
    scaleRequirements: [
      "Handle 10 million notifications per hour",
      "Support real-time and batch delivery modes",
      "99.9% delivery rate for critical notifications",
    ],
    considerations: [
      "How would you handle different delivery channel priorities?",
      "How would you implement retry logic with exponential backoff?",
      "How would you manage template versioning?",
      "How would you monitor and alert on delivery failures?",
    ],
  },
  {
    id: "url-shortener",
    title: "Design a URL Shortener",
    difficulty: "easy",
    category: "Web Services",
    scenario:
      "Design a URL shortening service like bit.ly or TinyURL. Users can submit a long URL and receive a short URL that redirects to the original.",
    coreRequirements: [
      "Generate unique short URLs for given long URLs",
      "Redirect short URLs to original long URLs",
      "Support custom aliases for short URLs",
      "Provide analytics on click counts",
      "Support URL expiration",
    ],
    scaleRequirements: [
      "Handle 1 billion URLs",
      "100:1 read-to-write ratio",
      "99.9% uptime with minimal latency redirects",
    ],
    considerations: [
      "How would you generate short IDs (counter-based vs hashing)?",
      "How would you handle cache eviction strategies?",
      "How would you handle hot URLs that receive millions of hits?",
      "How would you design the analytics pipeline?",
    ],
  },
  {
    id: "distributed-cache",
    title: "Design a Distributed Cache",
    difficulty: "hard",
    category: "Infrastructure",
    scenario:
      "Design a distributed in-memory caching system like Redis or Memcached that can be used across a fleet of microservices.",
    coreRequirements: [
      "Key-value store with TTL support",
      "Support GET, SET, DELETE operations",
      "Consistent hashing for key distribution",
      "Replication for high availability",
      "Cache invalidation strategies",
    ],
    scaleRequirements: [
      "Sub-millisecond read/write latency",
      "Petabyte-scale storage across cluster",
      "Zero-downtime node additions/removals",
    ],
    considerations: [
      "How would you handle cache stampede / thundering herd?",
      "How would you implement consistent hashing with virtual nodes?",
      "How would you handle write-through vs write-behind caching?",
      "How would you ensure consistency across replicas?",
    ],
  },
  {
    id: "ride-sharing",
    title: "Design a Ride Sharing App",
    difficulty: "hard",
    category: "Real-time Location",
    scenario:
      "Design the backend for a ride-sharing platform like Uber or Ola. The system should match drivers and riders in real-time based on proximity.",
    coreRequirements: [
      "Real-time location tracking for drivers and riders",
      "Match rider requests to the nearest available driver",
      "Dynamic pricing based on supply and demand",
      "Trip lifecycle management (request, accept, start, complete)",
      "In-app messaging between rider and driver",
    ],
    scaleRequirements: [
      "Handle 5 million concurrent driver location updates per minute",
      "Sub-second driver matching",
      "Operate across multiple cities/regions",
    ],
    considerations: [
      "How would you implement geospatial indexing for efficient proximity queries?",
      "How would you design the matching algorithm?",
      "How would you handle the surge pricing calculation?",
      "How would you manage driver state machines?",
    ],
  },
  {
    id: "social-feed",
    title: "Design a Social Media News Feed",
    difficulty: "medium",
    category: "Social Platforms",
    scenario:
      "Design a social media news feed system like Twitter/X or Instagram. Users can post content and see a personalized feed of posts from people they follow.",
    coreRequirements: [
      "Users can create posts (text, images)",
      "Users can follow/unfollow others",
      "Generate personalized feeds for each user",
      "Support likes, comments, and shares",
      "Support trending topics",
    ],
    scaleRequirements: [
      "100 million daily active users",
      "1 billion posts per day",
      "Feed generation in under 200ms",
    ],
    considerations: [
      "Push vs pull model for feed generation?",
      "How would you handle celebrity accounts with millions of followers?",
      "How would you rank posts in the feed?",
      "How would you handle content delivery globally?",
    ],
  },
  {
    id: "video-streaming",
    title: "Design a Video Streaming Platform",
    difficulty: "hard",
    category: "Media & Content",
    scenario:
      "Design a video streaming service like Netflix or YouTube. Users can upload, search, and stream videos on demand.",
    coreRequirements: [
      "Video upload and transcoding pipeline",
      "Adaptive bitrate streaming",
      "Video search and recommendations",
      "User watch history and resume playback",
      "Content delivery to global users",
    ],
    scaleRequirements: [
      "1 billion video views per day",
      "Petabytes of video storage",
      "Seamless playback at 2-second startup time",
    ],
    considerations: [
      "How would you design the video transcoding pipeline?",
      "How would you implement adaptive bitrate streaming?",
      "How would you optimize CDN edge caching?",
      "How would you build the recommendation engine?",
    ],
  },
  {
    id: "search-engine",
    title: "Design a Web Search Engine",
    difficulty: "hard",
    category: "Search & Indexing",
    scenario:
      "Design a basic web search engine that can crawl web pages, build an index, and return relevant search results.",
    coreRequirements: [
      "Web crawler to discover and index pages",
      "Inverted index for full-text search",
      "PageRank or similar ranking algorithm",
      "Query parsing and result ranking",
      "Spell correction and autocomplete",
    ],
    scaleRequirements: [
      "Index billions of web pages",
      "Serve millions of queries per second",
      "Return results in under 100ms",
    ],
    considerations: [
      "How would you design the distributed crawler?",
      "How would you build and update the inverted index at scale?",
      "How would you handle duplicate content detection?",
      "How would you design the ranking algorithm?",
    ],
  },
  {
    id: "payment-system",
    title: "Design a Payment Processing System",
    difficulty: "hard",
    category: "Financial Systems",
    scenario:
      "Design a payment processing system like Stripe or Razorpay that can handle online transactions between buyers and sellers.",
    coreRequirements: [
      "Process credit/debit card transactions",
      "Support multiple payment methods",
      "Idempotent transaction processing",
      "Fraud detection and prevention",
      "Refund and chargeback handling",
    ],
    scaleRequirements: [
      "Process 10,000 transactions per second",
      "99.999% uptime (five nines)",
      "Sub-2 second transaction completion",
    ],
    considerations: [
      "How would you ensure exactly-once payment processing?",
      "How would you implement distributed transactions?",
      "How would you design the fraud detection pipeline?",
      "How would you handle PCI compliance in the architecture?",
    ],
  },
  {
    id: "chat-system",
    title: "Design a Real-time Chat System",
    difficulty: "medium",
    category: "Messaging",
    scenario:
      "Design a real-time chat application like WhatsApp or Slack. The system should support one-on-one and group chats with message persistence.",
    coreRequirements: [
      "Real-time message delivery via WebSocket",
      "One-on-one and group chat support",
      "Message persistence and history",
      "Online presence indicators",
      "Read receipts and message status",
    ],
    scaleRequirements: [
      "100 million concurrent users",
      "1 billion messages per day",
      "Message delivery under 100ms",
    ],
    considerations: [
      "How would you route messages to the correct WebSocket server?",
      "How would you implement presence detection efficiently?",
      "How would you handle message ordering in group chats?",
      "How would you design end-to-end encryption?",
    ],
  },
];

export function getProblemById(id: string): SystemDesignProblemFull | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
