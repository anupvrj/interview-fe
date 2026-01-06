/**
 * Classic Template Dummy Content
 */

export const classicDummyContent = {
  personalInfo: {
    firstName: "James",
    lastName: "Miller",
    email: "james.miller@email.com",
    phone: "+1 555-567-8901",
    location: "Chicago, IL",
    linkedin: "linkedin.com/in/jamesmiller",
    jobTitle: "Business Analyst",
  },

  profileSummary:
    "Detail-oriented Business Analyst with 4+ years of experience in data analysis and process improvement. Skilled in translating business requirements into technical specifications and driving data-driven decision making.",

  experience: [
    {
      jobTitle: "Business Analyst",
      company: "Consulting Group LLC",
      location: "Chicago, IL",
      startDate: "2020-03",
      endDate: "Present",
      current: true,
      description: [
        "Analyzed business processes and identified opportunities for improvement",
        "Created detailed documentation and requirements specifications",
        "Collaborated with stakeholders to define project scope and deliverables",
        "Conducted data analysis using SQL and Excel to support business decisions",
      ],
    },
    {
      jobTitle: "Junior Business Analyst",
      company: "Tech Solutions Inc",
      location: "Chicago, IL",
      startDate: "2019-06",
      endDate: "2020-02",
      current: false,
      description: [
        "Assisted in gathering and documenting business requirements",
        "Created process flow diagrams and user stories",
        "Supported UAT and quality assurance activities",
      ],
    },
  ],

  skills: [
    {
      category: "Analysis",
      skills: ["Requirements Gathering", "Process Mapping", "Data Analysis"],
    },
    {
      category: "Technical",
      skills: ["SQL", "Excel", "Tableau", "Jira", "Confluence"],
    },
    {
      category: "Business",
      skills: ["Stakeholder Management", "Project Management", "Agile/Scrum"],
    },
  ],

  education: [
    {
      degree: "Bachelor of Business Administration",
      institution: "University of Illinois",
      location: "Chicago, IL",
      startDate: "2015",
      endDate: "2019",
      gpa: "3.6",
      description: "",
    },
  ],

  projects: [],
  certificates: [],
  achievements: [],
  languages: [{ name: "English", proficiency: "Native" }],
  interests: ["Data Visualization", "Process Optimization", "Chess"],
};

