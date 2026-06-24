/**
 * Executive Template Skills Component
 * Skills with rating out of 5 (displayed as dots)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  resumeEntryCard,
  resumeGripIcon,
} from "@/components/resume-editor/resumeEditorStyles";

interface Skill {
  id: string;
  name: string;
  level: number; // 1-5
}

interface ExecutiveSkillsProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

export function ExecutiveSkills({ skills, onChange }: ExecutiveSkillsProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  const addSkill = () => {
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: "",
      level: 3, // Default to 3 out of 5
    };
    onChange([...skills, newSkill]);
    setExpandedSkills(new Set([...expandedSkills, newSkill.id]));
  };

  const updateSkill = (
    id: string,
    field: keyof Skill,
    value: string | number
  ) => {
    onChange(
      skills.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    );
  };

  const removeSkill = (id: string) => {
    onChange(skills.filter((skill) => skill.id !== id));
    const newExpanded = new Set(expandedSkills);
    newExpanded.delete(id);
    setExpandedSkills(newExpanded);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSkills(newExpanded);
  };

  return (
    <div className="space-y-3">
      {skills.map((skill, index) => (
        <div key={skill.id} className={resumeEntryCard}>
          {/* Skill Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-1 items-center gap-2">
              <GripVertical className={resumeGripIcon} />
              <div className="flex-1">
                {skill.name ? (
                  <span className="font-medium text-foreground">{skill.name}</span>
                ) : (
                  <span className="italic text-muted-foreground">New Skill</span>
                )}
              </div>
              {/* Rating Display (Dots) */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i < skill.level ? "bg-primary" : "bg-muted-foreground/25"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="ml-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(skill.id)}
                className="h-8 px-2 text-muted-foreground hover:text-primary"
              >
                {expandedSkills.has(skill.id) ? "▼" : "▶"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSkill(skill.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Skill Edit Form */}
          {expandedSkills.has(skill.id) && (
            <div className="space-y-4 border-t border-border/60 pt-3">
              {/* Skill Name */}
              <div>
                <Label
                  htmlFor={`skill-name-${skill.id}`}
                  className="text-sm font-medium"
                >
                  Skill Name *
                </Label>
                <Input
                  id={`skill-name-${skill.id}`}
                  type="text"
                  value={skill.name}
                  onChange={(e) =>
                    updateSkill(skill.id, "name", e.target.value)
                  }
                  placeholder="e.g., Product development and strategy"
                  className="mt-1"
                />
              </div>

              {/* Skill Level (Rating) */}
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
                        onClick={() => updateSkill(skill.id, "level", i + 1)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          i < skill.level
                            ? "border-primary bg-primary"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                        title={`Level ${i + 1}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {skill.level} / 5
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Click on the dots to set proficiency level
                </p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Skill Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addSkill}
        className="w-full border-dashed border-2 border-primary/30 text-primary hover:border-primary/50 hover:bg-primary/[0.06]"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Skill
      </Button>

      {skills.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No skills added yet. Click "Add Skill" to get started.
        </p>
      )}
    </div>
  );
}




