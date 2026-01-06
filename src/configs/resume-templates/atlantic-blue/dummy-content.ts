/**
 * Atlantic Blue Template Dummy Content
 * Sample data for template preview
 */

export const atlanticblueDummyContent = {
  personalInfo: {
    firstName: "Michael",
    lastName: "Anderson",
    email: "michael.anderson@email.com",
    phone: "+1 555-789-0123",
    location: "Seattle, WA",
    linkedin: "linkedin.com/in/michaelanderson",
    github: "github.com/michaelanderson",
    website: "michaelanderson.dev",
    jobTitle: "Senior Full Stack Developer",
  },

  profileSummary:
    "Results-driven Full Stack Developer with 7+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies. Proven track record of leading development teams and delivering high-impact solutions for enterprise clients.",

  experience: [
    {
      jobTitle: "Senior Full Stack Developer",
      company: "TechCorp Solutions",
      location: "Seattle, WA",
      startDate: "2021-03",
      endDate: "Present",
      current: true,
      description: [
        "Led development of microservices architecture serving 500K+ daily active users",
        "Architected and implemented CI/CD pipelines, reducing deployment time by 70%",
        "Mentored team of 8 developers and conducted regular code reviews",
        "Improved application performance by 45% through optimization and caching strategies",
      ],
    },
    {
      jobTitle: "Full Stack Developer",
      company: "Digital Innovations Inc",
      location: "San Francisco, CA",
      startDate: "2018-06",
      endDate: "2021-02",
      current: false,
      description: [
        "Developed React-based frontend applications with Redux state management",
        "Built RESTful APIs using Node.js and Express, handling 1M+ requests daily",
        "Implemented authentication and authorization using JWT and OAuth 2.0",
        "Collaborated with UX team to create responsive, mobile-first designs",
      ],
    },
    {
      jobTitle: "Junior Developer",
      company: "StartupHub",
      location: "San Francisco, CA",
      startDate: "2016-08",
      endDate: "2018-05",
      current: false,
      description: [
        "Contributed to full-stack development using MERN stack",
        "Participated in agile development process with 2-week sprints",
        "Fixed bugs and implemented new features based on user feedback",
      ],
    },
  ],

  skills: [
    {
      category: "Frontend",
      skills: ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Redux", "Next.js"],
    },
    {
      category: "Backend",
      skills: ["Node.js", "Express", "Python", "Django", "PostgreSQL", "MongoDB"],
    },
    {
      category: "DevOps & Tools",
      skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Git", "Jenkins"],
    },
  ],

  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of Washington",
      location: "Seattle, WA",
      startDate: "2012",
      endDate: "2016",
      gpa: "3.8",
      description: "Relevant coursework: Data Structures, Algorithms, Web Development, Database Systems",
    },
  ],

  projects: [
    {
      title: "E-Commerce Platform",
      description:
        "Built a full-featured e-commerce platform with React frontend and Node.js backend, supporting 50K+ products and processing 10K+ daily transactions.",
      technologies: ["React", "Node.js", "PostgreSQL", "Stripe API", "AWS"],
      startDate: "2022-01",
      endDate: "2022-09",
      url: "https://example-ecommerce.com",
    },
    {
      title: "Real-Time Chat Application",
      description:
        "Developed a scalable real-time chat application using WebSockets, supporting 100K+ concurrent users with message persistence and file sharing.",
      technologies: ["React", "Socket.io", "Redis", "MongoDB", "Docker"],
      startDate: "2021-06",
      endDate: "2021-12",
      url: "https://example-chat.com",
    },
  ],

  certificates: [
    {
      name: "AWS Certified Solutions Architect - Professional",
      issuer: "Amazon Web Services",
      date: "2023-03",
      url: "https://aws.amazon.com/certification/",
    },
    {
      name: "Certified Kubernetes Administrator (CKA)",
      issuer: "Cloud Native Computing Foundation",
      date: "2022-08",
      url: "https://www.cncf.io/certification/cka/",
    },
  ],

  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Spanish", proficiency: "Professional" },
    { name: "French", proficiency: "Conversational" },
  ],

  achievements: [
    "Led team that won company hackathon with innovative AI-powered solution",
    "Reduced server costs by 40% through infrastructure optimization",
    "Published technical blog posts with 50K+ monthly readers",
  ],

  interests: ["Open Source Contribution", "Tech Blogging", "Photography", "Hiking"],
};

