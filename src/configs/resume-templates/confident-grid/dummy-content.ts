/**
 * Sample content for the confident-grid template ("Skip & use defaults").
 *
 * Every value is an obvious placeholder (Your Name, Sample Job 1, Sample Degree 1…)
 * so it can never be mistaken for a real person. The resume placeholder check
 * (src/lib/resume/placeholderCheck.ts) warns if any of it is left in.
 */
export const confidentgridDummyContent = {
  personalInfo: {
    fullName: "Your Name",
    email: "your.email@example.com",
    phone: "+00 00000 00000",
    location: "Sample City, Country",
    linkedin: "linkedin.com/in/your-profile",
    portfolio: "Your Title",
    profilePicture: "",
  },
  profileSummary: "Sample summary — write 2–3 lines about your experience, your strongest skills and the role you want.",
  experience: [
    {
      position: "Sample Job 1",
      company: "Sample Company 1",
      location: "Sample City, Country",
      startDate: "2018-01",
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
      startDate: "2013-06",
      endDate: "2017-12",
      current: false,
      description: [
        "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
        "Sample bullet 2 — describe a project or responsibility you owned and its result.",
        "Sample bullet 3 — mention a tool, process or team you improved.",
      ],
    },
    {
      position: "Sample Job 3",
      company: "Sample Company 3",
      location: "Sample City, Country",
      startDate: "2009-01",
      endDate: "2013-05",
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
      startDate: "2007",
      endDate: "2009",
      gpa: "",
      description: "Sample — add relevant coursework, honours or grades (optional).",
    },
    {
      degree: "Sample Degree 2",
      institution: "Sample University 2",
      location: "Sample City, Country",
      startDate: "2003",
      endDate: "2007",
      gpa: "",
      description: "Sample — add relevant coursework, honours or grades (optional).",
    },
  ],
  skills: [
    "Sample Skill 1",
    "Sample Skill 2",
    "Sample Skill 3",
    "Sample Skill 4",
    "Sample Skill 5",
  ],
  projects: [
    {
      name: "Sample Project 1",
      description: "Sample project — describe what you built, the tools you used and the result.",
      technologies: "Sample Tool 1, Sample Tool 2, Sample Tool 3",
      startDate: "2020",
      endDate: "2021",
    },
    {
      name: "Sample Project 2",
      description: "Sample project — describe what you built, the tools you used and the result.",
      technologies: "Sample Tool 1, Sample Tool 2, Sample Tool 3",
      startDate: "2019",
      endDate: "2020",
    },
  ],
  certificates: [],
  achievements: [],
  languages: [],
  interests: "Sample Interest 1, Sample Interest 2, Sample Interest 3",
};

export default confidentgridDummyContent;
