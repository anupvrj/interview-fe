/**
 * Executive Template Skills Component
 * Skills with rating out of 5 (displayed as dots)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";

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
        <div
          key={skill.id}
          className="border border-gray-200 rounded-lg p-4 bg-white hover:border-purple-300 transition-colors"
        >
          {/* Skill Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              <div className="flex-1">
                {skill.name ? (
                  <span className="font-medium text-gray-900">
                    {skill.name}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">New Skill</span>
                )}
              </div>
              {/* Rating Display (Dots) */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < skill.level ? "bg-primary" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(skill.id)}
                className="h-8 px-2 text-gray-600 hover:text-primary"
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
            <div className="space-y-4 pt-3 border-t border-gray-100">
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
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          i < skill.level
                            ? "bg-primary border-purple-600"
                            : "bg-white border-gray-300 hover:border-purple-400"
                        }`}
                        title={`Level ${i + 1}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {skill.level} / 5
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
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
        className="w-full border-dashed border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Skill
      </Button>

      {skills.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No skills added yet. Click "Add Skill" to get started.
        </p>
      )}
    </div>
  );
}




