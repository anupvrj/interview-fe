"use client";

import { FileText, Linkedin } from "lucide-react";
import {
  resumeBuilderMethodToggle,
  resumeBuilderMethodToggleItem,
} from "./resumeBuilderStyles";

export type ResumeBuilderImportMethod = "pdf" | "linkedin";

interface ResumeBuilderImportMethodToggleProps {
  value: ResumeBuilderImportMethod;
  onChange: (method: ResumeBuilderImportMethod) => void;
  disabled?: boolean;
}

export function ResumeBuilderImportMethodToggle({
  value,
  onChange,
  disabled = false,
}: ResumeBuilderImportMethodToggleProps) {
  return (
    <div className={resumeBuilderMethodToggle}>
      <button
        type="button"
        disabled={disabled}
        className={resumeBuilderMethodToggleItem(value === "pdf")}
        onClick={() => onChange("pdf")}
      >
        <FileText className="h-4 w-4" />
        PDF resume
      </button>
      <button
        type="button"
        disabled={disabled}
        className={resumeBuilderMethodToggleItem(value === "linkedin")}
        onClick={() => onChange("linkedin")}
      >
        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
        LinkedIn
      </button>
    </div>
  );
}
