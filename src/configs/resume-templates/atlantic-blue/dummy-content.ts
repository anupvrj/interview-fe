/**
 * Sample content for the atlantic-blue template ("Skip & use defaults").
 *
 * Every value is an obvious placeholder (Your Name, Sample Job 1, Sample Degree 1…)
 * so it can never be mistaken for a real person. The resume placeholder check
 * (src/lib/resume/placeholderCheck.ts) warns if any of it is left in.
 */
export const atlanticblueDummyContent = {
  personalInfo: {
    fullName: "Your Name",
    email: "your.email@example.com",
    phone: "+00 00000 00000",
    location: "Sample City, Country",
    linkedin: "linkedin.com/in/your-profile",
    github: "github.com/your-username",
    website: "your-website.example.com",
    position: "Your Title",
    portfolio: "Your Title",
  },
  profileSummary: "Sample summary — write 2–3 lines about your experience, your strongest skills and the role you want.",
  experience: [
    {
      position: "Sample Job 1",
      company: "Sample Company 1",
      location: "Sample City, Country",
      startDate: "2021-03",
      endDate: "Present",
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
      startDate: "2018-06",
      endDate: "2021-02",
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
      startDate: "2016-08",
      endDate: "2018-05",
      current: false,
      description: [
        "Sample bullet 1 — describe a key achievement in this role, starting with an action verb.",
        "Sample bullet 2 — describe a project or responsibility you owned and its result.",
        "Sample bullet 3 — mention a tool, process or team you improved.",
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
    "Sample Skill 7",
    "Sample Skill 8",
    "Sample Skill 9",
    "Sample Skill 10",
    "Sample Skill 11",
    "Sample Skill 12",
    "Sample Skill 13",
    "Sample Skill 14",
    "Sample Skill 15",
    "Sample Skill 16",
    "Sample Skill 17",
    "Sample Skill 18",
    "Sample Skill 19",
  ],
  education: [
    {
      degree: "Sample Degree 1",
      institution: "Sample University 1",
      location: "Sample City, Country",
      startDate: "2012",
      endDate: "2016",
      gpa: "",
      description: "Sample — add relevant coursework, honours or grades (optional).",
    },
  ],
  projects: [
    {
      id: "proj1",
      name: "Sample Project 1",
      description: "Sample project — describe what you built, the tools you used and the result.",
      technologies: ["Sample Tool 1", "Sample Tool 2", "Sample Tool 3", "Sample Tool 4"],
      link: "https://example.com/project-1",
    },
    {
      id: "proj2",
      name: "Sample Project 2",
      description: "Sample project — describe what you built, the tools you used and the result.",
      technologies: ["Sample Tool 1", "Sample Tool 2", "Sample Tool 3", "Sample Tool 4"],
      link: "https://example.com/project-2",
    },
  ],
  certificates: [
    {
      id: "cert1",
      title: "Sample Certificate 1",
      issuer: "Sample Organisation 1",
      issueDate: "2023-03",
      link: "https://example.com/certificate",
    },
    {
      id: "cert2",
      title: "Sample Certificate 2",
      issuer: "Sample Organisation 2",
      issueDate: "2022-08",
      link: "https://example.com/certificate",
    },
  ],
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
      level: 3,
    },
  ],
  achievements: [
    {
      id: "ach1",
      title: "Sample Achievement 1",
      description: "Sample — describe the achievement and why it mattered.",
      date: "2023",
    },
    {
      id: "ach2",
      title: "Sample Achievement 2",
      description: "Sample — describe the achievement and why it mattered.",
      date: "2022",
    },
    {
      id: "ach3",
      title: "Sample Achievement 3",
      description: "Sample — describe the achievement and why it mattered.",
      date: "2021-2023",
    },
  ],
  interests: "Sample Interest 1, Sample Interest 2, Sample Interest 3",
};

export default atlanticblueDummyContent;
