export type IndustryKey =
  | "technology"
  | "fintech"
  | "sales_marketing"
  | "ecommerce"
  | "saas"
  | "food_tech"
  | "it_services"
  | "others";

export type IndustryDefinition = {
  key: IndustryKey;
  name: string;
  roles: readonly string[];
  order: number;
};

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};
