/**
 * Sample content for the saffron-line template ("Skip & use defaults").
 *
 * Every value is an obvious placeholder (Your Name, Sample Job 1, Sample Degree 1…)
 * so it can never be mistaken for a real person. The resume placeholder check
 * (src/lib/resume/placeholderCheck.ts) warns if any of it is left in.
 */
export const saffronlineDummyContent = {
  personalInfo: {
    fullName: "Your Name",
    email: "your.email@example.com",
    phone: "+00 00000 00000",
    location: "Sample City, Country",
    linkedin: "linkedin.com/in/your-profile",
    github: "github.com/your-username",
    website: "your-website.example.com",
    portfolio: "Your Title",
    profilePicture: "",
  },
  profileSummary: "Sample summary — write 2–3 lines about your experience, your strongest skills and the role you want.",
  experience: [
    {
      position: "Sample Job 1",
      company: "Sample Company 1",
      location: "Sample City, Country",
      startDate: "2021-01",
      endDate: "",
      current: true,
      description: [
        "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
        "Sample bullet 2 — describe a project or responsibility you owned and its result.",
        "Sample bullet 3 — mention a tool, process or team you improved.",
      ],
    },
    {
      position: "Sample Job 2",
      company: "Sample Company 2",
      location: "Sample City, Country",
      startDate: "2018-06",
      endDate: "2020-12",
      current: false,
      description: [
        "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
        "Sample bullet 2 — describe a project or responsibility you owned and its result.",
        "Sample bullet 3 — mention a tool, process or team you improved.",
      ],
    },
  ],
  education: [
    {
      degree: "Sample Degree 1",
      institution: "Sample University 1",
      location: "Sample City, Country",
      startDate: "2014",
      endDate: "2018",
      gpa: "",
      description: "Sample — add relevant coursework, honours or grades (optional).",
    },
  ],
  skills: {
    programmingLanguages: "Sample Skill 1, Sample Skill 2, Sample Skill 3",
    frameworksLibraries: "Sample Skill 4, Sample Skill 5, Sample Skill 6",
    coreConcepts: "Sample Skill 7, Sample Skill 8, Sample Skill 9",
    developerTools: "Sample Skill 10, Sample Skill 11, Sample Skill 12",
  },
  projects: [
    {
      name: "Sample Project 1",
      description: "Sample project — describe what you built, the tools you used and the result.",
      technologies: ["Sample Tool 1", "Sample Tool 2", "Sample Tool 3"],
      startDate: "2022",
      endDate: "2023",
    },
  ],
  certificates: [],
  achievements: [],
  languages: [
    {
      name: "Sample Language 1",
      level: 5,
    },
    {
      name: "Sample Language 2",
      level: 4,
    },
    {
      name: "Sample Language 3",
      level: 4,
    },
  ],
  interests: "Sample Interest 1, Sample Interest 2, Sample Interest 3",
};

export default saffronlineDummyContent;
