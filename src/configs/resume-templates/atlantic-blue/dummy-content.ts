/**
 * Atlantic Blue Template Dummy Content
 * Sample data for template preview
 */

export const atlanticblueDummyContent = {
  personalInfo: {
    fullName: "Michael Anderson",
    email: "michael.anderson@email.com",
    phone: "+1 555-789-0123",
    location: "Seattle, WA",
    linkedin: "linkedin.com/in/michaelanderson",
    github: "github.com/michaelanderson",
    website: "michaelanderson.dev",
    position: "Senior Full Stack Developer",
  },

  profileSummary:
    "Results-driven Full Stack Developer with 7+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies. Proven track record of leading development teams and delivering high-impact solutions for enterprise clients.",

  experience: [
    {
      position: "Senior Full Stack Developer",
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
      position: "Full Stack Developer",
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
      position: "Junior Developer",
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
    "React",
    "TypeScript",
    "JavaScript",
    "HTML5",
    "CSS3",
    "Redux",
    "Next.js",
    "Node.js",
    "Express",
    "Python",
    "Django",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "Kubernetes",
    "AWS",
    "CI/CD",
    "Git",
    "Jenkins",
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
      id: "proj1",
      name: "E-Commerce Platform",
      description:
        "Built a full-featured e-commerce platform with React frontend and Node.js backend, supporting 50K+ products and processing 10K+ daily transactions.",
      technologies: ["React", "Node.js", "PostgreSQL", "Stripe API", "AWS"],
      link: "https://example-ecommerce.com",
    },
    {
      id: "proj2",
      name: "Real-Time Chat Application",
      description:
        "Developed a scalable real-time chat application using WebSockets, supporting 100K+ concurrent users with message persistence and file sharing.",
      technologies: ["React", "Socket.io", "Redis", "MongoDB", "Docker"],
      link: "https://example-chat.com",
    },
  ],

  certificates: [
    {
      id: "cert1",
      title: "AWS Certified Solutions Architect - Professional",
      issuer: "Amazon Web Services",
      issueDate: "2023-03",
      link: "https://aws.amazon.com/certification/",
    },
    {
      id: "cert2",
      title: "Certified Kubernetes Administrator (CKA)",
      issuer: "Cloud Native Computing Foundation",
      issueDate: "2022-08",
      link: "https://www.cncf.io/certification/cka/",
    },
  ],

  languages: [
    { name: "English", level: 5 },
    { name: "Spanish", level: 4 },
    { name: "French", level: 3 },
  ],

  achievements: [
    {
      id: "ach1",
      title: "Company Hackathon Winner",
      description: "Led team that won company hackathon with innovative AI-powered solution",
      date: "2023",
    },
    {
      id: "ach2",
      title: "Cost Optimization Achievement",
      description: "Reduced server costs by 40% through infrastructure optimization",
      date: "2022",
    },
    {
      id: "ach3",
      title: "Technical Blogger",
      description: "Published technical blog posts with 50K+ monthly readers",
      date: "2021-2023",
    },
  ],

  interests: "Open Source Contribution, Tech Blogging, Photography, Hiking",
};

/**
 * Default export for template loader
 */
export default atlanticblueDummyContent;

