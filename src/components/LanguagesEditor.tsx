"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Language {
  id: string;
  name: string;
  proficiency?: number; // 1-5 rating, optional
}

interface LanguagesEditorProps {
  languages: Language[];
  onChange: (languages: Language[]) => void;
}

export function LanguagesEditor({ languages, onChange }: LanguagesEditorProps) {
  const addLanguage = () => {
    const nanoid = () => Math.random().toString(36).substring(2, 9);
    const newLanguage = {
      id: nanoid(),
      name: "",
      // No default proficiency - user can choose to add rating or not
    };
    onChange([...languages, newLanguage]);
  };

  const removeLanguage = (id: string) => {
    onChange(languages.filter((lang) => lang.id !== id));
  };

  const updateLanguage = (
    id: string,
    field: keyof Language,
    value: string | number | undefined
  ) => {
    onChange(
      languages.map((lang) =>
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    );
  };

  return (
    <div className="space-y-4">
      {languages.map((lang, index) => (
        <div key={lang.id} className="border rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">Language {index + 1}</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeLanguage(lang.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Language Name</Label>
              <Input
                value={lang.name || ""}
                onChange={(e) =>
                  updateLanguage(lang.id, "name", e.target.value)
                }
                placeholder="e.g., English, Spanish"
              />
            </div>
            <div>
              <Label className="text-xs">Proficiency Level (Optional)</Label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      const newLevel =
                        lang.proficiency === level ? undefined : level;
                      updateLanguage(lang.id, "proficiency", newLevel);
                    }}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      lang.proficiency && lang.proficiency >= level
                        ? "bg-blue-500 border-blue-500"
                        : "bg-gray-200 border-gray-300 hover:border-blue-300"
                    }`}
                    title={`Level ${level}${
                      level === 5
                        ? " (Native)"
                        : level === 4
                        ? " (Fluent)"
                        : level === 3
                        ? " (Good)"
                        : level === 2
                        ? " (Basic)"
                        : " (Beginner)"
                    }`}
                  />
                ))}
                {lang.proficiency && (
                  <button
                    type="button"
                    onClick={() =>
                      updateLanguage(lang.id, "proficiency", undefined)
                    }
                    className="text-xs text-gray-500 hover:text-red-500 ml-2"
                    title="Remove rating"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {lang.proficiency
                  ? `Level ${lang.proficiency}${
                      lang.proficiency === 5
                        ? " (Native)"
                        : lang.proficiency === 4
                        ? " (Fluent)"
                        : lang.proficiency === 3
                        ? " (Good)"
                        : lang.proficiency === 2
                        ? " (Basic)"
                        : " (Beginner)"
                    }`
                  : "Click dots to rate proficiency"}
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button size="sm" onClick={addLanguage}>
        <Plus className="w-4 h-4 mr-2" />
        Add Language
      </Button>
    </div>
  );
}
