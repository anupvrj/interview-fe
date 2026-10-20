/**
 * Sample content for the cobalt-stream template ("Skip & use defaults").
 *
 * Every value is an obvious placeholder (Your Name, Sample Job 1, Sample Degree 1…)
 * so it can never be mistaken for a real person. The resume placeholder check
 * (src/lib/resume/placeholderCheck.ts) warns if any of it is left in.
 */
export const cobaltstreamDummyContent = {
  personalInfo: {
    fullName: "Your Name",
    email: "your.email@example.com",
    phone: "+00 00000 00000",
    location: "Sample City, Country",
    linkedin: "linkedin.com/in/your-profile",
    portfolio: "Your Title",
  },
  profileSummary: "Sample summary — write 2–3 lines about your experience, your strongest skills and the role you want.",
  experience: [
    {
      position: "Sample Job 1",
      company: "Sample Company 1",
      location: "Sample City, Country",
      startDate: "2020-01",
      endDate: "",
      current: true,
      description: [
        "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
        "Sample bullet 2 — describe a project or responsibility you owned and its result.",
        "Sample bullet 3 — mention a tool, process or team you improved.",
        "Sample bullet 4 — add another accomplishment that matches the job you want.",
      ],
    },
    {
      position: "Sample Job 2",
      company: "Sample Company 2",
      location: "Sample City, Country",
      startDate: "2016-06",
      endDate: "2019-12",
      current: false,
      description: [
        "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
        "Sample bullet 2 — describe a project or responsibility you owned and its result.",
        "Sample bullet 3 — mention a tool, process or team you improved.",
        "Sample bullet 4 — add another accomplishment that matches the job you want.",
      ],
    },
    {
      position: "Sample Job 3",
      company: "Sample Company 3",
      location: "Sample City, Country",
      startDate: "2013-03",
      endDate: "2016-05",
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
      startDate: "2011",
      endDate: "2013",
      gpa: "",
      description: "Sample — add relevant coursework, honours or grades (optional).",
    },
    {
      degree: "Sample Degree 2",
      institution: "Sample University 2",
      location: "Sample City, Country",
      startDate: "2007",
      endDate: "2011",
      gpa: "",
      description: "Sample — add relevant coursework, honours or grades (optional).",
    },
  ],
  awards: [
    {
      title: "Sample Award 1",
      description: "Sample — describe what the award was for.",
    },
    {
      title: "Sample Award 2",
      description: "Sample — describe what the award was for.",
    },
  ],
  skills: [
    "Sample Skill 1",
    "Sample Skill 2",
    "Sample Skill 3",
    "Sample Skill 4",
    "Sample Skill 5",
    "Sample Skill 6",
  ],
  projects: [],
  certificates: [],
  achievements: [],
  languages: [
    {
      name: "Sample Language 1",
      level: 5,
    },
  ],
  interests: "Sample Interest 1, Sample Interest 2, Sample Interest 3",
};

export default cobaltstreamDummyContent;
