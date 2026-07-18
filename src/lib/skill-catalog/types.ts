export type SkillCategory =
  | "programmingLanguages"
  | "webFrameworks"
  | "mobile"
  | "databases"
  | "cloudDevOps"
  | "dataMl"
  | "qaTesting"
  | "design"
  | "productAgile"
  | "salesMarketing"
  | "finance"
  | "ecommerceOps"
  | "hrRecruiting"
  | "softSkills"
  | "toolsPlatforms";

export type SkillGroupDefinition = {
  category: SkillCategory;
  skills: readonly string[];
};
