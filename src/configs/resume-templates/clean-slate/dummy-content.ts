/**
 * Clean Slate Template Dummy Content
 * Sample data for template preview
 */

export const cleanslateDummyContent = {
  personalInfo: {
    firstName: "Emily",
    lastName: "Roberts",
    email: "emily.roberts@email.com",
    phone: "+1 555-234-5678",
    location: "Boston, MA",
    linkedin: "linkedin.com/in/emilyroberts",
    github: "github.com/emilyroberts",
    website: "emilyroberts.com",
    jobTitle: "Software Engineer",
  },

  profileSummary:
    "Dedicated Software Engineer with 5+ years of experience in full-stack development. Skilled in building responsive web applications using modern JavaScript frameworks. Strong problem-solving abilities and passion for writing clean, maintainable code.",

  experience: [
    {
      jobTitle: "Software Engineer",
      company: "Tech Innovations Inc",
      location: "Boston, MA",
      startDate: "2020-01",
      endDate: "Present",
      current: true,
      description: [
        "Developed and maintained React-based web applications serving 200K+ users",
        "Collaborated with cross-functional teams to deliver features on time",
        "Improved application performance by 35% through code optimization",
        "Participated in code reviews and mentored junior developers",
      ],
    },
    {
      jobTitle: "Junior Software Developer",
      company: "Digital Solutions LLC",
      location: "Boston, MA",
      startDate: "2018-06",
      endDate: "2019-12",
      current: false,
      description: [
        "Built responsive user interfaces using React and CSS3",
        "Integrated RESTful APIs and managed state with Redux",
        "Fixed bugs and implemented new features based on user feedback",
        "Worked in agile environment with 2-week sprint cycles",
      ],
    },
  ],

  skills: [
    {
      category: "Programming Languages",
      skills: ["JavaScript", "TypeScript", "Python", "HTML5", "CSS3"],
    },
    {
      category: "Frameworks & Libraries",
      skills: ["React", "Node.js", "Express", "Redux", "Next.js"],
    },
    {
      category: "Tools & Technologies",
      skills: ["Git", "Docker", "AWS", "MongoDB", "PostgreSQL"],
    },
  ],

  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "Boston University",
      location: "Boston, MA",
      startDate: "2014",
      endDate: "2018",
      gpa: "3.7",
      description: "Dean's List, Computer Science Society Member",
    },
  ],

  projects: [
    {
      title: "Task Management Application",
      description:
        "Built a collaborative task management tool with real-time updates, supporting team collaboration and project tracking.",
      technologies: ["React", "Node.js", "Socket.io", "MongoDB"],
      startDate: "2021-03",
      endDate: "2021-08",
      url: "https://example-tasks.com",
    },
    {
      title: "Weather Dashboard",
      description:
        "Created a responsive weather dashboard that displays real-time weather data and forecasts for multiple locations.",
      technologies: ["React", "TypeScript", "Weather API", "Chart.js"],
      startDate: "2020-09",
      endDate: "2020-12",
      url: "https://example-weather.com",
    },
  ],

  certificates: [
    {
      name: "AWS Certified Developer - Associate",
      issuer: "Amazon Web Services",
      date: "2022-05",
      url: "",
    },
  ],

  achievements: [],
  
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Spanish", proficiency: "Intermediate" },
  ],

  interests: ["Open Source", "Tech Meetups", "Reading", "Yoga"],
};

