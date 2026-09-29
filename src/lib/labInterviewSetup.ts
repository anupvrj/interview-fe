/**
 * End-user interview setup fields for Agent Lab production-path Live Test.
 * Mirrors dashboard interview create (department → profile via resolveProfileRef).
 */

export type LabDepartment =
  | "engineering"
  | "management"
  | "commerce_finance"
  | "healthcare_pharma"
  | "marketing"
  | "sales"
  | "general";

export type LabDiscipline =
  | "cse"
  | "it"
  | "mech"
  | "civil"
  | "mba"
  | "bba"
  | "none";

export type LabInterviewSetup = {
  role: string;
  experience: number;
  language: "en" | "hi";
  targetCompany: string;
  department: LabDepartment;
  discipline: LabDiscipline;
  interviewDuration: 15 | 30;
  jobDescription: string;
};

export const LAB_DEPARTMENT_OPTIONS: Array<{
  value: LabDepartment;
  label: string;
}> = [
  { value: "engineering", label: "Engineering" },
  { value: "management", label: "Management" },
  { value: "commerce_finance", label: "Commerce & Finance" },
  { value: "healthcare_pharma", label: "Healthcare & Pharma" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "general", label: "General" },
];

export const LAB_DISCIPLINE_BY_DEPARTMENT: Partial<
  Record<LabDepartment, Array<{ value: LabDiscipline; label: string }>>
> = {
  engineering: [
    { value: "cse", label: "CSE" },
    { value: "it", label: "IT" },
    { value: "mech", label: "Mechanical" },
    { value: "civil", label: "Civil" },
  ],
  management: [
    { value: "mba", label: "MBA" },
    { value: "bba", label: "BBA" },
  ],
};

export const LAB_EXPERIENCE_OPTIONS = [
  { value: 0, label: "Fresher" },
  { value: 1, label: "1 year" },
  { value: 2, label: "2 years" },
  { value: 3, label: "3 years" },
  { value: 4, label: "4 years" },
  { value: 5, label: "5+ years" },
] as const;

export const DEFAULT_LAB_INTERVIEW_SETUP: LabInterviewSetup = {
  role: "Backend Engineer",
  experience: 5,
  language: "en",
  targetCompany: "Acme Corp",
  department: "engineering",
  discipline: "cse",
  interviewDuration: 15,
  jobDescription: "",
};

/** Same naming as core `profileMongoName` — what resolveProfileRef will load. */
export function labProfileNameFromSetup(setup: LabInterviewSetup): string {
  const disciplines = LAB_DISCIPLINE_BY_DEPARTMENT[setup.department];
  const discipline =
    disciplines?.some((d) => d.value === setup.discipline)
      ? setup.discipline
      : "none";
  return `profile-${setup.department}-${discipline}`;
}

export function normalizeDisciplineForDepartment(
  department: LabDepartment,
  discipline: LabDiscipline,
): LabDiscipline {
  const options = LAB_DISCIPLINE_BY_DEPARTMENT[department];
  if (!options?.length) return "none";
  return options.some((d) => d.value === discipline) ? discipline : options[0].value;
}
