/**
 * Sample content for the mercury template ("Skip & use defaults").
 *
 * Every value is an obvious placeholder (Your Name, Sample Job 1, Sample Degree 1…)
 * so it can never be mistaken for a real person. The resume placeholder check
 * (src/lib/resume/placeholderCheck.ts) warns if any of it is left in.
 */
export const mercuryDummyContent = {
  personalInfo: {
    fullName: "Your Name",
    email: "your.email@example.com",
    phone: "+00 00000 00000",
    location: "Sample City, Country",
    linkedin: "linkedin.com/in/your-profile",
    github: "github.com/your-username",
    website: "your-website.example.com",
    portfolio: "Your Title",
  },
  profileSummary: "Sample summary — write 2–3 lines about your experience, your strongest skills and the role you want.",
  experience: [
    {
      position: "Sample Job 1",
      company: "Sample Company 1",
      location: "Sample City, Country",
      startDate: "2022",
      endDate: "Present",
      current: true,
      description: [
        "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
        "Sample bullet 2 — describe a project or responsibility you owned and its result.",
      ],
    },
    {
      position: "Sample Job 2",
      company: "Sample Company 2",
      location: "Sample City, Country",
      startDate: "2018",
      endDate: "2022",
      current: false,
      description: [
        "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
        "Sample bullet 2 — describe a project or responsibility you owned and its result.",
      ],
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
  education: [
    {
      degree: "Sample Degree 1",
      institution: "Sample University 1",
      location: "Sample City, Country",
      startDate: "2016",
      endDate: "2018",
      description: "Sample — add relevant coursework, honours or grades (optional).",
    },
    {
      degree: "Sample Degree 2",
      institution: "Sample University 2",
      location: "Sample City, Country",
      startDate: "2015",
      endDate: "2018",
      description: "Sample — add relevant coursework, honours or grades (optional).",
    },
  ],
  languages: [
    {
      name: "Sample Language 1",
      level: 4,
    },
    {
      name: "Sample Language 2",
      level: 4,
    },
  ],
  awards: [
    {
      title: "Sample Award 1",
      organization: "Sample Organisation 1",
    },
  ],
};

export default mercuryDummyContent;
