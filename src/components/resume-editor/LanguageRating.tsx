/**
 * Language Rating Component
 * Languages with rating out of 5 (displayed as dots)
 * Similar to ExecutiveSkills but for languages
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Language {
  id: string;
  name: string;
  level: number; // 1-5
}

interface LanguageRatingProps {
  languages: Language[];
  onChange: (languages: Language[]) => void;
}

export function LanguageRating({ languages, onChange }: LanguageRatingProps) {
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(
    new Set()
  );

  const addLanguage = () => {
    const newLanguage: Language = {
      id: `lang-${Date.now()}`,
      name: "",
      level: 3, // Default to 3 out of 5
    };
    onChange([...languages, newLanguage]);
    setExpandedLanguages(new Set([...expandedLanguages, newLanguage.id]));
  };

  const updateLanguage = (
    id: string,
    field: keyof Language,
    value: string | number
  ) => {
    onChange(
      languages.map((lang) =>
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    );
  };

  const removeLanguage = (id: string) => {
    onChange(languages.filter((lang) => lang.id !== id));
    const newExpanded = new Set(expandedLanguages);
    newExpanded.delete(id);
    setExpandedLanguages(newExpanded);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedLanguages);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLanguages(newExpanded);
  };

  const getProficiencyLabel = (level: number): string => {
    const labels: Record<number, string> = {
      5: "Native/Fluent",
      4: "Advanced",
      3: "Intermediate/Conversational",
      2: "Basic",
      1: "Beginner",
    };
    return labels[level] || "Intermediate";
  };

  return (
    <div className="space-y-3">
      {languages.map((lang, index) => (
        <div
          key={lang.id}
          className="border border-border rounded-lg p-4 bg-card hover:border-purple-300 transition-colors"
        >
          {/* Language Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="w-4 h-4 text-muted-foreground/80 cursor-move" />
              <div className="flex-1">
                {lang.name ? (
                  <span className="font-medium text-foreground">{lang.name}</span>
                ) : (
                  <span className="text-muted-foreground/80 italic">New Language</span>
                )}
              </div>
              {/* Rating Display (Dots) */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < lang.level ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {getProficiencyLabel(lang.level)}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(lang.id)}
                className="h-8 px-2 text-muted-foreground hover:text-primary"
              >
                {expandedLanguages.has(lang.id) ? "▼" : "▶"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeLanguage(lang.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Language Edit Form */}
          {expandedLanguages.has(lang.id) && (
            <div className="space-y-4 pt-3 border-t border-border">
              {/* Language Name */}
              <div>
                <Label
                  htmlFor={`lang-name-${lang.id}`}
                  className="text-sm font-medium"
                >
                  Language Name *
                </Label>
                <Input
                  id={`lang-name-${lang.id}`}
                  type="text"
                  value={lang.name}
                  onChange={(e) =>
                    updateLanguage(lang.id, "name", e.target.value)
                  }
                  placeholder="e.g., English"
                  className="mt-1"
                />
              </div>

              {/* Language Level (Rating) */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Proficiency Level (1-5)
                </Label>
                <div className="flex items-center gap-3">
                  {/* Interactive Dots */}
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateLanguage(lang.id, "level", i + 1)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          i < lang.level
                            ? "bg-primary border-purple-600"
                            : "bg-card border-border hover:border-purple-400"
                        }`}
                        title={`Level ${i + 1}: ${getProficiencyLabel(i + 1)}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {lang.level} / 5 - {getProficiencyLabel(lang.level)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click on the dots to set proficiency level
                </p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Language Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addLanguage}
        className="w-full border-dashed border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Language
      </Button>

      {languages.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No languages added yet. Click "Add Language" to get started.
        </p>
      )}
    </div>
  );
}
