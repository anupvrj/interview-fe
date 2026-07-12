"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SECTION_NAME_INPUT_CLASS =
  "h-8 text-sm font-medium";

interface SectionNameFieldProps {
  sectionId: string;
  title: string;
  onTitleChange: (sectionId: string, title: string) => void;
}

export function SectionNameField({
  sectionId,
  title,
  onTitleChange,
}: SectionNameFieldProps) {
  const [value, setValue] = useState(title);

  useEffect(() => {
    setValue(title);
  }, [title]);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(title);
      return;
    }
    if (trimmed !== title) {
      onTitleChange(sectionId, trimmed);
    }
  };

  return (
    <div className="mb-4">
      <Label htmlFor={`section-name-${sectionId}`} className="text-xs">
        Section name
      </Label>
      <Input
        id={`section-name-${sectionId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setValue(title);
            e.currentTarget.blur();
          }
        }}
        className={SECTION_NAME_INPUT_CLASS}
      />
    </div>
  );
}
